import type { ReactNode } from 'react';
import { ArrowUpRight, ChevronRight, Info, Sparkles } from 'lucide-react';
import type { Action, ActionResult, GameState } from '../game/types';

export type Navigate = (page: string) => void;
export interface PanelProps {
  s: GameState;
  act: (action: Action) => ActionResult;
  navigate: Navigate;
}
export const money = (n: number, digits = 2) =>
  n.toLocaleString('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits });
export const num = (n: number, digits = 0) =>
  n.toLocaleString('zh-CN', { maximumFractionDigits: digits });
export function Badge({
  children,
  tone = 'green',
}: {
  children: ReactNode;
  tone?: 'green' | 'amber' | 'red' | 'gray' | 'blue';
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Panel({
  title,
  eyebrow,
  extra,
  children,
  className = '',
}: {
  title?: string;
  eyebrow?: string;
  extra?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      {title && (
        <div className="panel-header">
          <div>
            {eyebrow && <div className="eyebrow">{eyebrow}</div>}
            <h3>{title}</h3>
          </div>
          {extra}
        </div>
      )}
      {children}
    </section>
  );
}
export function Metric({
  label,
  value,
  unit,
  detail,
  icon,
  tone = '',
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  detail: ReactNode;
  icon?: ReactNode;
  tone?: string;
}) {
  return (
    <div className={`metric ${tone}`}>
      <div className="metric-label">
        {label}
        {icon ?? <ArrowUpRight size={16} />}
      </div>
      <div className="metric-value">
        {value}
        <small>{unit}</small>
      </div>
      <div className="metric-detail">{detail}</div>
    </div>
  );
}
export function Progress({ value, tone = '' }: { value: number; tone?: string }) {
  return (
    <div className={`progress ${tone}`}>
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
export function Tip({ children }: { children: ReactNode }) {
  return (
    <div className="tip">
      <Info size={16} />
      <span>{children}</span>
    </div>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="empty">
      <Sparkles size={24} />
      <p>{children}</p>
    </div>
  );
}
export function PageTitle({
  eyebrow,
  title,
  description,
  extra,
}: {
  eyebrow: string;
  title: string;
  description: string;
  extra?: ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {extra}
    </div>
  );
}
export function LinkButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button className="text-button" onClick={onClick}>
      {children}
      <ChevronRight size={15} />
    </button>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
