'use client';

import { Info } from 'lucide-react';
import { useSectionForm } from '@/lib/useSectionForm';
import SaveBar from '@/components/SaveBar';
import Toast from '@/components/Toast';
import Listbox from '@/components/Listbox';
import { channelOptions, roleOptions, NO_CHANNEL } from '@/lib/options';
import type { GuildSection, BotChannel, BotRole } from '@/lib/types';

export default function RegistrosForm({
  guildId,
  initial,
  channels,
  roles,
}: {
  guildId: string;
  initial: GuildSection;
  channels: BotChannel[];
  roles: BotRole[];
}) {
  const { state, update, dirty, saving, save, discard, toast, dismissToast } = useSectionForm({
    guildId,
    section: 'guild',
    initial,
  });

  const ch = channelOptions(channels);
  const ro = roleOptions(roles);
  const set = (key: keyof Pick<GuildSection, 'modLogChannelId' | 'memberLogChannelId' | 'messageLogChannelId' | 'muteRoleId'>) =>
    (v: string) => update(key, v === NO_CHANNEL ? null : v);

  return (
    <>
      <section className="panel" aria-label="Canales">
        <div className="panel-head"><div><h2 className="panel-title">Canales</h2>
          <p className="panel-desc">Dónde publica Deyra cada tipo de evento.</p></div></div>
        <div className="panel-body">
        <div className="setting-row">
          <span>
            <span className="label">Logs de moderación</span>
            <span className="desc">Banea, expulsa, silencia, advierte y acciones del automod.</span>
          </span>
          <div className="control">
            <Listbox value={state.modLogChannelId ?? NO_CHANNEL} options={ch} onChange={set('modLogChannelId')} ariaLabel="Canal de logs de moderación" />
          </div>
        </div>

        <div className="setting-row">
          <span>
            <span className="label">Entradas y salidas</span>
            <span className="desc">Quién entra y quién sale, con fecha de creación de la cuenta.</span>
          </span>
          <div className="control">
            <Listbox value={state.memberLogChannelId ?? NO_CHANNEL} options={ch} onChange={set('memberLogChannelId')} ariaLabel="Canal de logs de miembros" />
          </div>
        </div>

        <div className="setting-row">
          <span>
            <span className="label">Mensajes borrados y editados</span>
            <span className="desc">Copia del contenido y del autor, con supresión automática de ráfagas.</span>
          </span>
          <div className="control">
            <Listbox value={state.messageLogChannelId ?? NO_CHANNEL} options={ch} onChange={set('messageLogChannelId')} ariaLabel="Canal de logs de mensajes" />
          </div>
        </div>

        <div className="setting-row">
          <span>
            <span className="label">Rol de silencio manual</span>
            <span className="desc">Rol que retira permisos de escritura en mutes manuales (/mute).</span>
          </span>
          <div className="control">
            <Listbox value={state.muteRoleId ?? NO_CHANNEL} options={ro} onChange={set('muteRoleId')} ariaLabel="Rol de silencio manual" />
          </div>
        </div>
      </div>
      </section>

      <div className="callout mt" role="note">
        <Info className="icon" aria-hidden="true" />
        <span>Los canales de log no pueden ser <em>solo de lectura</em>: el bot publica en ellos. Dale permisos de enviar mensajes y ver el canal.</span>
      </div>

      <SaveBar visible={dirty} saving={saving} onSave={save} onDiscard={discard} />
      <Toast toast={toast} onDone={dismissToast} />
    </>
  );
}
