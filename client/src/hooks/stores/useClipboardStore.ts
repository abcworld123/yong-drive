import { create } from 'zustand';
import type { PasteMode } from 'types/apis';

interface ClipboardStoreState {
  bucket: string;
  pathFrom: string;
  objects: string[];
  mode: PasteMode | null;
}

const useClipboardStore = create<ClipboardStoreState>()(() => ({
  bucket: '',
  pathFrom: '',
  objects: [],
  mode: null,
}));

export default useClipboardStore;
