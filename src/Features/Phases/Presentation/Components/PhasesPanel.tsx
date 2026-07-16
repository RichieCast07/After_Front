import type { PhaseDTO } from "../../Data/Models/Phase";
import { formatDateOnly } from "../../../../Core/Utils/date";

interface PhasesPanelProps {
  eventName?: string;
  phases: PhaseDTO[];
  loading: boolean;
  error: string;
  readOnly?: boolean;
  onCreateClick?: () => void;
  onEdit: (phase: PhaseDTO) => void;
  onToggle: (phaseId: number) => void;
}

export default function PhasesPanel({
  eventName,
  phases,
  loading,
  error,
  readOnly = false,
  onCreateClick,
  onEdit,
  onToggle,
}: PhasesPanelProps) {
  return (
    <section className="glass-panel panel-grid">
      <div>
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Phases</span>
            <h2>Fases del evento</h2>
          </div>
          <span className="status-chip">{eventName ?? "Sin evento activo"}</span>
        </div>

        {!readOnly && onCreateClick ? (
          <div className="action-row" style={{ marginBottom: "10px" }}>
            <button type="button" className="primary-button" onClick={onCreateClick}>
              Crear fase
            </button>
          </div>
        ) : null}

        {loading ? <p className="muted-copy">Cargando fases...</p> : null}
        {error ? <p className="inline-error">{error}</p> : null}

        <div className="collection-list">
          {phases.map((phase) => (
            <article key={phase.id} className="collection-card list-card">
              <div className="list-card-info">
                <h3>{phase.nombre}</h3>
                <p>${Number(phase.precio).toFixed(2)}</p>
                <small>
                  {formatDateOnly(phase.fecha_inicio)} - {formatDateOnly(phase.fecha_fin)}
                </small>
              </div>
              <div className="list-card-badges">
                <span className={`pill pill-status ${phase.activa ? "pill-success is-active" : "pill-muted"}`}>
                  {phase.activa ? "Activa" : "Inactiva"}
                </span>
              </div>
              {!readOnly ? (
                <div className="list-card-actions">
                  <button type="button" className="ghost-button" onClick={() => onEdit(phase)}>
                    Editar
                  </button>
                  <button type="button" className="ghost-button" onClick={() => onToggle(phase.id)}>
                    {phase.activa ? "Cerrar" : "Reabrir"}
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}