'use client';

import { Info, UserRound, Bot } from 'lucide-react';
import { useSectionForm } from '@/lib/useSectionForm';
import SaveBar from '@/components/SaveBar';
import Toast from '@/components/Toast';
import Checklist from '@/components/Checklist';
import type { AutoroleSection, BotRole } from '@/lib/types';

export default function AutoroleForm({
  guildId,
  initial,
  roles,
}: {
  guildId: string;
  initial: AutoroleSection;
  roles: BotRole[];
}) {
  const { state, update, dirty, saving, save, discard, toast, dismissToast } = useSectionForm({
    guildId,
    section: 'autorole',
    initial,
  });

  const configurable = roles
    .filter((r) => !r.managed && !r.isEveryone)
    .map((r) => ({ id: r.id, label: `@${r.name}`, color: r.color !== '#000000' ? r.color : undefined }));

  return (
    <>
      <section className="panel" aria-label="Roles para humanos">
        <div className="panel-head"><div><h2 className="panel-title"><UserRound size={16} className="h2-icon" aria-hidden="true" />Roles para miembros humanos</h2>
          <p className="panel-desc">Se asignan automáticamente cuando alguien entra al servidor.</p></div></div>
        <div className="panel-body">
          <p className="hint" style={{ marginBottom: 12 }}>Se asignan automáticamente cuando alguien entra al servidor.</p>
          <Checklist
            items={configurable}
            selected={state.roleIds}
            onChange={(next) => update('roleIds', next)}
            ariaLabel="Roles automáticos para humanos"
            emptyText="No hay roles configurables."
          />
        </div>
      </section>

      <section className="panel" aria-label="Roles para bots">
        <div className="panel-head"><div><h2 className="panel-title"><Bot size={16} className="h2-icon" aria-hidden="true" />Roles para bots</h2>
          <p className="panel-desc">Se asignan a las cuentas de bots que entran (control de permisos desde el primer segundo).</p></div></div>
        <div className="panel-body">
          <p className="hint" style={{ marginBottom: 12 }}>Se asignan a las cuentas de bots que se incorporen (control de permisos desde el primer segundo).</p>
          <Checklist
            items={configurable}
            selected={state.botRoleIds}
            onChange={(next) => update('botRoleIds', next)}
            ariaLabel="Roles automáticos para bots"
            emptyText="No hay roles configurables."
          />
        </div>
      </section>

      <div className="callout mt" role="note">
        <Info className="icon" aria-hidden="true" />
        <span>Los roles elegidos deben estar por debajo del rol de Deyra en la jerarquía del servidor, o la asignación fallará en silencio.</span>
      </div>

      <SaveBar visible={dirty} saving={saving} onSave={save} onDiscard={discard} />
      <Toast toast={toast} onDone={dismissToast} />
    </>
  );
}
