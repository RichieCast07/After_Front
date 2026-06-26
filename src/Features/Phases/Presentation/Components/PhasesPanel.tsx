import type { PhaseDTO } from "../../Data/Models/Phase";

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
            <article key={phase.id} className="collection-card">
              <div>
                <h3>{phase.nombre}</h3>
                <p>${Number(phase.precio).toFixed(2)}</p>
                <small>
                  {new Date(phase.fecha_inicio).toLocaleDateString("es-MX")} - {new Date(phase.fecha_fin).toLocaleDateString("es-MX")}
                </small>
              </div>
              <div className="collection-actions">
                <span className={`pill ${phase.activa ? "pill-success" : "pill-muted"}`}>
                  {phase.activa ? "Activa" : "Inactiva"}
                </span>
                {!readOnly ? (
                  <>
                    <button type="button" className="ghost-button" onClick={() => onEdit(phase)}>
                      Editar
                    </button>
                    <button type="button" className="ghost-button" onClick={() => onToggle(phase.id)}>
                      {phase.activa ? "Cerrar" : "Reabrir"}
                    </button>
                  </>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}