'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export type ListboxOption = {
  value: string;
  label: string;
  hint?: string;
  disabled?: boolean;
};

type ListboxProps = {
  value: string | null;
  options: ListboxOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  disabled?: boolean;
  emptyText?: string;
};

/**
 * Listbox accesible (patrón del design system, reemplaza <select> nativo):
 * botón disparador, aria-expanded real, flechas/Home/End, typeahead, Escape,
 * cierre al hacer click fuera.
 */
export default function Listbox({
  value,
  options,
  onChange,
  ariaLabel,
  placeholder = 'Selecciona…',
  disabled,
  emptyText = 'Sin opciones disponibles',
}: ListboxProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open, close]);

  useEffect(() => {
    if (open) {
      setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }
  }, [open, selectedIndex]);

  const commit = useCallback((index: number) => {
    const opt = options[index];
    if (!opt || opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
  }, [options, onChange]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    const enabledIndexes = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
    const posOf = (idx: number) => enabledIndexes.indexOf(idx);
    const moveTo = (next: number) => {
      if (enabledIndexes.length === 0) return;
      const wrapped = ((next % enabledIndexes.length) + enabledIndexes.length) % enabledIndexes.length;
      setActiveIndex(enabledIndexes[wrapped]);
    };

    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
      case 'ArrowDown':
        e.preventDefault();
        moveTo(posOf(activeIndex) + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        moveTo(posOf(activeIndex) - 1);
        break;
      case 'Home':
        e.preventDefault();
        moveTo(0);
        break;
      case 'End':
        e.preventDefault();
        moveTo(enabledIndexes.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (activeIndex >= 0) commit(activeIndex);
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
        if (e.key.length === 1 && /\S/.test(e.key)) {
          const needle = e.key.toLowerCase();
          const after = options.findIndex((o, i) => i > activeIndex && !o.disabled && o.label.toLowerCase().startsWith(needle));
          const first = options.findIndex((o) => !o.disabled && o.label.toLowerCase().startsWith(needle));
          const hit = after >= 0 ? after : first;
          if (hit >= 0) setActiveIndex(hit);
        }
    }
  };

  return (
    <div className="listbox" ref={rootRef}>
      <button
        type="button"
        className="listbox-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onKeyDown}
      >
        <span className={selected ? undefined : 'muted'}>{selected?.label ?? placeholder}</span>
        <ChevronDown className="chev" aria-hidden="true" />
      </button>

      {open && (
        <div className="listbox-pop" role="listbox" id={listId} aria-label={ariaLabel}>
          {options.length === 0 && <div className="listbox-empty">{emptyText}</div>}
          {options.map((opt, i) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={opt.value === value}
              disabled={opt.disabled}
              data-active={i === activeIndex}
              className="listbox-opt"
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => commit(i)}
            >
              <span>
                {opt.label}
                {opt.hint && <span className="listbox-hint">{opt.hint}</span>}
              </span>
              <Check className="check" aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
