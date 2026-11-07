'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { play } from '@/lib/sound';

export type ToastData = { kind: 'ok' | 'err'; text: string } | null;

export default function Toast({ toast, onDone }: { toast: ToastData; onDone: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!toast) {
      setVisible(false);
      return;
    }
    setVisible(true);
    play(toast.kind === 'ok' ? 'ok' : 'err');
    const t = setTimeout(() => {
      setVisible(false);
      onDone();
    }, 4200);
    return () => clearTimeout(t);
  }, [toast, onDone]);

  if (!toast || !visible) return null;
  const Icon = toast.kind === 'ok' ? CheckCircle2 : AlertCircle;

  return (
    <div className={`toast ${toast.kind}`} role={toast.kind === 'err' ? 'alert' : 'status'} aria-live={toast.kind === 'err' ? 'assertive' : 'polite'}>
      <Icon className="icon" size={19} aria-hidden="true" />
      <span>{toast.text}</span>
    </div>
  );
}
