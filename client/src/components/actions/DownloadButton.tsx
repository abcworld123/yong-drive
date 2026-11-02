import { useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { Button, Dropdown } from 'components/buttons';
import { useCheckBoxStore, useHomeStore } from 'hooks/stores';
import { DownloadIcon } from 'svg/icons';
import { downloadEach, downloadObjects } from 'utils/download';
import type { ClipboardButtonProps, DropdownItem } from 'types/props';

export default function DownloadButton({ checkMode }: ClipboardButtonProps) {
  const [bucket, path] = useHomeStore(useShallow(state => [state.bucket, state.path]));
  const multiple = useCheckBoxStore(state => state.chkSet.size > 1);

  const menuItems: DropdownItem[] = useMemo(() => {
    const checked = () => [...useCheckBoxStore.getState().chkSet];
    return [
      { name: '압축해서 받기', action: () => downloadObjects(bucket, path, checked()) },
      { name: '개별로 받기', action: () => downloadEach(bucket, path, checked()) },
    ];
  }, [bucket, path]);

  if (multiple) {
    return (
      <Dropdown
        id="download"
        items={menuItems}
        icon={<DownloadIcon />}
        text="다운로드"
        responsive
      />
    );
  }

  return (
    <Button
      icon={<DownloadIcon />}
      text="다운로드"
      className={checkMode ? '' : 'hidden'}
      onClick={() => downloadObjects(bucket, path, [...useCheckBoxStore.getState().chkSet])}
      responsive
    />
  );
}
