import { memo } from 'react';
import FileTypeIcon from './FileTypeIcon';

function TextFileIcon() {
  return (
    <FileTypeIcon color="#5a6b80" page="#e5e7eb" fold="#bdc4cc">
      <path d="M5.5 6.5h13M5.5 12h13M5.5 17.5h8" />
    </FileTypeIcon>
  );
}

export default memo(TextFileIcon);
