import type { DownloadBody } from './apis';
import type { GetServerSidePropsContext } from 'next';
import type { DropzoneOptions } from 'react-dropzone';

type checkHandler = (name: string) => void;

export interface HomeProps {
  bucket: string;
  path: string;
}

export interface BucketProps {
  name: string;
  intoBucket: (bucket: string) => void;
}

export interface ObjectProps {
  check: checkHandler;
  intoFolder: (folder: string) => void;
}

export interface ControlProps {
  checkMode: boolean;
}

export interface FolderProps {
  name: string;
  check: checkHandler;
  checked: boolean;
  checkMode: boolean;
  intoFolder: (name: string) => void;
}

export interface FileProps {
  name: string;
  check: checkHandler;
  checked: boolean;
  checkMode: boolean;
  size: number;
}

export interface DownloaderProps {
  body: DownloadBody;
}

export interface ButtonProps {
  onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  icon?: string | React.ReactElement;
  text?: string | React.ReactElement;
  className?: string;
  disabled?: boolean;
  responsive?: boolean;
}

export interface CheckBoxProps {
  checked: boolean;
  toggleCheck?: () => void;
  disabled?: boolean;
}

export interface DropdownItem {
  name: string;
  action: () => void;
}

export interface DropdownProps {
  id: string;
  items: DropdownItem[];
  icon?: string | React.ReactElement;
  text?: string | React.ReactElement;
  className?: string;
  disabled?: boolean;
  responsive?: boolean;
}

export interface ClipboardButtonProps {
  checkMode: boolean;
}

export interface DndWrapperProps {
  onDrop: DropzoneOptions['onDrop'];
  children: React.ReactElement;
}

export interface DndOverlayProps {
  show: boolean;
}

// ssr
export interface HomeServerSideContext extends GetServerSidePropsContext {
  query: {
    bucket: string;
    path?: string[];
  };
}
