import { useCallback } from 'react';
import Swal from 'sweetalert2';
import { useShallow } from 'zustand/shallow';
import { Button } from 'components/buttons';
import { useHomeStore } from 'hooks/stores';
import { CreateFolderIcon } from 'svg/icons';
import { alertError } from 'utils/alerts';
import api from 'utils/api';
import { toastSuccess } from 'utils/toasts';
import type { CreateFolderBody, ResWithErrMsg } from 'types/apis';

export default function CreateFolderButton() {
  const [bucket, path, reload] = useHomeStore(useShallow(state => [state.bucket, state.path, state.reload]));

  // create new folder
  const createFolder = useCallback(async () => {
    const { value, isConfirmed } = await alertCreateFolder();
    if (!isConfirmed) return;
    const body: CreateFolderBody = {
      bucket: bucket,
      path: path,
      foldername: value,
    };
    try {
      const { data } = await api.post<ResWithErrMsg>('/object/create', body);
      if (!data.success) {
        if (data.errMsg) throw new Error(data.errMsg);
        else throw new Error('폴더 생성 오류');
      }
      toastSuccess('폴더 생성 완료!');
      reload();
    } catch (err) {
      alertError(err.message);
      console.error(err);
    }
  }, [bucket, path, reload]);

  return (
    <Button
      icon={<CreateFolderIcon />}
      text="새 폴더"
      onClick={createFolder}
      responsive
    />
  );
}

function alertCreateFolder() {
  return Swal.fire({
    icon: 'info',
    title: '폴더 이름을 입력해주세요.',
    input: 'text',
    showCancelButton: true,
    confirmButtonText: '확인',
    cancelButtonText: '취소',
    confirmButtonColor: '#13a829',
    cancelButtonColor: '#cc2121',
    preConfirm: (name: string) => {
      if (!name) {
        Swal.showValidationMessage('폴더 이름을 입력해주세요.');
      } else if (name.includes('/')) {
        Swal.showValidationMessage('폴더 이름에는 "/"이 들어갈 수 없습니다.');
      } else if (new Blob([name]).size > 1024) {
        Swal.showValidationMessage('이름은 최대 1024바이트까지 설정 가능합니다.');
      }
      return name;
    },
  });
}
