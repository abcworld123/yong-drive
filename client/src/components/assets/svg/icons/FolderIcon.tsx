import { memo } from 'react';
import styles from 'styles/Icons.module.scss';
import type { FolderIconProps } from 'types/props';

function FolderIcon({ empty = false }: FolderIconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={styles.typeIcon}>
      <path d="M6 13a3 3 0 0 1 3-3h9.3a3 3 0 0 1 2.1.9l2.2 2.1H39a3 3 0 0 1 3 3V37a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3Z" fill="#d09a34" />
      {!empty && <rect x="10" y="13.5" width="28" height="10" rx="1.5" fill="#ffffff" />}
      <path d="M6 19.5a3 3 0 0 1 3-3h30a3 3 0 0 1 3 3V37a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3Z" fill="#f2b33d" />
      <path d="M9.5 19.6h29" stroke="#f7ce81" strokeWidth={1.2} strokeLinecap="round" />
    </svg>
  );
}

export default memo(FolderIcon);
