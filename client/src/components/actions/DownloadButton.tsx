import { useCallback, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { Button } from 'components/buttons';
import { Downloader } from 'components/utils';
import { useCheckBoxStore, useHomeStore } from 'hooks/stores';
import { DownloadIcon } from 'svg/icons';
import type { DownloadBody } from 'types/apis';
import type { ClipboardButtonProps } from 'types/props';

export default function DownloadButton({ checkMode }: ClipboardButtonProps) {
  const [bucket, path] = useHomeStore(useShallow(state => [state.bucket, state.path]));
  const [downloadBody, setDownloadBody] = useState<DownloadBody>(null);

  // download
  const downloadObject = useCallback(async () => {
    const { chkSet } = useCheckBoxStore.getState();
    const filenames = [...chkSet];
    const body: DownloadBody = {
      bucket: bucket,
      path: path,
      filenames: filenames,
    };
    try {
      setDownloadBody(body);
      // todo iframe post 500 error?
    } catch (err) {
      console.error(err);
    }
  }, [bucket, path]);

  return (
    <>
      <Button
        icon={<DownloadIcon />}
        text="다운로드"
        className={checkMode ? '' : 'hidden'}
        onClick={downloadObject}
        responsive
      />
      <Downloader body={downloadBody} />
    </>
  );
}
