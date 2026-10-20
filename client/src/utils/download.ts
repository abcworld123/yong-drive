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
