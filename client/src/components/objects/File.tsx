import { memo, useCallback } from 'react';
import type { ComponentType } from 'react';
import { LongPressEventType, useLongPress } from 'use-long-press';
import { CheckBox } from 'components/buttons';
import { useImagePreview } from 'hooks';
import styles from 'styles/Layouts.module.scss';
import {
  FileIcon, TextFileIcon, ImageFileIcon, VideoFileIcon, AudioFileIcon,
  PdfFileIcon, WordFileIcon, ExcelFileIcon, PptFileIcon,
  ArchiveFileIcon, CodeFileIcon, FontFileIcon, DatabaseFileIcon,
} from 'svg/icons';
import { convUnit, fileExt } from 'utils/tools';
import type { FileProps } from 'types/props';

const EXT_ICON_MAP: Record<string, ComponentType> = {
  // Image
  jpg: ImageFileIcon, jpeg: ImageFileIcon, png: ImageFileIcon, gif: ImageFileIcon,
  bmp: ImageFileIcon, webp: ImageFileIcon, svg: ImageFileIcon, ico: ImageFileIcon,
  tiff: ImageFileIcon, tif: ImageFileIcon, avif: ImageFileIcon, heic: ImageFileIcon, heif: ImageFileIcon,
  // Video
  mp4: VideoFileIcon, avi: VideoFileIcon, mov: VideoFileIcon, mkv: VideoFileIcon,
  webm: VideoFileIcon, wmv: VideoFileIcon, flv: VideoFileIcon, m4v: VideoFileIcon, ogv: VideoFileIcon,
  // Audio
  mp3: AudioFileIcon, wav: AudioFileIcon, flac: AudioFileIcon, aac: AudioFileIcon,
  ogg: AudioFileIcon, m4a: AudioFileIcon, wma: AudioFileIcon, opus: AudioFileIcon,
  // PDF
  pdf: PdfFileIcon,
  // Word / Document
  doc: WordFileIcon, docx: WordFileIcon, odt: WordFileIcon, rtf: WordFileIcon,
  // Excel / Spreadsheet
  xls: ExcelFileIcon, xlsx: ExcelFileIcon, csv: ExcelFileIcon, ods: ExcelFileIcon,
  // PowerPoint / Presentation
  ppt: PptFileIcon, pptx: PptFileIcon, odp: PptFileIcon,
  // Archive
  zip: ArchiveFileIcon, tar: ArchiveFileIcon, gz: ArchiveFileIcon, rar: ArchiveFileIcon,
  '7z': ArchiveFileIcon, bz2: ArchiveFileIcon, xz: ArchiveFileIcon, zst: ArchiveFileIcon,
  // Code / Text
  js: CodeFileIcon, ts: CodeFileIcon, jsx: CodeFileIcon, tsx: CodeFileIcon,
  py: CodeFileIcon, java: CodeFileIcon, cpp: CodeFileIcon, c: CodeFileIcon,
  cs: CodeFileIcon, go: CodeFileIcon, rs: CodeFileIcon, rb: CodeFileIcon,
  php: CodeFileIcon, html: CodeFileIcon, css: CodeFileIcon, scss: CodeFileIcon,
  json: CodeFileIcon, xml: CodeFileIcon, yaml: CodeFileIcon, yml: CodeFileIcon,
  sh: CodeFileIcon, bash: CodeFileIcon,
  // Plain text
  txt: TextFileIcon, md: TextFileIcon,
  sql: CodeFileIcon, toml: CodeFileIcon, ini: CodeFileIcon,
  // Font
  ttf: FontFileIcon, otf: FontFileIcon, woff: FontFileIcon, woff2: FontFileIcon, eot: FontFileIcon,
  // Database
  db: DatabaseFileIcon, sqlite: DatabaseFileIcon, sqlite3: DatabaseFileIcon,
  mdb: DatabaseFileIcon, accdb: DatabaseFileIcon,
};

function File({ name, check, checked, checkMode, size }: FileProps) {
  const IconComponent = EXT_ICON_MAP[fileExt(name)] ?? FileIcon;
  const sizeText = convUnit(size);
  const { ref, url, failPreview } = useImagePreview(name, size);

  const toggleCheck = useCallback(() => {
    check(name);
  }, [check, name]);

  const longPressBind = useLongPress(!checkMode ? toggleCheck : null, {
    threshold: 400,
    captureEvent: true,
    cancelOnMovement: false,
    detect: LongPressEventType.Touch,
  });

  const clickFile = useCallback((target: EventTarget) => {
    if (target instanceof HTMLLabelElement || target instanceof HTMLInputElement) return;  // isCheckBox
    if (checkMode) {
      toggleCheck();
    }
  }, [checkMode, toggleCheck]);

  return (
    <div>
      <div ref={ref} className={`${styles.objectIcon} ${checked ? styles.checkedObjectIcon : ''} ${url ? styles.previewObjectIcon : ''} cursor-pointer`} onClick={e => clickFile(e.target)}>
        <CheckBox checked={checked} toggleCheck={toggleCheck} />
        <div {...longPressBind()} className="grid place-items-center overflow-hidden">
          { url
            // eslint-disable-next-line @next/next/no-img-element -- blob object url이라 next/image 최적화 대상이 아님
            ? <img src={url} alt={name} className={styles.objectImage} onError={failPreview} draggable={false} />
            : <IconComponent /> }
        </div>
      </div>
      <div title={name} className={`${styles.objectName} mt-5`}>
        {name}
      </div>
      <div title={sizeText} className={`${styles.objectName} mt-2 text-neutral-400`}>
        {sizeText}
      </div>
    </div>
  );
}

export default memo(File);
