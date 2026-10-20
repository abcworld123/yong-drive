import { memo } from 'react';
import FileTypeIcon from './FileTypeIcon';

function DatabaseFileIcon() {
  return (
    <FileTypeIcon color="#0ea5a0" page="#d8f1f0" fold="#9fdbd9">
      <ellipse cx="12" cy="6" rx="7" ry="2.6" />
      <path d="M5 6v12c0 1.45 3.1 2.6 7 2.6s7-1.15 7-2.6V6M5 12c0 1.45 3.1 2.6 7 2.6s7-1.15 7-2.6" />
    </FileTypeIcon>
  );
}

export default memo(DatabaseFileIcon);
