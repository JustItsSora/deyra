import type { LucideIcon } from 'lucide-react';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  /** Muestra el retrato atenuado en lugar del icono (bot sin respuesta). */
  portrait?: boolean;
};

export default function EmptyState({ icon: Icon, title, children, action, portrait }: EmptyStateProps) {
  return (
    <div className="empty">
      {portrait ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="empty-portrait" src="/danica.jpg" alt="" width={72} height={72} />
      ) : (
        <Icon className="icon" strokeWidth={1.5} aria-hidden="true" />
      )}
      <h3>{title}</h3>
      <div>{children}</div>
      {action}
    </div>
  );
}
