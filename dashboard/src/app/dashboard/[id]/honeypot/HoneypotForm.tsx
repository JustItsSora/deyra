'use client';

import { Info, ShieldAlert } from 'lucide-react';
import { useSectionForm } from '@/lib/useSectionForm';
import SaveBar from '@/components/SaveBar';
import Toast from '@/components/Toast';
import Listbox from '@/components/Listbox';
import Toggle from '@/components/Toggle';
import { channelOptions, NO_CHANNEL } from '@/lib/options';
import type { HoneypotSection, BotChannel } from '@/lib/types';

const ACTION_OPTIONS = [
  { value: 'timeout', label: 'Silenciar (timeout)', hint: 'No puede escribir durante la duración elegida' },
  { value: 'kick', label: 'Expulsar (kick)', hint: 'Puede volver con una nueva invitación' },
  { value: 'ban', label: 'Banear (ban)', hint: 'Desaparece del servidor de inmediato' },
];

const ROTATION_OPTIONS = [
  { value: '0', label: 'Desactivada' },
  { value: '6', label: 'Cada 6 horas' },
  { value: '12', label: 'Cada 12 horas' },
  { value: '24', label: 'Cada 24 horas' },
  { value: '48', label: 'Cada 2 días' },
  { value: '72', label: 'Cada 3 días' },
  { value: '168', label: 'Cada 7 días' },
];

export default function HoneypotForm({
  guildId,
  initial,
  channels,
}: {
  guildId: string;
  initial: HoneypotSection;
  channels: BotChannel[];
}) {
  const { state, update, dirty, saving, save, discard, toast, dismissToast } = useSectionForm({
    guildId,
    section: 'honeypot',
    initial,
  });

  return (
    <>
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 4 }}>
        <div className="stat">
          <div className="k">Cuentas atrapadas</div>
          <div className="v">{state.caughtCount}</div>
          <div className="sub">desde que el señuelo está activo</div>
        </div>
        <div className="stat">
          <div className="k">Rotación del canal</div>
          <div className="v" style={{ fontSize: 22, paddingTop: 6 }}>{state.rotationHours > 0 ? `cada ${state.rotationHours}h` : 'off'}</div>
          <div className="sub">{state.lastRotationAt ? `última hace ${timeAgo(state.lastRotationAt)}` : 'nunca rotado'}</div>
        </div>
      </div>

      <div className="card card-pad">
        <div className="setting-row">
          <span>
            <span className="label">Honeypot activo</span>
            <span className="desc">Sin canal asignado, al activar se crea uno propio automáticamente.</span>
          </span>
          <Toggle checked={state.enabled} onChange={(v) => update('enabled', v)} label="Honeypot activo" />
        </div>

        <div className="setting-row">
          <span>
            <span className="label">Canal señuelo</span>
            <span className="desc">Creado automáticamente si no eliges uno, u otro canal existente.</span>
          </span>
          <div style={{ minWidth: 210, maxWidth: 320, width: '100%' }}>
            <Listbox
              value={state.channelId ?? NO_CHANNEL}
              options={channelOptions(channels)}
              onChange={(v) => update('channelId', v === NO_CHANNEL ? null : v)}
              ariaLabel="Canal señuelo"
            />
          </div>
        </div>

        <div className="setting-row">
          <span>
            <span className="label">Castigo</span>
            <span className="desc">Qué pasa con quien cae en la trampa.</span>
          </span>
          <div style={{ minWidth: 200, maxWidth: 320, width: '100%' }}>
            <Listbox
              value={state.action}
              options={ACTION_OPTIONS}
              onChange={(v) => update('action', v as HoneypotSection['action'])}
              ariaLabel="Castigo del honeypot"
            />
          </div>
        </div>

        {state.action === 'timeout' && (
          <div className="setting-row">
            <span>
              <span className="label">Duración del silencio</span>
              <span className="desc">Minutos (máx 28 días = 40320). Por defecto, 1 día.</span>
            </span>
            <input
              type="number"
              className="input num-input"
              min={1}
              max={40320}
              value={state.timeoutMinutes}
              aria-label="Minutos de silencio"
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isFinite(n)) update('timeoutMinutes', Math.min(Math.max(Math.trunc(n), 1), 40320));
              }}
            />
          </div>
        )}

        <div className="setting-row">
          <span>
            <span className="label">Auto-purge</span>
            <span className="desc">Borra los últimos mensajes del atrapado en el canal señuelo.</span>
          </span>
          <Toggle checked={state.autoPurge} onChange={(v) => update('autoPurge', v)} label="Auto-purge" />
        </div>

        <div className="setting-row">
          <span>
            <span className="label">Rotación del nombre</span>
            <span className="desc">Cambia el nombre del canal cada N horas para no ser predecible.</span>
          </span>
          <div style={{ minWidth: 180, maxWidth: 260, width: '100%' }}>
            <Listbox
              value={String(state.rotationHours)}
              options={ROTATION_OPTIONS}
              onChange={(v) => update('rotationHours', Number(v))}
              ariaLabel="Rotación del nombre del canal"
            />
          </div>
        </div>
      </div>

      <div className="callout mt" role="note">
        <Info className="icon" aria-hidden="true" />
        <span><strong>Cómo funciona:</strong> el canal se ve normal pero nadie legítimo lo usa. Cualquier cuenta que escriba ahí — humana o bot — ejecuta su propia sentencia. El dueño y quien tenga permiso de gestión nunca son castigados.</span>
      </div>
      <div className="callout danger mt" role="alert">
        <ShieldAlert className="icon" aria-hidden="true" />
        <span><strong>Aviso:</strong> si un miembro legítimo escribe en el canal (p. ej. por error), recibirá el castigo igualmente. Deja un topic claro: «Canal de solo lectura, no escribas aquí».</span>
      </div>

      <SaveBar visible={dirty} saving={saving} onSave={save} onDiscard={discard} />
      <Toast toast={toast} onDone={dismissToast} />
    </>
  );
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return 'desconocido';
  const minutes = Math.floor((Date.now() - then) / 60000);
  if (minutes < 1) return 'justo ahora';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  return `${days} d`;
}
