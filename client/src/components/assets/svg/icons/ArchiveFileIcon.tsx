import { memo } from 'react';
import styles from 'styles/Icons.module.scss';

function ArchiveFileIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={styles.archiveFile}>
      <path d="M11 44q-1.2 0-2.1-.9Q8 42.2 8 41V7q0-1.2.9-2.1Q9.8 4 11 4h18.05L40 14.95V41q0 1.2-.9 2.1-.9.9-2.1.9Zm16.55-27.7V7H11v34h26V16.3ZM11 7v9.3V7v34V7Z" />
      <path d="M17 21h14v5H17zm-2 6h18v5H15zm-2 6h22v6H13z" />
    </svg>
  );
}

export default memo(ArchiveFileIcon);
