'use client';

import { Loader2, Save, Undo2 } from 'lucide-react';

type SaveBarProps = {
  visible: boolean;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
};

export default function SaveBar({ visible, saving, onSave, onDiscard }: SaveBarProps) {
  if (!visible) return null;

  return (
    <div className="savebar" role="region" aria-label="Cambios sin guardar">
      <span><strong>Cambios sin guardar</strong> <span className="muted">Se aplican al guardar</span></span>
      <div className="savebar-actions">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onDiscard} disabled={saving}>
          <Undo2 size={15} aria-hidden="true" />
          Descartar
        </button>
        <button type="button" className="btn btn-primary btn-sm" onClick={onSave} disabled={saving}>
          {saving ? <Loader2 size={15} className="spin" aria-hidden="true" /> : <Save size={15} aria-hidden="true" />}
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}
