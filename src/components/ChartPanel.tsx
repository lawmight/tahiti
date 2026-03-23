import type { ReactNode } from 'react';

type ChartPanelProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function ChartPanel({ title, description, children, footer }: ChartPanelProps) {
  return (
    <section className="panel chart-panel">
      <header className="panel-header">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </header>
      <div className="chart-container">{children}</div>
      {footer ? <footer className="panel-footer">{footer}</footer> : null}
    </section>
  );
}
