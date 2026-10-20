import Swal from 'sweetalert2';
import { alertError } from 'utils/alerts';
import { isUnauthorized } from 'utils/api';
import { fetchObject } from 'utils/download';
import { convUnit, fileExt } from 'utils/tools';

const TEXT_EXTS = new Set(['txt', 'md', 'log']);
const MAX_TEXT_SIZE = 1024 * 1024;

export function isTextPreviewable(name: string) {
  return TEXT_EXTS.has(fileExt(name));
}

function decodeText(buf: ArrayBuffer) {
  try {
    // stream: true keeps a multi-byte char cut off by the size cap from failing the UTF-8 check.
    return new TextDecoder('utf-8', { fatal: true }).decode(buf, { stream: true });
  } catch {
    // Korean text saved by older Windows tools is usually CP949.
    return new TextDecoder('euc-kr').decode(buf);
  }
}

async function fetchText(bucket: string, path: string, name: string, size: number) {
  const truncated = size > MAX_TEXT_SIZE;
  const { data } = await fetchObject<ArrayBuffer>(bucket, path, name, {
    responseType: 'arraybuffer',
    headers: truncated ? { Range: `bytes=0-${MAX_TEXT_SIZE - 1}` } : undefined,
  });
  // Slice anyway in case the server ignored the Range header and sent the whole file.
  return { text: decodeText(data.slice(0, MAX_TEXT_SIZE)), truncated };
}

export async function openTextPreview(bucket: string, path: string, name: string, size: number) {
  const container = document.createElement('div');
  const pre = document.createElement('pre');
  pre.className = 'max-h-[65vh] overflow-auto whitespace-pre-wrap break-all rounded-md bg-neutral-100 p-4 text-left font-mono text-[13px] leading-relaxed text-neutral-800';
  pre.textContent = '불러오는 중...';
  container.appendChild(pre);
  const isShowing = () => Swal.getHtmlContainer()?.contains(container) ?? false;

  Swal.fire({
    titleText: name,  // titleText, not title: the file name must not be parsed as HTML
    html: container,
    width: '64rem',
    showCloseButton: true,
    confirmButtonText: '닫기',
    didOpen: () => Swal.showLoading(),
  });

  try {
    const { text, truncated } = await fetchText(bucket, path, name, size);
    if (!isShowing()) return;
    pre.textContent = text || '(빈 파일)';
    if (truncated) {
      const note = document.createElement('p');
      note.className = 'mt-3 text-sm text-neutral-500';
      note.textContent = `전체 ${convUnit(size)} 중 앞부분 ${convUnit(MAX_TEXT_SIZE)}만 표시합니다.`;
      container.appendChild(note);
    }
    Swal.hideLoading();
  } catch (err) {
    if (isUnauthorized(err) || !isShowing()) return;
    alertError(err.message);
  }
}
