import { memo } from 'react';
import styles from 'styles/Layouts.module.scss';
import { formatTime } from 'utils/tools';
import type { ObjectTimeProps } from 'types/props';

function ObjectTime({ mtime }: ObjectTimeProps) {
  if (mtime == null) return null;
  const { date, time } = formatTime(mtime);

  return (
    <div title={`${date} ${time}`} className={`${styles.objectName} ${styles.objectMeta} mt-0.5`}>
      {date}
      <span className={styles.objectMetaTime}> {time}</span>
    </div>
  );
}

export default memo(ObjectTime);
