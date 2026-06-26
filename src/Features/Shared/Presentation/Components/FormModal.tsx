import type { ReactNode } from "react";

interface FormModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}

export default function FormModal({ title, subtitle, onClose, children }: FormModalProps) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="form-modal-title">
      <section className="modal-card">
        <div className="panel-heading">
          <div>
            {subtitle ? <span className="eyebrow">{subtitle}</span> : null}
            <h2 id="form-modal-title">{title}</h2>
          </div>
          <button type="button" className="ghost-button" onClick={onClose}>
            Cerrar
          </button>
        </div>

        {children}
      </section>
    </div>
  );
}
