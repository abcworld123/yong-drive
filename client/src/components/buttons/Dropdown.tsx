import { memo } from 'react';
import { useShallow } from 'zustand/shallow';
import { Button } from 'components/buttons';
import { useLayoutStore } from 'hooks/stores';
import styles from 'styles/Layouts.module.scss';
import type { DropdownProps } from 'types/props';

function Dropdown({ id, icon, text, items, className, disabled, responsive }: DropdownProps) {
  const [opened, dropdownClick] = useLayoutStore(useShallow(state => [state.dropdown, state.dropdownClick]));

  return (
    <div>
      <Button
        icon={icon}
        text={text}
        className={`btn-dropdown ${className}`}
        onClick={() => dropdownClick(id)}
        disabled={disabled}
        responsive={responsive}
      />
      <div className={`${styles.dropdownContainer} ${opened === id ? '' : 'opacity-0 pointer-events-none'}`}>
        <ul className={styles.dropdownMenu}>
          {items.map(item => <li key={item.name} className={styles.dropdownItem} onClick={item.action}>{item.name}</li>)}
        </ul>
      </div>
    </div>
  );
}

export default memo(Dropdown);
