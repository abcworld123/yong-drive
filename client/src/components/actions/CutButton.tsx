import { useCallback } from 'react';
import { Button } from 'components/buttons';
import { useCheckBoxStore, useClipboardStore, useHomeStore } from 'hooks/stores';
import { CutIcon } from 'svg/icons';
import type { ClipboardButtonProps } from 'types/props';

export default function CutButton({ checkMode }: ClipboardButtonProps) {
  const cut = useCallback(() => {
    const { bucket, path } = useHomeStore.getState();
    const { chkSet } = useCheckBoxStore.getState();
    useCheckBoxStore.setState({ chkAll: false, chkSet: new Set() });
    useClipboardStore.setState({
      bucket,
      pathFrom: path,
      objects: [...chkSet],
      mode: 'cut',
    });
  }, []);

  return (
    <Button
      icon={<CutIcon />}
      text="잘라내기"
      className={checkMode ? '' : 'hidden'}
      onClick={cut}
      responsive
    />
  );
}
