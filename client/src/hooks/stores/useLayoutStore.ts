import { create } from 'zustand';

interface LayoutStoreState {
  dropdown: string;
  dropdownClick: (newDropdown: string) => void;
}

const useLayoutStore = create<LayoutStoreState>()((set) => ({
  dropdown: null,
  dropdownClick: (newDropdown) => set((state) => ({ dropdown: newDropdown !== state.dropdown ? newDropdown : null })),
}));

export default useLayoutStore;
