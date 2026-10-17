import { create } from 'zustand';
import type { ObjectInfo } from 'types/apis';

interface HomeStoreState {
  bucket: string;
  path: string;
  objects: ObjectInfo[];
  reload: () => void;
}

const useHomeStore = create<HomeStoreState>()((set) => ({
  bucket: '',
  path: '',
  objects: [],
  reload: null,
}));

export default useHomeStore;
