import { memo } from 'react';
import styles from 'styles/Icons.module.scss';

function AudioFileIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={styles.audioFile}>
      <path d="M11 44q-1.2 0-2.1-.9Q8 42.2 8 41V7q0-1.2.9-2.1Q9.8 4 11 4h18.05L40 14.95V41q0 1.2-.9 2.1-.9.9-2.1.9Zm16.55-27.7V7H11v34h26V16.3ZM11 7v9.3V7v34V7Z" />
      <path d="M17.5 34a3.5 2.5 0 1 0 7 0 3.5 2.5 0 0 0-7 0z" />
      <path d="M24.5 21h1.5v13.5h-1.5z" />
      <path d="M26 21q5 2 5 6.5l-1.5 1q0-4-3.5-5.5z" />
    </svg>
  );
}

export default memo(AudioFileIcon);
