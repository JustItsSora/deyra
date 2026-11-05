'use client';

import { useSectionForm } from '@/lib/useSectionForm';
import SaveBar from '@/components/SaveBar';
import Toast from '@/components/Toast';
import Listbox from '@/components/Listbox';
import Toggle from '@/components/Toggle';
import ChipsEditor from '@/components/ChipsEditor';
import Checklist from '@/components/Checklist';
import { channelOptions } from '@/lib/options';
import type { AutomodSection, BotChannel, BotRole } from '@/lib/types';

const ACTION_OPTIONS = [
  { value: 'delete', label: 'Solo borrar el mensaje' },
  { value: 'warn', label: 'Borrar y advertir' },
  { value: 'mute', label: 'Borrar y silenciar 10 min' },
  { value: 'kick', label: 'Borrar y expulsar' },
  { value: 'ban', label: 'Borrar y banear' },
];

const ESCALATION_OPTIONS = [
  { value: 'off', label: 'Desactivada' },
  { value: 'timeout', label: 'Silenciar 1 hora' },
  { value: 'kick', label: 'Expulsar' },
  { value: 'ban', label: 'Banear' },
];

function normalizeDomain(raw: string): string | null {
  let input = raw.trim().toLowerCase();
  if (!input) return null;
  if (/^https?:\/\//.test(input)) {
    try { input = new URL(input).hostname; } catch { return null; }
  }
  input = input.replace(/^www\./, '').replace(/\/.*$/, '');
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(input) ? input : null;
}

function NumberInput({ id, value, onChange, min, max, label }: {
  id: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  label: string;
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

export default function AutomodForm({
  guildId,
  initial,
  channels,
  roles,
}: {
  guildId: string;
  initial: AutomodSection;
  channels: BotChannel[];
  roles: BotRole[];
}) {
  const { state, update, dirty, saving, save, discard, toast, dismissToast } = useSectionForm({
    guildId,
    section: 'automod',
    initial,
  });

  type BoolKey = 'antiInvite' | 'antiLink' | 'antiSpam' | 'antiMention' | 'antiCaps' | 'antiBadWords' | 'aiModeration';
  const toggleRow = (key: BoolKey, label: string, desc: string) => (
    <div className="setting-row" key={key}>
      <span>
        <span className="label">{label}</span>
        <span className="desc">{desc}</span>
      </span>
      <Toggle checked={state[key]} onChange={(v) => update(key, v)} label={label} disabled={!state.enabled} />
    </div>
  );

  return (
    <>
      <div className="card card-pad">
        <div className="setting-row">
          <span>
            <span className="label">Automod activo</span>
            <span className="desc">Apaga o enciende todas las protecciones de una vez. Con esto apagado, nada de lo demás se aplica.</span>
          </span>
          <Toggle checked={state.enabled} onChange={(v) => update('enabled', v)} label="Automod activo" />
        </div>
      </div>

      <section className="section-block" aria-label="Protecciones">
        <h2>Protecciones</h2>
        <div className="card card-pad" style={{ opacity: state.enabled ? 1 : 0.55, pointerEvents: state.enabled ? 'auto' : 'none' }}>
          {toggleRow('antiInvite', 'Anti-invitaciones', 'Elimina enlaces de discord.gg, discord.com/invite, dsc.gg e invite.gg.')}
          {toggleRow('antiLink', 'Anti-enlaces', 'Elimina enlaces HTTP/HTTPS salvo los dominios de tu lista blanca.')}
          {toggleRow('antiSpam', 'Anti-spam', 'Ráfagas de mensajes o mismo contenido repetido. Ver ajustes finos.')}
          {toggleRow('antiMention', 'Anti-menciones masivas', 'Cuenta usuarios + roles + @everyone/@here.')}
          {toggleRow('antiCaps', 'Anti-mayúsculas', 'Mensajes con demasiadas mayúsculas sostenidas.')}
          {toggleRow('antiBadWords', 'Palabras prohibidas', 'Match por límites de palabra; edita la lista abajo.')}
          {toggleRow('aiModeration', 'Segunda opinión con IA', 'Solo para palabras prohibidas y mayúsculas. Los objetivos seguros nunca van a la IA.')}
        </div>
      </section>

      <section className="section-block" aria-label="Ajustes finos">
        <h2>Ajustes finos</h2>
        <div className="card card-pad" style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <NumberInput id="maxMentions" label="Máx. menciones" min={1} max={50} value={state.maxMentions} onChange={(v) => update('maxMentions', v)} />
          <NumberInput id="spamMessageCount" label="Mensajes para spam" min={2} max={30} value={state.spamMessageCount} onChange={(v) => update('spamMessageCount', v)} />
          <NumberInput id="spamIntervalSeconds" label="Ventana (segundos)" min={1} max={120} value={state.spamIntervalSeconds} onChange={(v) => update('spamIntervalSeconds', v)} />
          <NumberInput id="capsPercentThreshold" label="% de mayúsculas" min={1} max={100} value={state.capsPercentThreshold} onChange={(v) => update('capsPercentThreshold', v)} />
        </div>
      </section>

      <section className="section-block" aria-label="Palabras prohibidas">
        <h2>Palabras prohibidas</h2>
        <div className="card card-pad">
          <ChipsEditor
            values={state.badWordsList}
            onChange={(next) => update('badWordsList', next)}
            placeholder="palabra…"
            ariaLabel="Lista de palabras prohibidas"
            disabled={!state.antiBadWords}
          />
          <p className="hint" style={{ marginTop: 10 }}>El filtro es insensible a mayúsculas y evita falsos positivos tipo «class» gracias a los límites de palabra.</p>
        </div>
      </section>

      <section className="section-block" aria-label="Dominios permitidos">
        <h2>Dominios permitidos</h2>
        <div className="card card-pad">
          <ChipsEditor
            values={state.linkAllowlist}
            onChange={(next) => update('linkAllowlist', next)}
            placeholder="youtube.com"
            ariaLabel="Dominios permitidos con anti-enlaces"
            normalize={normalizeDomain}
            disabled={!state.antiLink}
          />
          <p className="hint" style={{ marginTop: 10 }}>Los subdominios también quedan permitidos (p. ej. <code>youtube.com</code> permite <code>www.youtube.com</code> y <code>m.youtube.com</code>).</p>
        </div>
      </section>

      <section className="section-block" aria-label="Acción al detectar">
        <h2>Acción al detectar</h2>
        <div className="card card-pad">
          <div className="cols cols-2">
            <div className="field">
              <label className="label" htmlFor="punishmentAction">Cuando hay una infracción</label>
              <Listbox value={state.punishmentAction} options={ACTION_OPTIONS} onChange={(v) => update('punishmentAction', v as AutomodSection['punishmentAction'])} ariaLabel="Acción al detectar una infracción" />
            </div>
            <div className="field">
              <label className="label" htmlFor="escalationAction">Escalada automática (30 días)</label>
              <Listbox value={state.escalationAction} options={ESCALATION_OPTIONS} onChange={(v) => update('escalationAction', v as AutomodSection['escalationAction'])} ariaLabel="Acción de escalada" />
            </div>
          </div>
          {state.escalationAction !== 'off' && (
            <div className="field mt">
              <label className="label" htmlFor="escalationThreshold">Infracciones que disparan la escalada</label>
              <NumberInput id="escalationThreshold" label="Infracciones" min={1} max={100} value={state.escalationThreshold} onChange={(v) => update('escalationThreshold', v)} />
              <p className="hint">Cada infracción queda registrada en /warnings. Al llegar al umbral en 30 días, la sanción sube sola.</p>
            </div>
          )}
        </div>
      </section>

      <section className="section-block" aria-label="Canales y roles de confianza">
        <h2>Canales y roles de confianza</h2>
        <div className="cols cols-2">
          <div className="card card-pad">
            <span className="label">Canales excluidos</span>
            <div className="mt">
              <Checklist
                items={channels.map((c) => ({ id: c.id, label: `#${c.name}` }))}
                selected={state.whitelistedChannels}
                onChange={(next) => update('whitelistedChannels', next)}
                ariaLabel="Canales excluidos del automod"
                emptyText="No hay canales de texto en este servidor."
              />
            </div>
          </div>
          <div className="card card-pad">
            <span className="label">Roles excluidos</span>
            <div className="mt">
              <Checklist
                items={roles.filter((r) => !r.managed && !r.isEveryone).map((r) => ({ id: r.id, label: `@${r.name}`, color: r.color !== '#000000' ? r.color : undefined }))}
                selected={state.whitelistedRoles}
                onChange={(next) => update('whitelistedRoles', next)}
                ariaLabel="Roles excluidos del automod"
                emptyText="No hay roles configurables."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section-block" aria-label="Registro">
        <h2>Registro de acciones</h2>
        <div className="card card-pad">
          <span className="label">Canal de logs del automod</span>
          <div className="mt" style={{ maxWidth: 420 }}>
            <Listbox
              value={state.logChannelId ?? ''}
              options={channelOptions(channels)}
              onChange={(v) => update('logChannelId', v === '' ? null : v)}
              ariaLabel="Canal de logs del automod"
            />
          </div>
        </div>
      </section>

      <SaveBar visible={dirty} saving={saving} onSave={save} onDiscard={discard} />
      <Toast toast={toast} onDone={dismissToast} />
    </>
  );
}
