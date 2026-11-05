import type { LucideIcon } from 'lucide-react';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
};

export default function EmptyState({ icon: Icon, title, children, action }: EmptyStateProps) {
  return (
    <div className="empty">
      <Icon className="icon" strokeWidth={1.5} aria-hidden="true" />
      <h3>{title}</h3>
      <div>{children}</div>
      {action}
    </div>
  );
}
