import { memo } from 'react';
import FileTypeIcon from './FileTypeIcon';

function ArchiveFileIcon() {
  return (
    <FileTypeIcon color="#9a6a3a" page="#efe7df" fold="#d7c3b0">
      <rect x="3" y="4" width="18" height="5" rx="1.4" />
      <path d="M4.8 9v9.2A1.8 1.8 0 0 0 6.6 20h10.8a1.8 1.8 0 0 0 1.8-1.8V9M10 13h4" />
    </FileTypeIcon>
  );
}

export default memo(ArchiveFileIcon);
