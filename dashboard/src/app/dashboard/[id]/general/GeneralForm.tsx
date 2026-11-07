'use client';

import { AlertTriangle } from 'lucide-react';
import { useSectionForm } from '@/lib/useSectionForm';
import SaveBar from '@/components/SaveBar';
import Toast from '@/components/Toast';
import Listbox from '@/components/Listbox';
import Toggle from '@/components/Toggle';
import { textChannelOptions, NO_CHANNEL } from '@/lib/options';
import type { GuildSection, BotChannel } from '@/lib/types';

export default function GeneralForm({ guildId, initial, channels }: { guildId: string; initial: GuildSection; channels: BotChannel[] }) {
  const { state, update, dirty, saving, save, discard, toast, dismissToast } = useSectionForm({
    guildId,
    section: 'guild',
    initial,
  });

  const ch = textChannelOptions(channels);
  const setChannel = (key: 'suggestionsChannelId' | 'confessionsChannelId' | 'birthdayChannelId') => (v: string) =>
    update(key, v === NO_CHANNEL ? null : v);

  return (
    <>
      <section className="panel" aria-label="Comandos y canales">
        <div className="panel-head"><div><h2 className="panel-title">Comandos y canales</h2>
          <p className="panel-desc">Prefijo y canales donde Deyra publica.</p></div></div>
        <div className="panel-body">
        <div className="setting-row">
          <span>
            <span className="label">Prefijo de comandos</span>
            <span className="desc">Se usa con los comandos de texto. Vacío = volver al global ({'!'}). Máx 5 caracteres.</span>
          </span>
          <input
            className="input input-mono"
            style={{ width: 120, textAlign: 'center' }}
            maxLength={5}
            value={state.prefix ?? ''}
            placeholder="!"
            aria-label="Prefijo personalizado"
            onChange={(e) => update('prefix', e.target.value.trim() === '' ? null : e.target.value)}
          />
        </div>

        <div className="setting-row">
          <span>
            <span className="label">Canal de sugerencias</span>
            <span className="desc">Donde /suggest publica las ideas de los miembros.</span>
          </span>
          <div className="control">
            <Listbox value={state.suggestionsChannelId ?? NO_CHANNEL} options={ch} onChange={setChannel('suggestionsChannelId')} ariaLabel="Canal de sugerencias" />
          </div>
        </div>

        <div className="setting-row">
          <span>
            <span className="label">Canal de confesiones</span>
            <span className="desc">Donde /confess publica confesiones anónimas.</span>
          </span>
          <div className="control">
            <Listbox value={state.confessionsChannelId ?? NO_CHANNEL} options={ch} onChange={setChannel('confessionsChannelId')} ariaLabel="Canal de confesiones" />
          </div>
        </div>

        <div className="setting-row">
          <span>
            <span className="label">Canal de cumpleaños</span>
            <span className="desc">Felicita cumpleaños registrados con /birthday set.</span>
          </span>
          <div className="control">
            <Listbox value={state.birthdayChannelId ?? NO_CHANNEL} options={ch} onChange={setChannel('birthdayChannelId')} ariaLabel="Canal de cumpleaños" />
          </div>
        </div>

        <div className="setting-row">
          <span>
            <span className="label">Modo NSFW del servidor</span>
            <span className="desc">Habilita comandos y contenido para adultos (requiere +18 y canales NSFW por Discord).</span>
          </span>
          <Toggle checked={state.nsfw} onChange={(v) => update('nsfw', v)} label="Modo NSFW" />
        </div>
      </div>
      </section>

      {state.nsfw && (
        <div className="callout danger mt" role="alert">
          <AlertTriangle className="icon" aria-hidden="true" />
          <span><strong>Contenido para adultos activado:</strong> los comandos NSFW responderán en canales marcados como +18. Verifica que los menores no tengan acceso a esos canales y a los roles que los ven.</span>
        </div>
      )}

      <p className="hint mt">El prefijo admite cualquier carácter, pero evita espacios: romperían el parsing de comandos.</p>

      <SaveBar visible={dirty} saving={saving} onSave={save} onDiscard={discard} />
      <Toast toast={toast} onDone={dismissToast} />
    </>
  );
}
