import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// Open modals, newest last (only the top one closes with Escape)
const openModals = [];

export default function Modal({ title, children, footer, onClose, wide = false }) {
  const boxRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const box = boxRef.current;
    openModals.push(box);
    const first = box.querySelector('[data-autofocus]') ?? box.querySelector('input, select, textarea');
    first?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape' && openModals[openModals.length - 1] === box) onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      openModals.splice(openModals.indexOf(box), 1);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return createPortal(
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={boxRef} className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
