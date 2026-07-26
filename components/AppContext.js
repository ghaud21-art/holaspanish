'use client';
import { createContext, useContext } from 'react';

export const AppContext = createContext(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp은 AppShell 내부에서만 사용할 수 있어요.');
  return ctx;
}
