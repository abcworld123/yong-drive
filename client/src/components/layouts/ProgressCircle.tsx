import { Circle } from 'rc-progress';
import { useShallow } from 'zustand/shallow';
import { useUploadStore } from 'hooks/stores';

export default function ProgressCircle() {
  const [isUploading, progVal] = useUploadStore(useShallow(state => [state.isUploading, state.progVal]));

  return (
    <Circle
      className={`w-12 ${isUploading ? '' : 'hidden'}`}
      percent={progVal}
      strokeWidth={8}
      trailWidth={2}
      strokeColor="#3fc3ee"
      trailColor="#ccc"
    />
  );
}
