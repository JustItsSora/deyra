'use client';

import { Info, ShieldAlert } from 'lucide-react';
import { useSectionForm } from '@/lib/useSectionForm';
import SaveBar from '@/components/SaveBar';
import Toast from '@/components/Toast';
import Listbox from '@/components/Listbox';
import Toggle from '@/components/Toggle';
import Checklist from '@/components/Checklist';
import type { AntiNukeSection, BotRole } from '@/lib/types';

const ACTION_OPTIONS = [
  { value: 'log', label: 'Solo registro', hint: 'Recomendado al empezar: ves qué dispararía sin castigar a nadie' },
  { value: 'derank', label: 'Quitar todos los roles', hint: 'Reversible; frena al autor sin expulsarlo' },
  { value: 'ban', label: 'Banear al autor', hint: 'Máxima dureza: banea a quien haga la ráfaga' },
];

export default function AntiNukeForm({
  guildId,
  initial,
  roles,
}: {
  guildId: string;
  initial: AntiNukeSection;
  roles: BotRole[];
}) {
  const { state, update, dirty, saving, save, discard, toast, dismissToast } = useSectionForm({
    guildId,
    section: 'antinuke',
    initial,
  });

  return (
    <>
      <section className="panel" aria-label="Estado">
        <div className="panel-head"><div><h2 className="panel-title">Estado</h2>
          <p className="panel-desc">Vigila el audit log y corta ráfagas de acciones destructivas.</p></div></div>
        <div className="panel-body">
        <div className="setting-row">
          <span>
            <span className="label">Anti-nuke activo</span>
            <span className="desc">Vigila el audit log y corta ráfagas de acciones destructivas hechas por una misma cuenta.</span>
          </span>
          <Toggle checked={state.enabled} onChange={(v) => update('enabled', v)} label="Anti-nuke activo" />
        </div>

        <div className="setting-row">
          <span>
            <span className="label">Respuesta al detectar</span>
            <span className="desc">Qué pasa cuando se supera el umbral.</span>
          </span>
          <div className="control-lg">
            <Listbox
              value={state.action}
              options={ACTION_OPTIONS}
              onChange={(v) => update('action', v as AntiNukeSection['action'])}
              ariaLabel="Acción al detectar una ráfaga"
            />
          </div>
        </div>

        <div className="setting-row">
          <span>
            <span className="label">Umbral</span>
            <span className="desc">Acciones sospechosas en la ventana que disparan la respuesta (1–20).</span>
          </span>
          <input
            type="number"
            className="input num-input"
            min={1}
            max={20}
            value={state.threshold}
            aria-label="Umbral de acciones"
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n)) update('threshold', Math.min(Math.max(Math.trunc(n), 1), 20));
            }}
          />
        </div>

        <div className="setting-row">
          <span>
            <span className="label">Ventana (minutos)</span>
            <span className="desc">Periodo en el que se cuentan las acciones (1–120).</span>
          </span>
          <input
            type="number"
            className="input num-input"
            min={1}
            max={120}
            value={state.windowMinutes}
            aria-label="Ventana en minutos"
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n)) update('windowMinutes', Math.min(Math.max(Math.trunc(n), 1), 120));
            }}
          />
        </div>
        </div>
      </section>

      <section className="panel" aria-label="Roles excluidos">
        <div className="panel-head"><div><h2 className="panel-title">Roles de confianza</h2>
          <p className="panel-desc">Estos roles nunca disparan el anti-nuke.</p></div></div>
        <div className="panel-body">
          <p className="hint" style={{ marginBottom: 12 }}>Estos roles nunca disparan el anti-nuke (p. ej. tu equipo de moderación activo borrando canales en una limpieza).</p>
          <Checklist
            items={roles.filter((r) => !r.managed && !r.isEveryone).map((r) => ({ id: r.id, label: `@${r.name}`, color: r.color !== '#000000' ? r.color : undefined }))}
            selected={state.whitelistedRoles}
            onChange={(next) => update('whitelistedRoles', next)}
            ariaLabel="Roles excluidos del anti-nuke"
            emptyText="No hay roles configurables."
          />
        </div>
      </section>

      <div className="callout mt" role="note">
        <Info className="icon" aria-hidden="true" />
        <span><strong>Detecta:</strong> borrado de canales y roles, baneos masivos, creación de webhooks, bots añadidos y cambios de permisos de rol. El dueño y otros bots nunca cuentan.</span>
      </div>
      <div className="callout danger mt" role="alert">
        <ShieldAlert className="icon" aria-hidden="true" />
        <span><strong>Requisitos:</strong> el bot necesita el permiso <em>Ver registro de auditoría</em> y jerarquía por encima de los objetivos. Empieza con la acción <em>Solo registro</em> y revisa el canal de logs.</span>
      </div>

      <SaveBar visible={dirty} saving={saving} onSave={save} onDiscard={discard} />
      <Toast toast={toast} onDone={dismissToast} />
    </>
  );
}
