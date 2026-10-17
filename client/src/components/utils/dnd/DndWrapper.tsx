import { useDropzone } from 'react-dropzone';
import DndOverlay from './DndOverlay';
import type { DndWrapperProps } from 'types/props';

export default function DndWrapper({ onDrop, children }: DndWrapperProps) {
  const { getRootProps, isDragAccept } = useDropzone({ onDrop, noClick: true, noKeyboard: true });

  return (
    <div className="min-h-screen" {...getRootProps()}>
      {children}
      <DndOverlay show={isDragAccept} />
    </div>
  );
}
