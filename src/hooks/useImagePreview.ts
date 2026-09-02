import { useCallback, useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { useHomeStore } from 'hooks/stores';
import { dropPreview, isPreviewable, loadPreview } from 'utils/preview';

/**
 * 이미지 파일이면 화면에 들어올 때 원본을 받아 object url로 돌려준다.
 * 미리보기 대상이 아니거나 실패하면 null → 호출부에서 아이콘으로 폴백한다.
 */
export default function useImagePreview(name: string, size: number) {
  const [bucket, path] = useHomeStore(useShallow(state => [state.bucket, state.path]));
  const [url, setUrl] = useState<string>(null);
  const ref = useRef<HTMLDivElement>(null);
  const previewable = isPreviewable(name, size);

  useEffect(() => {
    setUrl(null);
    if (!previewable || !ref.current) return;

    let alive = true;
    const observer = new IntersectionObserver(async ([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const objectUrl = await loadPreview(bucket, path, name, size);
      if (alive) setUrl(objectUrl);
    }, { rootMargin: '300px' });

    observer.observe(ref.current);

    return () => {
      alive = false;
      observer.disconnect();
    };
  }, [bucket, path, name, size, previewable]);

  const failPreview = useCallback(() => {
    dropPreview(bucket, path, name, size);
    setUrl(null);
  }, [bucket, path, name, size]);

  return { ref, url, failPreview };
}
