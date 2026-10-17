import { memo } from 'react';
import styles from 'styles/Layouts.module.scss';
import type { CheckBoxProps } from 'types/props';

function CheckBox({ checked, toggleCheck, disabled }: CheckBoxProps) {

  return (
    <label className={styles.checkbox}>
      <input
        type="checkbox"
        checked={checked}
        onClick={toggleCheck ?? null}
        disabled={disabled ?? false}
        readOnly
      />
      <span />
    </label>
  );
}

export default memo(CheckBox);
