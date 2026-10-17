import { useCallback } from 'react';
import { Button } from 'components/buttons';
import { useCheckBoxStore, useClipboardStore, useHomeStore } from 'hooks/stores';
import { CopyIcon } from 'svg/icons';
import type { ClipboardButtonProps } from 'types/props';

export default function CopyButton({ checkMode }: ClipboardButtonProps) {
  const copy = useCallback(() => {
    const { bucket, path } = useHomeStore.getState();
    const { chkSet } = useCheckBoxStore.getState();
    useCheckBoxStore.setState({ chkAll: false, chkSet: new Set() });
    useClipboardStore.setState({
      bucket,
      pathFrom: path,
      objects: [...chkSet],
      mode: 'copy',
    });
  }, []);

  return (
    <Button
      icon={<CopyIcon />}
      text="복사"
      className={checkMode ? '' : 'hidden'}
      onClick={copy}
      responsive
    />
  );
}
