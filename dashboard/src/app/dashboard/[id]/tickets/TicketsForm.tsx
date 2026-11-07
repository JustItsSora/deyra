'use client';

import { Info } from 'lucide-react';
import { useSectionForm } from '@/lib/useSectionForm';
import SaveBar from '@/components/SaveBar';
import Toast from '@/components/Toast';
import Listbox from '@/components/Listbox';
import Checklist from '@/components/Checklist';
import { textChannelOptions, categoryOptions, NO_CHANNEL } from '@/lib/options';
import type { TicketsSection, BotChannel, BotRole } from '@/lib/types';

export default function TicketsForm({
  guildId,
  initial,
  channels,
  roles,
}: {
  guildId: string;
  initial: TicketsSection;
  channels: BotChannel[];
  roles: BotRole[];
}) {
  const { state, update, dirty, saving, save, discard, toast, dismissToast } = useSectionForm({
    guildId,
    section: 'tickets',
    initial,
  });

  const textChannels = textChannelOptions(channels);
  const panelChannel = channels.find((c) => c.id === state.panelChannelId);
  const supportRoles = roles.filter((r) => !r.managed && !r.isEveryone).map((r) => ({ id: r.id, label: `@${r.name}`, color: r.color !== '#000000' ? r.color : undefined }));

  return (
    <>
      <div className="card card-pad">
        <div className="field">
          <label className="label" htmlFor="panelTitle">Título del panel</label>
          <input
            id="panelTitle"
            className="input"
            maxLength={80}
            value={state.panelTitle}
            aria-label="Título del panel de tickets"
            onChange={(e) => update('panelTitle', e.target.value)}
          />
        </div>

        <div className="field mt">
          <label className="label" htmlFor="panelDescription">Descripción del panel</label>
          <input
            id="panelDescription"
            className="input"
            maxLength={200}
            value={state.panelDescription}
            aria-label="Descripción del panel de tickets"
            onChange={(e) => update('panelDescription', e.target.value)}
          />
        </div>

        <div className="cols cols-2 mt">
          <div className="field">
            <span className="label">Canal del panel</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span className="pill" style={{ alignSelf: 'flex-start' }}>{panelChannel ? `#${panelChannel.name}` : 'Sin publicar'}</span>
              <span className="hint">Último canal donde se publicó. Se publica o mueve con /ticket panel.</span>
            </div>
          </div>
          <div className="field">
            <span className="label">Categoría de los tickets</span>
            <Listbox
              value={state.categoryId ?? NO_CHANNEL}
              options={categoryOptions(channels)}
              onChange={(v) => update('categoryId', v === NO_CHANNEL ? null : v)}
              ariaLabel="Categoría donde se crean los canales de ticket"
            />
          </div>
        </div>

        <div className="field mt">
          <span className="label">Canal de logs de tickets</span>
          <div style={{ maxWidth: 420 }}>
            <Listbox
              value={state.logChannelId ?? NO_CHANNEL}
              options={textChannels}
              onChange={(v) => update('logChannelId', v === NO_CHANNEL ? null : v)}
              ariaLabel="Canal de logs de tickets"
            />
          </div>
        </div>

        <div className="field mt">
          <label className="label" htmlFor="welcomeMessage">Mensaje de bienvenida del ticket</label>
          <textarea
            id="welcomeMessage"
            className="textarea"
            value={state.welcomeMessage ?? ''}
            maxLength={500}
            placeholder="¡Hola! Cuéntanos tu problema y te atenderemos pronto."
            onChange={(e) => update('welcomeMessage', e.target.value.trim() === '' ? null : e.target.value)}
          />
          <span className="hint">Se publica dentro del canal del ticket al abrirse. Vacío = sin mensaje.</span>
        </div>

        <div className="setting-row" style={{ marginTop: 8 }}>
          <span>
            <span className="label">Contador de tickets</span>
            <span className="desc">Tickets abiertos hasta la fecha (el número del canal #ticket-42).</span>
          </span>
          <span className="pill">{state.ticketCounter}</span>
        </div>
      </div>

      <section className="section-block" aria-label="Equipo de soporte">
        <h2>Equipo de soporte</h2>
        <div className="card card-pad">
          <p className="hint" style={{ marginBottom: 12 }}>Estos roles ven y responden los tickets. Se aplican al panel recién publicado.</p>
          <Checklist
            items={supportRoles}
            selected={state.supportRoleIds}
            onChange={(next) => update('supportRoleIds', next)}
            ariaLabel="Roles de soporte"
            emptyText="No hay roles configurables."
          />
        </div>
      </section>

      <div className="callout mt" role="note">
        <Info className="icon" aria-hidden="true" />
        <span>El panel interactivo se publica con <code>/ticket panel</code>. Cambiar título, descripción o roles aquí afecta al próximo panel que publiques.</span>
      </div>

      <SaveBar visible={dirty} saving={saving} onSave={save} onDiscard={discard} />
      <Toast toast={toast} onDone={dismissToast} />
    </>
  );
}
