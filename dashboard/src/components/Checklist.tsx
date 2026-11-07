'use client';

import type { CSSProperties } from 'react';

type ChecklistItem = { id: string; label: string; color?: string };

type ChecklistProps = {
  items: ChecklistItem[];
  selected: string[];
  onChange: (next: string[]) => void;
  ariaLabel: string;
  emptyText: string;
};

/** Lista de checkboxes con color opcional (roles). Para listas largas: scroll interno. */
export default function Checklist({ items, selected, onChange, ariaLabel, emptyText }: ChecklistProps) {
  if (items.length === 0) return <p className="hint">{emptyText}</p>;

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  return (
    <div role="group" aria-label={ariaLabel} className="checklist">
      {items.map((item) => (
        <label key={item.id} className="checkline">
          <input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggle(item.id)} />
          {item.color && <span className="role-dot" style={{ '--role-dot': item.color } as CSSProperties} aria-hidden="true" />}
          <span>{item.label}</span>
        </label>
      ))}
    </div>
  );
}
