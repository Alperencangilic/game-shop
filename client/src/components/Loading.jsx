// Small helper components for loading / empty / error states
export function Loading({ text = 'Loading...' }) {
  return <p className="loading">{text}</p>;
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function ErrorBox({ error, onRetry }) {
  return (
    <div className="alert alert-error">
      <b>Error:</b> {error?.message ?? 'Something went wrong.'}{' '}
      {onRetry && (
        <button type="button" className="btn btn-sm btn-secondary" onClick={() => onRetry()}>
          Try again
        </button>
      )}
    </div>
  );
}

export function Alert({ type = 'info', title, children, action }) {
  return (
    <div className={`alert alert-${type}`}>
      {title && <b>{title} </b>}
      {children}
      {action && <div className="alert-action">{action}</div>}
    </div>
  );
}
