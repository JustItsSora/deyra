'use client';

import { useState } from 'react';
import { Plus, Trash2, Info } from 'lucide-react';
import { useSectionForm } from '@/lib/useSectionForm';
import SaveBar from '@/components/SaveBar';
import Toast from '@/components/Toast';
import Listbox from '@/components/Listbox';
import Toggle from '@/components/Toggle';
import Checklist from '@/components/Checklist';
import { textChannelOptions, NO_CHANNEL } from '@/lib/options';
import type { LevelsSection, BotChannel, BotRole } from '@/lib/types';

function NumberInput({ id, value, onChange, min, max, label }: {
  id: string; value: number; onChange: (v: number) => void; min: number; max: number; label: string;
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

export default function LevelsForm({
  guildId,
  initial,
  channels,
  roles,
}: {
  guildId: string;
  initial: LevelsSection;
  channels: BotChannel[];
  roles: BotRole[];
}) {
  const { state, update, dirty, saving, save, discard, toast, dismissToast } = useSectionForm({
    guildId,
    section: 'levels',
    initial,
  });

  const [rewardRole, setRewardRole] = useState('');
  const [rewardLevel, setRewardLevel] = useState(5);

  const rewardEntries = Object.entries(state.roleRewards)
    .map(([level, roleId]) => ({ level: Number(level), roleId }))
    .sort((a, b) => a.level - b.level);

  const availableRoles = roles.filter((r) => !r.managed && !r.isEveryone);
  const rewardableRoles = availableRoles.filter((r) => !Object.values(state.roleRewards).includes(r.id));

  const addReward = () => {
    if (!rewardRole || rewardLevel < 1) return;
    update('roleRewards', { ...state.roleRewards, [String(rewardLevel)]: rewardRole });
    setRewardRole('');
  };

  const removeReward = (level: number) => {
    const next = { ...state.roleRewards };
    delete next[String(level)];
    update('roleRewards', next);
  };

  const announceOptions = [
    { value: NO_CHANNEL, label: 'Mismo canal del mensaje' },
    ...textChannelOptions(channels, false),
  ];

  return (
    <>
      <div className="card card-pad">
        <div className="setting-row">
          <span>
            <span className="label">Niveles y XP activos</span>
            <span className="desc">Los miembros ganan XP al chatear y suben de nivel.</span>
          </span>
          <Toggle checked={state.enabled} onChange={(v) => update('enabled', v)} label="Niveles activos" />
        </div>
        <div className="setting-row">
          <span>
            <span className="label">Anunciar subidas de nivel</span>
            <span className="desc">Publica un aviso cuando alguien sube de nivel.</span>
          </span>
          <Toggle checked={state.announceLevelUp} onChange={(v) => update('announceLevelUp', v)} label="Anunciar subidas" disabled={!state.enabled} />
        </div>
        <div className="setting-row">
          <span>
            <span className="label">Canal de anuncios</span>
            <span className="desc">¿Dónde se publica el aviso? Vacío = en el mismo canal donde ocurrió.</span>
          </span>
          <div style={{ minWidth: 220, maxWidth: 320, width: '100%' }}>
            <Listbox
              value={state.announceChannelId ?? NO_CHANNEL}
              options={announceOptions}
              onChange={(v) => update('announceChannelId', v === NO_CHANNEL ? null : v)}
              ariaLabel="Canal de anuncios de nivel"
              disabled={!state.enabled}
            />
          </div>
        </div>
      </div>

      <section className="section-block" aria-label="Ganancia de XP">
        <h2>Ganancia de XP</h2>
        <div className="card card-pad" style={{ display: 'flex', gap: 18, flexWrap: 'wrap', opacity: state.enabled ? 1 : 0.55, pointerEvents: state.enabled ? 'auto' : 'none' }}>
          <NumberInput id="xpMin" label="XP mín. por mensaje" min={1} max={200} value={state.xpPerMessageMin} onChange={(v) => update('xpPerMessageMin', v)} />
          <NumberInput id="xpMax" label="XP máx. por mensaje" min={1} max={200} value={state.xpPerMessageMax} onChange={(v) => update('xpPerMessageMax', v)} />
          <NumberInput id="xpCooldown" label="Cooldown (segundos)" min={0} max={3600} value={state.xpCooldownSeconds} onChange={(v) => update('xpCooldownSeconds', v)} />
        </div>
        {state.xpPerMessageMin > state.xpPerMessageMax && (
          <p className="error-text mt" role="alert">El XP mínimo no puede ser mayor que el máximo.</p>
        )}
      </section>

      <section className="section-block" aria-label="Recompensas por nivel">
        <h2>Recompensas por nivel</h2>
        <div className="card card-pad">
          {rewardEntries.length > 0 ? (
            <div style={{ display: 'grid', gap: 8 }}>
              {rewardEntries.map(({ level, roleId }) => {
                const role = roles.find((r) => r.id === roleId);
                return (
                  <div key={level} className="setting-row" style={{ padding: '9px 2px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="pill" style={{ minWidth: 54, justifyContent: 'center' }}>Nvl {level}</span>
                      <span>{role ? `@${role.name}` : `rol ${roleId.slice(0, 6)}…`}</span>
                    </span>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeReward(level)} aria-label={`Quitar recompensa de nivel ${level}`}>
                      <Trash2 size={15} aria-hidden="true" />
                      Quitar
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="hint">Sin recompensas todavía. Al llegar al nivel elegido, el miembro recibe el rol automáticamente.</p>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14, alignItems: 'flex-end' }}>
            <div className="field" style={{ flex: '2 1 200px' }}>
              <span className="label">Rol a otorgar</span>
              <Listbox
                value={rewardRole || null}
                options={rewardableRoles.map((r) => ({ value: r.id, label: `@${r.name}` }))}
                onChange={setRewardRole}
                ariaLabel="Rol de recompensa"
                placeholder="Elige un rol…"
                emptyText="Todos los roles ya tienen recompensa"
              />
            </div>
            <NumberInput id="rewardLevel" label="Al llegar a nivel" min={1} max={1000} value={rewardLevel} onChange={setRewardLevel} />
            <button type="button" className="btn btn-subtle" onClick={addReward} disabled={!rewardRole || rewardLevel < 1}>
              <Plus size={16} aria-hidden="true" />
              Añadir
            </button>
          </div>
        </div>
      </section>

      <section className="section-block" aria-label="Canales ignorados">
        <h2>Canales sin XP</h2>
        <div className="card card-pad">
          <Checklist
            items={channels.filter((c) => [0, 5, 15].includes(c.type)).map((c) => ({ id: c.id, label: `#${c.name}` }))}
            selected={state.ignoredChannels}
            onChange={(next) => update('ignoredChannels', next)}
            ariaLabel="Canales donde no se gana XP"
            emptyText="No hay canales de texto en este servidor."
          />
          <p className="hint" style={{ marginTop: 10 }}>En estos canales los miembros no ganan XP (p. ej. memes o spam permitido).</p>
        </div>
      </section>

      <div className="callout mt" role="note">
        <Info className="icon" aria-hidden="true" />
        <span>Los niveles son independientes de la configuración de bienvenida y autorole: aquí solo vive el XP.</span>
      </div>

      <SaveBar visible={dirty} saving={saving} onSave={save} onDiscard={discard} />
      <Toast toast={toast} onDone={dismissToast} />
    </>
  );
}
