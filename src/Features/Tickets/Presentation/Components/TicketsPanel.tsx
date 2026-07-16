import type { EventDTO } from "../../../Events/Data/Models/Event";
import type { PhaseDTO } from "../../../Phases/Data/Models/Phase";
import type { TicketDTO } from "../../Data/Models/Ticket";

interface TicketsPanelProps {
  mode: "admin" | "rp";
  currentRpId: number;
  events: EventDTO[];
  phases: PhaseDTO[];
  selectedEventId: number | null;
  setSelectedEventId: (eventId: number | null) => void;
  ticket: TicketDTO | null;
  eventTickets: TicketDTO[];
  rpTickets: TicketDTO[];
  lookupCode: string;
  setLookupCode: (value: string) => void;
  form: {
    codigo: string;
    cliente_nombre: string;
    cliente_telefono: string;
    rp_id: string;
  };
  loading: boolean;
  saving: boolean;
  error: string;
  onChange: (field: "codigo" | "cliente_nombre" | "cliente_telefono" | "rp_id", value: string) => void;
  onSell: () => void;
  onLookup: () => void;
  onMarkAsUsed: () => void;
}

function getActivePhase(phases: PhaseDTO[]): PhaseDTO | null {
  const now = new Date();
  return (
    phases.find((phase) => {
      const startsAt = new Date(phase.fecha_inicio);
      const endsAt = new Date(phase.fecha_fin);
      return Boolean(phase.activa) && now >= startsAt && now <= endsAt;
    }) ?? null
  );
}

function renderTicketCard(ticket: TicketDTO) {
  return (
    <article key={ticket.id} className="collection-card compact-ticket-card">
      <div>
        <h3>{ticket.codigo}</h3>
        <p>
          {ticket.cliente_nombre ?? `Cliente #${ticket.cliente_id}`} • Fase #{ticket.fase_id}
        </p>
        {ticket.cliente_telefono ? <small>{ticket.cliente_telefono}</small> : null}
        <small>${ticket.precio.toFixed(2)}</small>
      </div>
      <span className={`pill pill-status ${ticket.estado === "ACTIVO" ? "pill-success is-active" : "pill-muted"}`}>{ticket.estado}</span>
    </article>
  );
}

export default function TicketsPanel({
  mode,
  currentRpId,
  events,
  phases,
  selectedEventId,
  setSelectedEventId,
  ticket,
  eventTickets,
  rpTickets,
  lookupCode,
  setLookupCode,
  form,
  loading,
  saving,
  error,
  onChange,
  onSell,
  onLookup,
  onMarkAsUsed,
}: TicketsPanelProps) {
  const activePhase = getActivePhase(phases);
  const activePhasePrice = activePhase ? Number(activePhase.precio) : null;
  const rpCommission = activePhasePrice !== null ? Number((activePhasePrice * 0.1).toFixed(2)) : null;
  const noShowTickets = eventTickets.filter((ticket) => ticket.estado === "ACTIVO");

  return (
    <section className="glass-panel panel-grid panel-grid-wide">
      <div className="form-stack">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Tickets</span>
            <h2>Venta y validacion</h2>
          </div>
          <span className="status-chip">Evento #{selectedEventId ?? "-"}</span>
        </div>

        <div className="field-grid">
          <label>
            <span>Evento</span>
            <select
              value={selectedEventId ?? ""}
              onChange={(event) => setSelectedEventId(event.target.value ? Number(event.target.value) : null)}
            >
              <option value="">Selecciona evento</option>
              {events.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Nombre del cliente</span>
            <input value={form.cliente_nombre} onChange={(event) => onChange("cliente_nombre", event.target.value)} />
          </label>
          <label>
            <span>Telefono del cliente</span>
            <input value={form.cliente_telefono} onChange={(event) => onChange("cliente_telefono", event.target.value)} />
          </label>
          <label>
            <span>Fase automática</span>
            <input value={activePhase ? activePhase.nombre : "Sin fase activa"} disabled />
          </label>
          <label>
            <span>RP asignado</span>
            <input
              type="number"
              value={mode === "rp" ? currentRpId : form.rp_id}
              disabled={mode === "rp"}
              onChange={(event) => onChange("rp_id", event.target.value)}
            />
          </label>
          <label>
            <span>Precio automático</span>
            <input value={activePhasePrice !== null ? `$${activePhasePrice.toFixed(2)}` : "-"} disabled />
          </label>
          <label>
            <span>Comision RP (10%)</span>
            <input value={rpCommission !== null ? `$${rpCommission.toFixed(2)}` : "-"} disabled />
          </label>
        </div>

        <div className="action-row">
          <button
            type="button"
            className="primary-button"
            disabled={saving || !events.length || !selectedEventId || !activePhase}
            onClick={onSell}
          >
            {saving ? "Procesando..." : "Vender boleto"}
          </button>
        </div>

        <div className="inline-search">
          <input
            placeholder="Buscar ticket por codigo"
            value={lookupCode}
            onChange={(event) => setLookupCode(event.target.value)}
          />
          <button type="button" className="ghost-button" disabled={loading} onClick={onLookup}>
            Consultar
          </button>
          <button
            type="button"
            className="ghost-button"
            disabled={!ticket || ticket.estado === "USADO" || saving}
            onClick={onMarkAsUsed}
          >
            Marcar usado
          </button>
        </div>

        {error ? <p className="inline-error">{error}</p> : null}

        {ticket ? (
          <div className="highlight-card">
            <strong>{ticket.codigo}</strong>
            <span>
              Estado {ticket.estado} • {ticket.cliente_nombre ?? `Cliente #${ticket.cliente_id}`} • Evento #{ticket.evento_id}
            </span>
            {ticket.cliente_telefono ? <span>Tel: {ticket.cliente_telefono}</span> : null}
            {ticket.codigo_evento ? <span>Código evento: {ticket.codigo_evento}</span> : null}
          </div>
        ) : null}
      </div>

      <div>
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Monitoring</span>
            <h2>{mode === "admin" ? "Boletos del evento" : "Tus ventas"}</h2>
          </div>
          <span className="status-chip">{mode === "admin" ? eventTickets.length : rpTickets.length} registros</span>
        </div>

        <div className="collection-list compact-list">
          {(mode === "admin" ? eventTickets : rpTickets).map(renderTicketCard)}
        </div>

        {mode === "admin" ? (
          <>
            <div className="panel-heading" style={{ marginTop: "1rem" }}>
              <div>
                <span className="eyebrow">No show</span>
                <h2>Clientes que no han escaneado</h2>
              </div>
              <span className="status-chip">{noShowTickets.length}</span>
            </div>
            <div className="collection-list compact-list">
              {noShowTickets.map(renderTicketCard)}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}