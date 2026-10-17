import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/shallow';
import { Dropdown } from 'components/buttons';
import { useHomeStore, useUploadStore } from 'hooks/stores';
import { UploadIcon } from 'svg/icons';
import { alertError } from 'utils/alerts';
import api from 'utils/api';
import { toastSuccess } from 'utils/toasts';
import type { AxiosProgressEvent } from 'axios';
import type { ResDefault, UploadParams } from 'types/apis';
import type { DropdownItem } from 'types/props';

export default function UploadButton() {
  const [bucket, path, reload] = useHomeStore(useShallow(state => [state.bucket, state.path, state.reload]));
  const [setIsUploading, setProgVal] = useUploadStore(useShallow(state => [state.setIsUploading, state.setProgVal]));
  const inputFile = useRef<HTMLInputElement>(null);
  const inputFolder = useRef<HTMLInputElement>(null);

  // upload
  const upload = useCallback(async (files: File[]) => {
    if (!files.length) return;
    setIsUploading(true);
    const totalSize = files.reduce((a, b) => a + b.size, 0);
    let curSize = 0;
    try {
      for (const file of files) {
        let filepath: string = file['path'] || file.webkitRelativePath || file.name;
        filepath = filepath.replace(/^\.?\//, '');
        const params: UploadParams = {
          bucket: bucket,
          path: path,
          filename: filepath,
        };
        const { data } = await api.post<ResDefault>('/object/upload', file, {
          params,
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            setProgVal(Math.ceil(((curSize + progressEvent.loaded) * 100 / totalSize)));
          },
        });
        if (!data.success) throw new Error('업로드 오류');
        curSize += file.size;
      }
      toastSuccess('업로드 완료!');
      setIsUploading(false);
      reload();
    } catch (err) {
      alertError(err.message);
      console.error(err);
    } finally {
      setIsUploading(false);
      inputFile.current.value = inputFile.current.defaultValue;
    }
  }, [bucket, reload, path, setIsUploading, setProgVal]);

  const isMobile = useMemo(() => {
    return 'ontouchstart' in document.documentElement;
  }, []);

  const menuItems: DropdownItem[] = useMemo(() => {
    const fileUpload = { name: '파일 업로드', action: () => inputFile.current.click() };
    const folderUpload = { name: '폴더 업로드', action: () => inputFolder.current.click() };
    if (!isMobile) return [fileUpload, folderUpload];
    else return [fileUpload];
  }, [isMobile]);

  useEffect(() => {
    useUploadStore.setState({ uploadObject: upload });
  }, [upload]);

  return (
    <>
      <Dropdown
        id="upload"
        items={menuItems}
        icon={<UploadIcon />}
        text="올리기"
        responsive
      />
      <input
        type="file"
        className="hidden"
        ref={inputFile}
        onChange={(e) => upload([...e.target.files])}
        multiple
      />
      <input
        type="file"
        className="hidden"
        ref={inputFolder}
        onChange={(e) => upload([...e.target.files])}
        {...{ 'webkitdirectory': '' }}
      />
    </>
  );
}
