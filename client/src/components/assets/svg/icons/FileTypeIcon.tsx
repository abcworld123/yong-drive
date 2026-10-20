import { memo } from 'react';
import styles from 'styles/Icons.module.scss';
import type { FileTypeIconProps } from 'types/props';

const PAGE = 'M13 4h16.2L39 13.8V40a4 4 0 0 1-4 4H13a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4Z';
const FOLD = 'M29.2 4v6.3a3.5 3.5 0 0 0 3.5 3.5H39Z';

function FileTypeIcon({ color, page, fold, children }: FileTypeIconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={styles.typeIcon}>
      <path d={PAGE} fill={page} />
      <path d={FOLD} fill={fold} />
      {children && (
        // Glyphs are drawn on a 24x24 grid and scaled to 17 units in the page body.
        <g
          transform="translate(15.5 20.5) scale(0.70833)"
          color={color}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.68}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {children}
        </g>
      )}
    </svg>
  );
}

export default memo(FileTypeIcon);
