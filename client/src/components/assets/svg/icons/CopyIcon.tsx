import { memo } from 'react';
import styles from 'styles/Icons.module.scss';

function CopyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={styles.button}>
      <path d="M39 40H13q-1.2 0-2.1-.9-.9-.9-.9-2.1V5q0-1.2.9-2.1.9-.9 2.1-.9h17.4L42 13.6V37q0 1.2-.9 2.1-.9.9-2.1.9ZM28.9 14.9V5H13v32h26V14.9ZM7 46q-1.2 0-2.1-.9Q4 44.2 4 43V12.05h3V43h24.9v3Zm6-41v9.9V5v32V5Z" />
    </svg>
  );
}

export default memo(CopyIcon);
