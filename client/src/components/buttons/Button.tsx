import { memo } from 'react';
import styles from 'styles/Layouts.module.scss';
import type { ButtonProps } from 'types/props';

function Button({ icon, text, onClick, className, disabled, responsive }: ButtonProps) {
  return (
    <div className={`${styles.button} ${className} ${disabled ? styles.buttonDisabled : ''}`} onClick={onClick}>
      {icon}
      <span className={`${icon && text ? styles.buttonTextWithIcon : ''} ${responsive ? styles.buttonResponsive : ''}`}>
        {text}
      </span>
    </div>
  );
}

export default memo(Button);
