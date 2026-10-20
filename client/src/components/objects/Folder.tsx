import { memo, useCallback } from 'react';
import type { MouseEvent } from 'react';
import { LongPressEventType, useLongPress } from 'use-long-press';
import { CheckBox } from 'components/buttons';
import ObjectTime from 'components/objects/ObjectTime';
import styles from 'styles/Layouts.module.scss';
import { FolderIcon } from 'svg/icons';
import { convUnit } from 'utils/tools';
import type { FolderProps } from 'types/props';

function Folder({ name, check, checked, checkMode, intoFolder, size, mtime, fileCount }: FolderProps) {
  const statText = fileCount == null ? null : fileCount === 0 ? '빈 폴더' : `${fileCount.toLocaleString()}개 · ${convUnit(size ?? 0)}`;

  const toggleCheck = useCallback(() => {
    check(name);
  }, [check, name]);

  const longPressBind = useLongPress(!checkMode ? toggleCheck : null, {
    threshold: 400,
    captureEvent: true,
    cancelOnMovement: false,
    detect: LongPressEventType.Touch,
  });

  const clickFolder = useCallback((e: MouseEvent) => {
    if (e.target instanceof HTMLLabelElement || e.target instanceof HTMLInputElement) return;  // isCheckBox
    if (checkMode || e.ctrlKey || e.metaKey) {
      toggleCheck();
    } else {
      intoFolder(name);
    }
  }, [checkMode, intoFolder, toggleCheck, name]);

  return (
    <div>
      <div className={`${styles.objectIcon} ${checked ? styles.checkedObjectIcon : ''} cursor-pointer`} onClick={clickFolder}>
        <CheckBox checked={checked} toggleCheck={toggleCheck} />
        <div {...longPressBind()} className="grid place-items-center">
          <FolderIcon />
        </div>
      </div>
      <div title={name.slice(0, -1)} className={`${styles.objectName} mt-5`}>
        {name.slice(0, -1)}
      </div>
      { statText != null && (
        <div title={statText} className={`${styles.objectName} ${styles.objectMeta} mt-1.5`}>
          {statText}
        </div>
      ) }
      <ObjectTime mtime={mtime} />
    </div>
  );
}

export default memo(Folder);
