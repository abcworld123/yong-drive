import { useCallback, useRef } from 'react';
import { Button } from 'components/buttons';
import { useClipboardStore, useHomeStore } from 'hooks/stores';
import { PasteIcon } from 'svg/icons';
import { alertError } from 'utils/alerts';
import api, { isUnauthorized } from 'utils/api';
import { resolveConflicts } from 'utils/pasteConflict';
import { toastInfo, toastSuccess, toastWarning } from 'utils/toasts';
import type { PasteBody, ResDefault, ResPasteConflicts } from 'types/apis';

function clearClipboard() {
  useClipboardStore.setState({
    bucket: '',
    pathFrom: '',
    objects: [],
    mode: null,
  });
}

export default function PasteButton() {
  const reload = useHomeStore(state => state.reload);
  const mode = useClipboardStore(state => state.mode);
  const busy = useRef(false);

  const paste = useCallback(async () => {
    if (busy.current) return;
    const { bucket, pathFrom, objects, mode } = useClipboardStore.getState();
    const { bucket: bucketTo, path: pathTo } = useHomeStore.getState();
    const verb = mode === 'copy' ? '복사' : '이동';

    if (mode === 'cut' && bucket === bucketTo && pathFrom === pathTo) {
      toastWarning('원래 있던 위치입니다.');
      return;
    }

    const body: PasteBody = { bucket, bucketTo, pathFrom, pathTo, objects, mode };
    busy.current = true;
    try {
      const { data: check } = await api.post<ResPasteConflicts>('/object/paste/conflicts', body);
      const missing = check.missing ?? [];
      if (missing.length === objects.length) {
        clearClipboard();
        alertError('원본을 찾을 수 없습니다. 이미 옮겨졌거나 삭제되었을 수 있습니다.');
        return;
      }

      const resolutions = await resolveConflicts(check.conflicts ?? []);
      if (!resolutions) return;  // canceled: keep the clipboard so the user can paste somewhere else

      const skipped = Object.values(resolutions).filter(r => r === 'skip').length;
      if (skipped + missing.length === objects.length) {
        clearClipboard();
        toastInfo('모든 항목을 건너뛰었습니다.');
        return;
      }

      const { data } = await api.post<ResDefault>('/object/paste', { ...body, resolutions });
      if (!data.success) throw new Error(`${verb} 오류`);
      clearClipboard();
      const notes = [
        skipped > 0 ? `${skipped}개 건너뜀` : null,
        missing.length > 0 ? `${missing.length}개는 원본 없음` : null,
      ].filter(Boolean);
      toastSuccess(notes.length > 0 ? `${verb} 완료! (${notes.join(', ')})` : `${verb} 완료!`);
      reload();
    } catch (err) {
      // The clipboard is kept on failure so the paste can be retried (e.g. after logging in again).
      if (!isUnauthorized(err)) alertError(err.message);
      console.error(err);
      // Items before the failing one may already have been moved.
      reload();
    } finally {
      busy.current = false;
    }
  }, [reload]);

  return (
    <Button
      icon={<PasteIcon />}
      text="붙여넣기"
      className={mode ? '' : 'hidden'}
      onClick={paste}
      responsive
    />
  );
}
