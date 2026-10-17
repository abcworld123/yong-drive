import { create, type StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';

export function createWithDev<T extends object>() {
  return (store: StateCreator<T, [] | [['zustand/devtools', never]], [], T>) => (
    create<T>()(devtools(store))
  );
}
