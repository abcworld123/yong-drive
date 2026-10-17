import Image from 'next/image';
import { memo } from 'react';
import styles from 'styles/Dnd.module.scss';
import type { DndOverlayProps } from 'types/props';

function DndOverlay({ show }: DndOverlayProps) {
  return (
    <div className={`${styles.outer} ${show ? '' : styles.hide}`}>
      <div className={styles.inner}>
        <Image src="/img/dnd.png" width={160} height={160} alt="Drag & Drop" />
        <p className="">여기에 드롭하여 업로드</p>
      </div>
    </div>
  );
}

export default memo(DndOverlay);
