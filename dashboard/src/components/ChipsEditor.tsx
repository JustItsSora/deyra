'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';

type ChipsEditorProps = {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  ariaLabel: string;
  normalize?: (raw: string) => string | null;
  disabled?: boolean;
};

/** Editor de listas de strings (palabras prohibidas, dominios): chips con alta/baja. */
export default function ChipsEditor({ values, onChange, placeholder, ariaLabel, normalize, disabled }: ChipsEditorProps) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const raw = draft.trim();
    if (!raw) return;
    const value = normalize ? normalize(raw) : raw.toLowerCase();
    if (!value) return;
    if (!values.includes(value)) onChange([...values, value]);
    setDraft('');
  };

  const remove = (value: string) => onChange(values.filter((v) => v !== value));

  return (
    <div>
      {values.length > 0 ? (
        <div className="chips" aria-label={ariaLabel}>
          {values.map((v) => (
            <span key={v} className="chip">
              {v}
              <button type="button" onClick={() => remove(v)} aria-label={`Quitar ${v}`} disabled={disabled}>
                <X size={13} aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="hint">Nada en la lista todavía.</p>
      )}

      <div className="chip-add">
        <input
          className="input"
          style={{ maxWidth: 280 }}
          value={draft}
          placeholder={placeholder}
          aria-label={ariaLabel}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" className="btn btn-subtle" onClick={add} disabled={disabled || !draft.trim()}>
          <Plus size={16} aria-hidden="true" />
          Añadir
        </button>
      </div>
    </div>
  );
}
