import { create } from 'zustand';

interface SessionStoreState {
  isLogin: boolean;
}

const useSessionStore = create<SessionStoreState>()((set) => ({
  isLogin: null,
}));

export default useSessionStore;
