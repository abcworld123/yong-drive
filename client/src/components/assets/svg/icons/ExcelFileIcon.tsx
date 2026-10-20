import { memo } from 'react';
import FileTypeIcon from './FileTypeIcon';

function ExcelFileIcon() {
  return (
    <FileTypeIcon color="#1e9b5a" page="#dbefe5" fold="#a5d7bd">
      <rect x="3.5" y="4" width="17" height="16" rx="2.2" />
      <path d="M3.5 9.8h17M3.5 14.6h17M10 4v16" />
    </FileTypeIcon>
  );
}

export default memo(ExcelFileIcon);
