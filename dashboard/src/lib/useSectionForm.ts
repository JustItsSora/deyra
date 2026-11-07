'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
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
      // Envía SOLO lo que cambió: el bot valida el cuerpo con claves whitelist
      // y rechaza campos de solo lectura (p. ej. caughtCount/lastRotationAt).
      const changed: Partial<T> = {};
      for (const key of Object.keys(state) as (keyof T)[]) {
        if (JSON.stringify(state[key]) !== JSON.stringify(saved[key])) {
          (changed as Record<string, unknown>)[key as string] = state[key];
        }
      }
      const res = await fetch(`/api/guilds/${guildId}/${section}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changed),
      });
      const data = (await res.json().catch(() => ({}))) as T & { message?: string };
      if (!res.ok) {
        setToast({ kind: 'err', text: data?.message || `No se pudo guardar (HTTP ${res.status}).` });
        return;
      }
      // El bot puede normalizar valores o crear recursos al guardar (p. ej. el
      // canal del honeypot). Se adopta lo que devolvió para no mostrar un
      // estado que ya no coincide con el suyo.
      const next = { ...state } as Record<string, unknown>;
      if (data && typeof data === 'object') {
        for (const key of Object.keys(state) as (keyof T)[]) {
          if (key in data) next[key as string] = data[key as keyof T];
        }
      }
      setSaved(next as T);
      setState(next as T);
      setToast({ kind: 'ok', text: 'Configuración guardada.' });
      // Refresca los datos del servidor (canales, roles) para que lo recién
      // creado aparezca en los selectores sin recargar la página.
      router.refresh();
    } catch {
      setToast({ kind: 'err', text: 'Sin conexión con el panel. Revisa tu red.' });
    } finally {
      setSaving(false);
    }
  }, [guildId, section, state, router]);

  const dismissToast = useCallback(() => setToast(null), []);

  return { state, update, dirty, saving, save, discard, toast, dismissToast };
}
