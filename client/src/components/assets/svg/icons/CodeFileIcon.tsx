import { memo } from 'react';
import FileTypeIcon from './FileTypeIcon';

function CodeFileIcon() {
  return (
    <FileTypeIcon color="#334155" page="#dee1e4" fold="#adb3bb">
      <path d="M8 7.5L3.5 12 8 16.5M16 7.5l4.5 4.5-4.5 4.5M13.6 5.2l-3.2 13.6" />
    </FileTypeIcon>
  );
}

export default memo(CodeFileIcon);
