import { memo } from 'react';
import FileTypeIcon from './FileTypeIcon';

function ImageFileIcon() {
  return (
    <FileTypeIcon color="#1fa2c9" page="#dbf0f6" fold="#a5dae9">
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <circle cx="8.6" cy="9.6" r="1.9" fill="currentColor" stroke="none" />
      <path d="M3.6 17.4l5-4.6 3.6 3.1 3-2.6 5.2 4.4" />
    </FileTypeIcon>
  );
}

export default memo(ImageFileIcon);
