import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';

type StatusPillProps = {
  state: 'ok' | 'off' | 'warn';
  okText: string;
  offText: string;
  warnText?: string;
};

export default function StatusPill({ state, okText, offText, warnText }: StatusPillProps) {
  if (state === 'ok') {
    return <span className="pill ok"><CheckCircle2 size={14} aria-hidden="true" />{okText}</span>;
  }
  if (state === 'warn') {
    return <span className="pill warn"><AlertCircle size={14} aria-hidden="true" />{warnText ?? 'Requiere atención'}</span>;
  }
  return <span className="pill off"><Circle size={14} aria-hidden="true" />{offText}</span>;
}
