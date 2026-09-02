import { memo } from 'react';
import { File, Folder } from 'components/objects';
import { useCheckBoxStore, useHomeStore } from 'hooks/stores';
import styles from 'styles/Layouts.module.scss';
import type { ObjectProps } from 'types/props';

function Objects({ check, intoFolder }: ObjectProps) {
  const objects = useHomeStore(state => state.objects);
  const chkSet = useCheckBoxStore(state => state.chkSet);
  const arr: React.ReactElement[] = [];
  const checkMode = chkSet.size > 0;

  objects.forEach(({ type, name, size }) => {
    if (type === 'folder') {
      arr.push(
        <Folder
          key={name}
          name={name}
          check={check}
          checked={chkSet.has(name)}
          checkMode={checkMode}
          intoFolder={intoFolder}
        />,
      );
    } else {
      arr.push(
        <File
          key={name}
          name={name}
          check={check}
          checked={chkSet.has(name)}
          checkMode={checkMode}
          size={size}
        />,
      );
    }
  });

  return (
    <div className={styles.objectContainer}>
      {arr}
    </div>
  );
}

export default memo(Objects);
