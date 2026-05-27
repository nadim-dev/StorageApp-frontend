import { useEffect } from "react";
import { AlertCircle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import "./Toast.css";

const TOAST_ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast?.message) return undefined;

    const timer = window.setTimeout(() => {
      onClose?.();
    }, toast.duration);

    return () => window.clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast?.message) return null;

  const Icon = TOAST_ICONS[toast.type] || TOAST_ICONS.info;

  return (
    <div
      className={`app-toast app-toast--${toast.type}`}
      role="status"
      aria-live="polite"
    >
      <div className="app-toast__shine" />
      <span className="app-toast__icon" aria-hidden="true">
        <Icon size={20} strokeWidth={2.4} />
      </span>

      <div className="app-toast__content">
        {toast.title && <strong>{toast.title}</strong>}
        <p>{toast.message}</p>
      </div>

      <button
        type="button"
        className="app-toast__close"
        onClick={onClose}
        aria-label="Close notification"
      >
        <X size={16} strokeWidth={2.5} />
      </button>

      <span
        className="app-toast__progress"
        style={{ animationDuration: `${toast.duration}ms` }}
      />
    </div>
  );
}
