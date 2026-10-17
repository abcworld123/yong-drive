import { useCallback } from 'react';
import { useShallow } from 'zustand/shallow';
import { Button } from 'components/buttons';
import { useCheckBoxStore, useHomeStore } from 'hooks/stores';
import { DeleteIcon } from 'svg/icons';
import { alertConfirm, alertError, alertWait } from 'utils/alerts';
import api from 'utils/api';
import { toastSuccess } from 'utils/toasts';
import type { DeleteBody, ResDefault } from 'types/apis';
import type { ClipboardButtonProps } from 'types/props';

export default function DeleteButton({ checkMode }: ClipboardButtonProps) {
  const [bucket, path, reload] = useHomeStore(useShallow(state => [state.bucket, state.path, state.reload]));

  // delete
  const deleteObject = useCallback(async () => {
    const { chkSet } = useCheckBoxStore.getState();
    const isConfirmed = (await alertConfirm(
      '정말 삭제하시겠습니까?',
      '삭제된 항목은 복구할 수 없습니다.',
    )).isConfirmed;
    if (!isConfirmed) return;
    alertWait('삭제 중...');
    const body: DeleteBody = {
      bucket: bucket,
      path: path,
      objects: [...chkSet],
    };
    try {
      const { data } = await api.post<ResDefault>('/object/delete', body);
      if (!data.success) throw new Error('삭제 오류');
      toastSuccess('삭제 완료!');
      reload();
    } catch (err) {
      alertError(err.message);
      console.error(err);
    }
  }, [bucket, path, reload]);

  return (
    <Button
      icon={<DeleteIcon />}
      text="삭제"
      className={checkMode ? '' : 'hidden'}
      onClick={deleteObject}
      responsive
    />
  );
}
