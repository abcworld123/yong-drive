import { memo } from 'react';
import FileTypeIcon from './FileTypeIcon';

function WordFileIcon() {
  return (
    <FileTypeIcon color="#2f62d6" page="#dee6f8" fold="#acc0ef">
      <path d="M4 6l3.2 12L12 8.6 16.8 18 20 6" />
    </FileTypeIcon>
  );
}

export default memo(WordFileIcon);
