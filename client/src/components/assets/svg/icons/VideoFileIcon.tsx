import { memo } from 'react';
import FileTypeIcon from './FileTypeIcon';

function VideoFileIcon() {
  return (
    <FileTypeIcon color="#6d4fe0" page="#e8e3fa" fold="#c5b9f3">
      <path d="M8.5 5.6v12.8L18.8 12z" fill="currentColor" />
    </FileTypeIcon>
  );
}

export default memo(VideoFileIcon);
