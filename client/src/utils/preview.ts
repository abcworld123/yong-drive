import { fetchObject } from 'utils/download';
import { fileExt } from 'utils/tools';

// <img>로 바로 그릴 수 있는 확장자만 미리보기 대상 (tiff, heic 등은 아이콘 유지)
const PREVIEW_MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
  bmp: 'image/bmp', webp: 'image/webp', avif: 'image/avif',
  svg: 'image/svg+xml', ico: 'image/x-icon',
};

const MAX_PREVIEW_SIZE = 20 * 1024 * 1024;  // 원본을 그대로 받으므로 큰 파일은 제외
const MAX_CACHE_SIZE = 120;
const MAX_CONCURRENCY = 4;

const cache = new Map<string, string>();  // key -> object url (삽입 순서 = LRU)
const loading = new Map<string, Promise<string>>();
const waiting: (() => void)[] = [];
let running = 0;

function acquire() {
  if (running < MAX_CONCURRENCY) {
    running += 1;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => waiting.push(resolve));
}

function release() {
  const next = waiting.shift();
  if (next) next();  // 슬롯을 그대로 넘겨줌
  else running -= 1;
}

function cacheKey(bucket: string, path: string, name: string, size: number) {
  return `${bucket}|${path}${name}|${size}`;
}

function revoke(key: string) {
  const url = cache.get(key);
  if (!url) return;
  URL.revokeObjectURL(url);
  cache.delete(key);
}

function putCache(key: string, url: string) {
  cache.set(key, url);
  while (cache.size > MAX_CACHE_SIZE) {
    const oldest = cache.keys().next().value;
    revoke(oldest);
  }
}

async function fetchPreview(bucket: string, path: string, name: string) {
  await acquire();
  try {
    const res = await fetchObject<Blob>(bucket, path, name, { responseType: 'blob' });
    // 서버는 octet-stream으로 내려주므로 확장자 기준 MIME을 다시 붙인다
    const blob = new Blob([res.data], { type: PREVIEW_MIME[fileExt(name)] });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error(err);
    return null;
  } finally {
    release();
  }
}

export function isPreviewable(name: string, size: number) {
  if (!PREVIEW_MIME[fileExt(name)]) return false;
  return !(size > MAX_PREVIEW_SIZE);
}

export function loadPreview(bucket: string, path: string, name: string, size: number) {
  const key = cacheKey(bucket, path, name, size);

  const cached = cache.get(key);
  if (cached) {
    cache.delete(key);  // LRU 갱신
    cache.set(key, cached);
    return Promise.resolve(cached);
  }

  const inflight = loading.get(key);
  if (inflight) return inflight;

  const promise = fetchPreview(bucket, path, name).then((url) => {
    if (url) putCache(key, url);
    loading.delete(key);
    return url;
  });
  loading.set(key, promise);
  return promise;
}

export function dropPreview(bucket: string, path: string, name: string, size: number) {
  revoke(cacheKey(bucket, path, name, size));
}
