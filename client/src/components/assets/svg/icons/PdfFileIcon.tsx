import { memo } from 'react';
import FileTypeIcon from './FileTypeIcon';

function PdfFileIcon() {
  return (
    <FileTypeIcon color="#e2443f" page="#fae1e0" fold="#f3b4b2">
      <text x="12" y="15.4" textAnchor="middle" fontSize="9.4" fontWeight="800" letterSpacing="-0.2" fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" fill="currentColor" stroke="none">PDF</text>
    </FileTypeIcon>
  );
}

export default memo(PdfFileIcon);
