import { create } from 'zustand';

interface CheckBoxStoreState {
  chkSet: Set<string>;
  chkAll: boolean;
}

const useCheckBoxStore = create<CheckBoxStoreState>()((set) => ({
  chkSet: new Set<string>(),
  chkAll: false,
}));

export default useCheckBoxStore;
