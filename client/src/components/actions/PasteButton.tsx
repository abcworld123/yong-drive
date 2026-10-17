import { useCallback } from 'react';
import { Button } from 'components/buttons';
import { useClipboardStore, useHomeStore } from 'hooks/stores';
import { PasteIcon } from 'svg/icons';
import { alertError } from 'utils/alerts';
import api from 'utils/api';
import { toastSuccess } from 'utils/toasts';
import type { ResDefault } from 'types/apis';

export default function PasteButton() {
  const reload = useHomeStore(state => state.reload);
  const mode = useClipboardStore(state => state.mode);

  const paste = useCallback(async () => {
    const from = useClipboardStore.getState();
    const pathTo = useHomeStore.getState().path;
    const body = {
      ...from,
      pathTo,
    };
    try {
      const msg = mode === 'copy' ? '복사' : '이동';
      const { data } = await api.post<ResDefault>('/object/paste', body);
      if (!data.success) throw new Error(`${msg} 오류`);
      toastSuccess(`${msg} 완료!`);
      reload();
    } catch (err) {
      alertError(err.message);
      console.error(err);
    }
    useClipboardStore.setState({
      bucket: '',
      pathFrom: '',
      objects: [],
      mode: null,
    });
  }, [mode, reload]);

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
