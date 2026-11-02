import api from 'utils/api';
import type { AxiosRequestConfig } from 'axios';

// The download endpoint only reads a form-urlencoded body (ObjectController.download).
export function fetchObject<T>(bucket: string, path: string, name: string, config: AxiosRequestConfig) {
  const form = new URLSearchParams();
  form.append('bucket', bucket);
  form.append('path', path);
  form.append('filenames', name);
  return api.post<T>('/object/download', form, config);
}

let downloadSeq = 0;

// A native form POST lets the browser stream the file to disk (with its own progress UI)
// instead of buffering it in memory as a blob.
function submitDownload(bucket: string, path: string, filenames: string[], target?: string) {
  const form = document.createElement('form');
  form.method = 'POST';
  // The server ignores this key. Download managers such as the IDM extension take over a
  // download by replaying it and seem to key captured POSTs by URL, so identical URLs
  // collapsed several per-item downloads into one.
  form.action = `${api.defaults.baseURL}/object/download?dl=${Date.now().toString(36)}-${downloadSeq++}`;
  form.style.display = 'none';
  if (target) form.target = target;

  const append = (name: string, value: string) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  };

  append('bucket', bucket);
  append('path', path);
  filenames.forEach((name) => append('filenames', name));

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}

// One file comes back as-is; several items (or a folder) come back as one zip.
export function downloadObjects(bucket: string, path: string, filenames: string[]) {
  submitDownload(bucket, path, filenames);
}

const IFRAME_LIFETIME_MS = 60_000;
const STAGGER_MS = 300;

// Back-to-back form submits into the same browsing context cancel each other, so each
// download gets its own hidden iframe. Folders still arrive as their own zip.
export function downloadEach(bucket: string, path: string, filenames: string[]) {
  filenames.forEach((name, i) => {
    setTimeout(() => {
      const iframe = document.createElement('iframe');
      iframe.name = `download-${Date.now()}-${i}`;
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      submitDownload(bucket, path, [name], iframe.name);
      // Removing the iframe once the response has reached the download manager doesn't
      // cancel it; the delay only has to outlast the time to the first response byte.
      setTimeout(() => iframe.remove(), IFRAME_LIFETIME_MS);
    }, i * STAGGER_MS);
  });
}
