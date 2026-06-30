'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

interface DirtyFormCtx {
  isDirty: boolean;
  setDirty: (v: boolean) => void;
  pendingHref: string;
  setPendingHref: (v: string) => void;
  showWarning: boolean;
  setShowWarning: (v: boolean) => void;
}

const Ctx = createContext<DirtyFormCtx>({
  isDirty: false, setDirty: () => {}, pendingHref: '', setPendingHref: () => {},
  showWarning: false, setShowWarning: () => {},
});

export function DirtyFormProvider({ children }: { children: ReactNode }) {
  const [isDirty, setDirty] = useState(false);
  const [pendingHref, setPendingHref] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  return (
    <Ctx.Provider value={{ isDirty, setDirty, pendingHref, setPendingHref, showWarning, setShowWarning }}>
      {children}
    </Ctx.Provider>
  );
}

export function useDirtyForm() { return useContext(Ctx); }
