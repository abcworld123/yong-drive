import { memo } from 'react';
import FileTypeIcon from './FileTypeIcon';

function PptFileIcon() {
  return (
    <FileTypeIcon color="#ef7a2f" page="#fceade" fold="#f9caac">
      <rect x="2.5" y="3.5" width="19" height="13" rx="2" />
      <path d="M12 16.5v4M8.5 20.5h7" />
      <path d="M12 6.6v3.6h3.6A3.6 3.6 0 1 1 12 6.6z" fill="currentColor" stroke="none" />
    </FileTypeIcon>
  );
}

export default memo(PptFileIcon);
