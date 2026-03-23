import type { ReactNode } from 'react';

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  accent?: 'blue' | 'teal' | 'purple' | 'amber';
  children?: ReactNode;
};

export function StatCard({
  label,
  value,
  hint,
  accent = 'blue',
  children,
}: StatCardProps) {
  return (
    <article className={`stat-card accent-${accent}`}>
      <p className="stat-label">{label}</p>
      <strong className="stat-value">{value}</strong>
      {hint ? <p className="stat-hint">{hint}</p> : null}
      {children}
    </article>
  );
}
