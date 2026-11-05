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
      <div className="card card-pad">
        <div className="setting-row">
          <span>
            <span className="label">Honeypot activo</span>
            <span className="desc">Si está activo, escribir en el canal señuelo dispara el castigo configurado.</span>
          </span>
          <Toggle checked={state.enabled} onChange={(v) => update('enabled', v)} label="Honeypot activo" />
        </div>

        <div className="setting-row">
          <span>
            <span className="label">Canal señuelo</span>
            <span className="desc">Elige un canal existente o créalo antes con <code>/honeypot setup</code>.</span>
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
