import { useToast } from '../context/ToastContext.jsx';

// If "reason" is set the button looks disabled and shows the reason when clicked
export default function ReasonButton({ reason, onClick, className = 'btn', children, ...rest }) {
  const toast = useToast();
  if (!reason) {
    return (
      <button type="button" className={className} onClick={onClick} {...rest}>
        {children}
      </button>
    );
  }
  return (
    <button
      type="button"
      className={`${className} disabled-look`}
      title={reason}
      aria-disabled="true"
      onClick={(e) => {
        e.stopPropagation();
        toast.warning(reason);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
