import { memo } from 'react';
import {
  AllCheckBox,
  CancelButton,
  CopyButton,
  CreateFolderButton,
  CutButton,
  DeleteButton,
  DownloadButton,
  PasteButton,
  UploadButton,
} from 'components/actions';
import { ProgressCircle } from 'components/layouts';
import styles from 'styles/Layouts.module.scss';
import type { ControlProps } from 'types/props';

function Control({ checkMode }: ControlProps) {
  return (
    <div className={styles.controlContainer}>
      <AllCheckBox checkMode={checkMode} />
      <UploadButton />
      <CreateFolderButton />
      <PasteButton />
      <CutButton checkMode={checkMode} />
      <CopyButton checkMode={checkMode} />
      <DownloadButton checkMode={checkMode} />
      <DeleteButton checkMode={checkMode} />
      <CancelButton />
      <ProgressCircle />
    </div>
  );
}

export default memo(Control);
