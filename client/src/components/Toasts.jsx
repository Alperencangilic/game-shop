export default function Toasts({ toasts, onClose }) {
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`} role={t.type === 'error' ? 'alert' : 'status'}>
          <span>{t.message}</span>
          {t.action && (
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => {
                t.action.onClick();
                onClose(t.id);
              }}
            >
              {t.action.label}
            </button>
          )}
          <button type="button" className="toast-close" onClick={() => onClose(t.id)} aria-label="Close">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
