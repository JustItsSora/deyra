'use client';

import { useCallback, useMemo, useState } from 'react';
import type { ToastData } from '@/components/Toast';

type Options<T extends object> = {
  guildId: string;
  section: string;
  initial: T;
};

/**
 * Estado compartido de los formularios de sección: edición, detección de
 * cambios, guardado (PATCH same-origin) y toast de resultado.
 */
export function useSectionForm<T extends object>({ guildId, section, initial }: Options<T>) {
  const [saved, setSaved] = useState<T>(initial);
  const [state, setState] = useState<T>(initial);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastData>(null);

  const dirty = useMemo(() => JSON.stringify(state) !== JSON.stringify(saved), [state, saved]);

  const update = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const discard = useCallback(() => setState(saved), [saved]);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/${section}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      });
      const data = (await res.json().catch(() => ({}))) as T & { message?: string };
      if (!res.ok) {
        setToast({ kind: 'err', text: data?.message || `No se pudo guardar (HTTP ${res.status}).` });
        return;
      }
      setSaved(state);
      setToast({ kind: 'ok', text: 'Configuración guardada.' });
    } catch {
      setToast({ kind: 'err', text: 'Sin conexión con el panel. Revisa tu red.' });
    } finally {
      setSaving(false);
    }
  }, [guildId, section, state]);

  const dismissToast = useCallback(() => setToast(null), []);

  return { state, update, dirty, saving, save, discard, toast, dismissToast };
}
