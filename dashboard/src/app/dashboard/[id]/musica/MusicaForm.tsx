'use client';

import { AlertCircle, Info } from 'lucide-react';
import { useSectionForm } from '@/lib/useSectionForm';
import SaveBar from '@/components/SaveBar';
import Toast from '@/components/Toast';
import Listbox from '@/components/Listbox';
import Toggle from '@/components/Toggle';
import { textChannelOptions, voiceChannelOptions, roleOptions, NO_CHANNEL } from '@/lib/options';
import type { MusicSection, BotChannel, BotRole } from '@/lib/types';

function NumberInput({ id, value, onChange, min, max, label }: {
  id: string; value: number; onChange: (v: number) => void; min: number; max: number; label: string;
}) {
  return (
    <div className="field">
      <label className="label" htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        className="input num-input"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(Math.min(Math.max(Math.trunc(n), min), max));
        }}
      />
    </div>
  );
}

const msToSeconds = (ms: number) => Math.round(ms / 1000);
const secondsToMs = (s: number) => Math.round(s * 1000);

export default function MusicaForm({
  guildId,
  initial,
  channels,
  roles,
}: {
  guildId: string;
  initial: MusicSection;
  channels: BotChannel[];
  roles: BotRole[];
}) {
  const { state, update, dirty, saving, save, discard, toast, dismissToast } = useSectionForm({
    guildId,
    section: 'music',
    initial,
  });

  const voiceChannels = voiceChannelOptions(channels);
  const textChannels = textChannelOptions(channels);
  const fairplayRoles = roleOptions(roles);
  // Un canal borrado deja el ID guardado pero ya no está en la lista: se
  // muestra vacío y se pide elegir uno para que el guardado no falle.
  const voice247 = channels.some((c) => c.id === state.voice247Id) ? state.voice247Id : null;
  const voice247Missing = state.twentyFourSeven && !voice247;

  return (
    <>
      <section className="panel" aria-label="Reproducción">
        <div className="panel-head"><div><h2 className="panel-title">Reproducción</h2>
          <p className="panel-desc">Volumen, autoplay, historial y panel de botones.</p></div></div>
        <div className="panel-body">
        <div className="setting-row">
          <span>
            <span className="label">Volumen por defecto</span>
            <span className="desc">Con el que arranca el reproductor (0 a 100).</span>
          </span>
          <NumberInput id="defaultVolume" label="Volumen" min={0} max={100} value={state.defaultVolume} onChange={(v) => update('defaultVolume', v)} />
        </div>
        <div className="setting-row">
          <span>
            <span className="label">Autoplay</span>
            <span className="desc">Al vaciarse la cola, sigue con canciones parecidas.</span>
          </span>
          <Toggle checked={state.defaultAutoplay} onChange={(v) => update('defaultAutoplay', v)} label="Autoplay" />
        </div>
        <div className="setting-row">
          <span>
            <span className="label">Historial</span>
            <span className="desc">Guarda las canciones reproducidas (lo usa /history).</span>
          </span>
          <Toggle checked={state.historyEnabled} onChange={(v) => update('historyEnabled', v)} label="Historial" />
        </div>
        <div className="setting-row">
          <span>
            <span className="label">Panel «Ahora suena»</span>
            <span className="desc">Mensaje con botones en cada canción.</span>
          </span>
          <Toggle checked={state.nowPlayingPanel} onChange={(v) => update('nowPlayingPanel', v)} label="Panel ahora suena" />
        </div>
        </div>
      </section>

      <section className="panel" aria-label="Fairplay">
        <div className="panel-head"><div><h2 className="panel-title">Fairplay</h2>
          <p className="panel-desc">La música solo la pueden pedir quienes tengan el rol elegido.</p></div></div>
        <div className="panel-body">
          <div className="setting-row">
            <span>
              <span className="label">Fairplay activo</span>
              <span className="desc">La música solo la pueden pedir quienes tengan el rol de abajo.</span>
            </span>
            <Toggle checked={state.defaultFairplay} onChange={(v) => update('defaultFairplay', v)} label="Fairplay" />
          </div>
          {state.defaultFairplay && (
            <div className="setting-row">
              <span>
                <span className="label">Rol con permiso de música</span>
                <span className="desc">Solo este rol puede pedir canciones.</span>
              </span>
              <div className="control">
                <Listbox
                  value={state.fairplayRoleId ?? NO_CHANNEL}
                  options={fairplayRoles}
                  onChange={(v) => update('fairplayRoleId', v === NO_CHANNEL ? null : v)}
                  ariaLabel="Rol con permiso de música"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="panel" aria-label="Modo 24/7">
        <div className="panel-head"><div><h2 className="panel-title">Modo 24/7</h2>
          <p className="panel-desc">Deyra se queda en el canal y sigue sonando sin nadie.</p></div></div>
        <div className="panel-body">
          <div className="setting-row">
            <span>
              <span className="label">24/7 activado</span>
              <span className="desc">Deyra se queda en el canal y sigue sonando sin nadie.</span>
            </span>
            <Toggle checked={state.twentyFourSeven} onChange={(v) => update('twentyFourSeven', v)} label="Modo 24/7" />
          </div>
          {state.twentyFourSeven && (
            <>
              <div className="setting-row">
                <span><span className="label">Canal de voz 24/7</span><span className="desc">Dónde vive el bot de forma permanente. Si ya está en otro canal, se mueve aquí al guardar.</span></span>
                <div className="control">
                  <Listbox
                    value={voice247 ?? NO_CHANNEL}
                    options={voiceChannels}
                    onChange={(v) => update('voice247Id', v === NO_CHANNEL ? null : v)}
                    ariaLabel="Canal de voz 24/7"
                    emptyText="No hay canales de voz"
                  />
                </div>
              </div>
              <div className="setting-row">
                <span><span className="label">Canal de texto 24/7</span><span className="desc">Para los avisos del modo 24/7.</span></span>
                <div className="control">
                  <Listbox
                    value={state.text247Id ?? NO_CHANNEL}
                    options={textChannels}
                    onChange={(v) => update('text247Id', v === NO_CHANNEL ? null : v)}
                    ariaLabel="Canal de texto 24/7"
                  />
                </div>
              </div>
            </>
          )}
        </div>
        {voice247Missing && (
          <p className="error-text panel-note" role="alert"><AlertCircle size={15} aria-hidden="true" />Elige un canal de voz para el modo 24/7. Sin canal, el bot no tiene dónde quedarse.</p>
        )}
      </section>

      <section className="panel" aria-label="Límites">
        <div className="panel-head"><div><h2 className="panel-title">Límites y tiempos</h2>
          <p className="panel-desc">Inactividad antes de abandonar el canal y tope de pistas en cola.</p></div></div>
        <div className="panel-body" style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <NumberInput id="leaveEmpty" label="Salir si vacío (seg)" min={0} max={3600} value={msToSeconds(state.leaveOnEmptyMs)} onChange={(v) => update('leaveOnEmptyMs', secondsToMs(v))} />
          <NumberInput id="leaveEnd" label="Salir tras la cola (seg)" min={0} max={3600} value={msToSeconds(state.leaveOnEndMs)} onChange={(v) => update('leaveOnEndMs', secondsToMs(v))} />
          <NumberInput id="maxQueue" label="Máx. canciones en cola" min={1} max={5000} value={state.maxQueueSize} onChange={(v) => update('maxQueueSize', v)} />
        </div>
        <p className="hint panel-note">0 segundos = nunca se va solo de la cola o del canal.</p>
      </section>

      <div className="callout mt" role="note">
        <Info className="icon" aria-hidden="true" />
        <span>El modo 24/7 necesita un nodo Lavalink configurado en el bot. Sin él, esta sección se guarda pero la música no suena.</span>
      </div>

      <SaveBar visible={dirty} saving={saving} onSave={save} onDiscard={discard} />
      <Toast toast={toast} onDone={dismissToast} />
    </>
  );
}
