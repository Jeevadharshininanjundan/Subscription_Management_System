export function LoadingState() {
  return <div className="state-card" role="status"><span className="spinner" /> Loading data…</div>;
}

export function ErrorState({ message, onRetry }) {
  return <div className="state-card error-state" role="alert"><strong>We couldn’t load this data.</strong><span>{message}</span>{onRetry && <button onClick={onRetry}>Try again</button>}</div>;
}

export function EmptyState({ title = 'Nothing here yet', message = 'Records will appear when they are created.' }) {
  return <div className="state-card"><strong>{title}</strong><span>{message}</span></div>;
}

export function StatusPill({ value }) {
  return <span className={`status-pill status-${String(value).toLowerCase()}`}>{String(value).replaceAll('_', ' ')}</span>;
}
