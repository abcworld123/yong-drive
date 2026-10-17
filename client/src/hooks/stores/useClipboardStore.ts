import { create } from 'zustand';

interface ClipboardStoreState {
  bucket: string;
  pathFrom: string;
  objects: string[];
  mode: string;
}

const useClipboardStore = create<ClipboardStoreState>()((set) => ({
  bucket: '',
  pathFrom: '',
  objects: [],
  mode: null,
}));

export default useClipboardStore;
