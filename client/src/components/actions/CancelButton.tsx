import { useCallback } from 'react';
import { Button } from 'components/buttons';
import { useClipboardStore } from 'hooks/stores';
import { CancelIcon } from 'svg/icons';

export default function CancelButton() {
  const objects = useClipboardStore(state => state.objects);

  const cancel = useCallback(() => {
    useClipboardStore.setState({
      bucket: '',
      pathFrom: '',
      objects: [],
      mode: null,
    });
  }, []);

  return (
    <Button
      icon={<CancelIcon />}
      text="취소"
      className={objects.length ? '' : 'hidden'}
      onClick={cancel}
      responsive
    />
  );
}
