import { memo } from 'react';
import styles from 'styles/Icons.module.scss';

function ImageFileIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={styles.imageFile}>
      <path d="M11 44q-1.2 0-2.1-.9Q8 42.2 8 41V7q0-1.2.9-2.1Q9.8 4 11 4h18.05L40 14.95V41q0 1.2-.9 2.1-.9.9-2.1.9Zm16.55-27.7V7H11v34h26V16.3ZM11 7v9.3V7v34V7Z" />
      <path d="M13 38h22l-7-9.33-5.5 7-3.83-4.84ZM19.25 24.5q1.05 0 1.775-.725.725-.725.725-1.775 0-1.05-.725-1.775Q20.3 19.5 19.25 19.5q-1.05 0-1.775.725Q16.75 20.95 16.75 22q0 1.05.725 1.775.725.725 1.775.725Z" />
    </svg>
  );
}

export default memo(ImageFileIcon);
