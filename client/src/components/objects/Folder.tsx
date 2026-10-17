import { memo, useCallback } from 'react';
import { LongPressEventType, useLongPress } from 'use-long-press';
import { CheckBox } from 'components/buttons';
import styles from 'styles/Layouts.module.scss';
import { FolderIcon } from 'svg/icons';
import type { FolderProps } from 'types/props';

function Folder({ name, check, checked, checkMode, intoFolder }: FolderProps) {
  const toggleCheck = useCallback(() => {
    check(name);
  }, [check, name]);

  const longPressBind = useLongPress(!checkMode ? toggleCheck : null, {
    threshold: 400,
    captureEvent: true,
    cancelOnMovement: false,
    detect: LongPressEventType.Touch,
  });

  const clickFolder = useCallback((target: EventTarget, name: string) => {
    if (target instanceof HTMLLabelElement || target instanceof HTMLInputElement) return;  // isCheckBox
    if (!checkMode) {
      intoFolder(name);
    } else {
      toggleCheck();
    }
  }, [checkMode, intoFolder, toggleCheck]);

  return (
    <div>
      <div className={`${styles.objectIcon} ${checked ? styles.checkedObjectIcon : ''} cursor-pointer`} onClick={e => clickFolder(e.target, name)}>
        <CheckBox checked={checked} toggleCheck={toggleCheck} />
        <div {...longPressBind()} className="grid place-items-center">
          <FolderIcon />
        </div>
      </div>
      <div title={name.slice(0, -1)} className={`${styles.objectName} mt-5`}>
        {name.slice(0, -1)}
      </div>
    </div>
  );
}

export default memo(Folder);
