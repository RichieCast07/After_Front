import type { EventDTO } from "../../Data/Models/Event";

interface EventsPanelProps {
  events: EventDTO[];
  selectedEventId: number | null;
  setSelectedEventId: (value: number) => void;
  loading: boolean;
  saving: boolean;
  error: string;
  readOnly?: boolean;
  onCreateClick?: () => void;
  onEdit: (event: EventDTO) => void;
  onToggle: (id: number) => void;
  onViewDetails?: (id: number) => void;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function EventsPanel({
  events,
  selectedEventId,
  setSelectedEventId,
  loading,
  error,
  readOnly = false,
  onCreateClick,
  onEdit,
  onToggle,
  onViewDetails,
}: EventsPanelProps) {
  return (
    <section className="glass-panel panel-grid">
      <div>
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Events</span>
            <h2>Agenda operativa</h2>
          </div>
          <span className="status-chip">{events.length} eventos</span>
        </div>

        {!readOnly && onCreateClick ? (
          <div className="action-row" style={{ marginBottom: "10px" }}>
            <button type="button" className="primary-button" onClick={onCreateClick}>
              Crear evento
            </button>
          </div>
        ) : null}

        <div className="select-frame">
          <label htmlFor="event-scope">Evento activo</label>
          <select
            id="event-scope"
            value={selectedEventId ?? ""}
            onChange={(event) => setSelectedEventId(Number(event.target.value))}
            disabled={!events.length}
          >
            <option value="" disabled>
              Selecciona un evento
            </option>
            {events.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nombre}
              </option>
            ))}
          </select>
        </div>

        {loading ? <p className="muted-copy">Cargando eventos...</p> : null}
        {error ? <p className="inline-error">{error}</p> : null}

        <div className="collection-list">
          {events.map((item) => (
            <article
              key={item.id}
              className={`collection-card event-card ${selectedEventId === item.id ? "collection-card-active" : ""}`}
            >
              <div className="event-card-main">
                <h3>{item.nombre}</h3>
                <p>{formatDate(item.fecha_evento)}</p>
                <div className="event-meta-row">
                  <small>{item.lugar || "Ubicación pendiente"}</small>
                  {item.maps_url ? (
                    <a className="event-map-link" href={item.maps_url} target="_blank" rel="noreferrer">
                      Ver mapa
                    </a>
                  ) : null}
                </div>
                <div className="event-meta-row">
                  <small>
                    Precio inicial: {item.precio_inicial != null ? `$${Number(item.precio_inicial).toFixed(2)}` : "No definido"}
                  </small>
                  <small className="event-code">Código: {item.codigo_evento}</small>
                </div>
              </div>
              <div className="collection-actions event-actions">
                <span className={`pill ${item.activo ? "pill-success" : "pill-muted"}`}>
                  {item.activo ? "Activo" : "Inactivo"}
                </span>
                <button
                  type="button"
                  className="ghost-button event-action-btn"
                  onClick={() => {
                    setSelectedEventId(item.id);
                    onViewDetails?.(item.id);
                  }}
                >
                  Ver detalle
                </button>
                {!readOnly ? (
                  <>
                    <button type="button" className="ghost-button event-action-btn" onClick={() => onEdit(item)}>
                      Editar
                    </button>
                    <button type="button" className="ghost-button event-action-btn" onClick={() => onToggle(item.id)}>
                      {item.activo ? "Desactivar" : "Activar"}
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