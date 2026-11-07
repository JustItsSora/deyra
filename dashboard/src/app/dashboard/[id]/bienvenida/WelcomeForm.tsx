'use client';

import Link from 'next/link';
import { Info } from 'lucide-react';
import { useSectionForm } from '@/lib/useSectionForm';
import SaveBar from '@/components/SaveBar';
import Toast from '@/components/Toast';
import Listbox from '@/components/Listbox';
import Toggle from '@/components/Toggle';
import { channelOptions, NO_CHANNEL } from '@/lib/options';
import type { WelcomeSection, BotChannel } from '@/lib/types';

export default function WelcomeForm({
  guildId,
  initial,
  channels,
}: {
  guildId: string;
  initial: WelcomeSection;
  channels: BotChannel[];
}) {
  const { state, update, dirty, saving, save, discard, toast, dismissToast } = useSectionForm({
    guildId,
    section: 'welcome',
    initial,
  });

  const channelList = channelOptions(channels);

  return (
    <>
      <section className="panel" aria-label="Bienvenidas">
        <div className="panel-head"><div><h2 className="panel-title">Bienvenidas</h2>
          <p className="panel-desc">Mensaje al entrar al servidor.</p></div></div>
        <div className="panel-body">
        <div className="setting-row">
          <span>
            <span className="label">Bienvenidas activas</span>
            <span className="desc">Mensaje al entrar y al salir del servidor.</span>
          </span>
          <Toggle checked={state.welcomeEnabled} onChange={(v) => update('welcomeEnabled', v)} label="Bienvenidas activas" />
        </div>

        <div className="setting-row">
          <span>
            <span className="label">Canal de bienvenida</span>
            <span className="desc">Dónde se publica la bienvenida.</span>
          </span>
          <div className="control">
            <Listbox
              value={state.welcomeChannelId ?? NO_CHANNEL}
              options={channelList}
              onChange={(v) => update('welcomeChannelId', v === NO_CHANNEL ? null : v)}
              ariaLabel="Canal de bienvenida"
            />
          </div>
        </div>

        <div className="field" style={{ paddingTop: 14 }}>
          <label className="label" htmlFor="welcomeMessage">Mensaje de bienvenida</label>
          <textarea
            id="welcomeMessage"
            className="textarea"
            value={state.welcomeMessage}
            maxLength={500}
            onChange={(e) => update('welcomeMessage', e.target.value)}
          />
          <span className="hint">Variables: <code>{'{user}'}</code> menciona al miembro, <code>{'{server}'}</code> el nombre del servidor, <code>{'{membercount}'}</code> el número de miembros.</span>
        </div>
        </div>
      </section>

      <section className="panel" aria-label="Despedidas">
        <div className="panel-head"><div><h2 className="panel-title">Despedidas</h2>
          <p className="panel-desc">Mensaje cuando alguien se marcha del servidor.</p></div></div>
        <div className="panel-body">
          <div className="setting-row">
            <span>
              <span className="label">Despedidas activas</span>
              <span className="desc">Mensaje cuando alguien se marcha del servidor.</span>
            </span>
            <Toggle checked={state.leaveEnabled} onChange={(v) => update('leaveEnabled', v)} label="Despedidas activas" />
          </div>

          <div className="setting-row">
            <span>
              <span className="label">Canal de despedida</span>
              <span className="desc">Vacío = usar el mismo canal de bienvenida.</span>
            </span>
            <div className="control">
              <Listbox
                value={state.leaveChannelId ?? NO_CHANNEL}
                options={channelList}
                onChange={(v) => update('leaveChannelId', v === NO_CHANNEL ? null : v)}
                ariaLabel="Canal de despedida"
              />
            </div>
          </div>

          <div className="field" style={{ paddingTop: 14 }}>
            <label className="label" htmlFor="leaveMessage">Mensaje de despedida</label>
            <textarea
              id="leaveMessage"
              className="textarea"
              value={state.leaveMessage}
              maxLength={500}
              onChange={(e) => update('leaveMessage', e.target.value)}
            />
            <span className="hint">Mismas variables que la bienvenida.</span>
          </div>
        </div>
      </section>

      <div className="callout mt" role="note">
        <Info className="icon" aria-hidden="true" />
        <span>Los autorroles se configuran en <Link href={`/dashboard/${guildId}/autorole`} className="text-link">Autorole</Link>, en este mismo panel.</span>
      </div>

      <SaveBar visible={dirty} saving={saving} onSave={save} onDiscard={discard} />
      <Toast toast={toast} onDone={dismissToast} />
    </>
  );
}
