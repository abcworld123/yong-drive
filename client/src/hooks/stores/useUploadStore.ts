import { create } from 'zustand';

interface UploadStoreState {
  isUploading: boolean;
  progVal: number;
  uploadObject: (files: File[]) => void;
  setIsUploading: (newState: boolean) => void;
  setProgVal: (newState: number) => void;
}

const useUploadStore = create<UploadStoreState>()((set) => ({
  isUploading: false,
  progVal: 0,
  uploadObject: null,
  setIsUploading: (newState: boolean) => set((state) => ({ isUploading: newState })),
  setProgVal: (newState: number) => set((state) => ({ progVal: newState })),
}));

export default useUploadStore;
