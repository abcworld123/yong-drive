import { memo } from 'react';
import FileTypeIcon from './FileTypeIcon';

function FontFileIcon() {
  return (
    <FileTypeIcon color="#c04fd0" page="#f5e3f7" fold="#e6b9ec">
      <text x="12" y="17.6" textAnchor="middle" fontSize="15.5" fontWeight="700" fontFamily="Georgia, 'Times New Roman', serif" fill="currentColor" stroke="none">Aa</text>
    </FileTypeIcon>
  );
}

export default memo(FontFileIcon);
