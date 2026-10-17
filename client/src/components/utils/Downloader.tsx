import { useEffect } from 'react';
import api from 'utils/api';
import type { DownloaderProps } from 'types/props';

export default function Downloader({ body }: DownloaderProps) {
  useEffect(() => {
    if (!body) return;

    const { bucket, path, filenames } = body;

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `${api.defaults.baseURL}/object/download`;
    form.style.display = 'none';

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
  }, [body]);

  return null;
}
