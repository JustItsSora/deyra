'use client';

import { useSectionForm } from '@/lib/useSectionForm';
import SaveBar from '@/components/SaveBar';
import Toast from '@/components/Toast';
import Listbox from '@/components/Listbox';
import type { GuildSection } from '@/lib/types';

const LANGUAGE_OPTIONS = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
];

export default function GeneralForm({ guildId, initial }: { guildId: string; initial: GuildSection }) {
  const { state, update, dirty, saving, save, discard, toast, dismissToast } = useSectionForm({
    guildId,
    section: 'guild',
    initial,
  });

  return (
    <>
      <div className="card card-pad">
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
            <span className="label">Idioma del bot</span>
            <span className="desc">Idioma de las respuestas y paneles en este servidor.</span>
          </span>
          <div style={{ minWidth: 170 }}>
            <Listbox
              value={state.language}
              options={LANGUAGE_OPTIONS}
              onChange={(v) => update('language', v)}
              ariaLabel="Idioma del bot"
            />
          </div>
        </div>
      </div>

      <p className="hint mt">El prefijo admite cualquier carácter, pero evita espacios: romperían el parsing de comandos.</p>

      <SaveBar visible={dirty} saving={saving} onSave={save} onDiscard={discard} />
      <Toast toast={toast} onDone={dismissToast} />
    </>
  );
}
