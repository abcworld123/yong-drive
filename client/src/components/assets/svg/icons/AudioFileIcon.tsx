import { memo } from 'react';
import FileTypeIcon from './FileTypeIcon';

function AudioFileIcon() {
  return (
    <FileTypeIcon color="#ec4f86" page="#fce3ec" fold="#f7b9cf">
      <path d="M9 17.4V6.4l10.2-2.6v11" />
      <circle cx="6.5" cy="17.4" r="2.7" fill="currentColor" stroke="none" />
      <circle cx="16.7" cy="14.8" r="2.7" fill="currentColor" stroke="none" />
    </FileTypeIcon>
  );
}

export default memo(AudioFileIcon);
