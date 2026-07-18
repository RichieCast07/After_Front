import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "../../../../Core/Utils/currency";
import { formatDateTime } from "../../../../Core/Utils/date";
import type { TicketDTO } from "../../../Tickets/Data/Models/Ticket";
import { ticketsUseCase } from "../../../Tickets/Domain/TicketsUseCase";
import TicketQrModal from "../../../Tickets/Presentation/Components/TicketQrModal";
import { useAdminLayoutContext } from "./AdminLayoutPage";

type TicketFilter = "activos" | "usados";

export default function AdminTicketsTabPage() {
  const { eventsVm } = useAdminLayoutContext();
  const selectedEventId = eventsVm.selectedEventId;

  const [tickets, setTickets] = useState<TicketDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<TicketFilter>("activos");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [selectedTicketForQr, setSelectedTicketForQr] = useState<TicketDTO | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!selectedEventId) {
        setTickets([]);
        return;
      }

      setLoading(true);
      try {
        const data = await ticketsUseCase.getTicketsByEventId(selectedEventId);
        setTickets(data);
        setError("");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "No fue posible cargar los boletos.");
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [selectedEventId]);

  const activeTickets = useMemo(() => tickets.filter((ticket) => ticket.estado === "ACTIVO"), [tickets]);
  const usedTickets = useMemo(() => tickets.filter((ticket) => ticket.estado === "USADO"), [tickets]);
  const attendance = tickets.length > 0 ? Math.round((usedTickets.length / tickets.length) * 100) : 0;

  const currentList = filter === "activos" ? activeTickets : usedTickets;

  const filteredList = useMemo(() => {
    const cleanFilter = phoneFilter.replace(/\D/g, "");
    if (!cleanFilter) {
      return currentList;
    }

    return currentList.filter((ticket) => {
      const ticketPhone = String(ticket.cliente_telefono ?? "").replace(/\D/g, "");
      return ticketPhone.includes(cleanFilter);
    });
  }, [currentList, phoneFilter]);

  const selectedEvent = eventsVm.events.find((event) => event.id === selectedEventId);

  return (
    <>
      {selectedTicketForQr ? (
        <TicketQrModal
          ticket={selectedTicketForQr}
          eventName={selectedEvent?.nombre}
          eventLocation={selectedEvent?.lugar ?? undefined}
          onClose={() => setSelectedTicketForQr(null)}
        />
      ) : null}

      <section className="glass-panel panel-grid">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Boletos</span>
            <h2>Control de boletos</h2>
          </div>
          <span className="status-chip">{tickets.length} boletos</span>
        </div>

        <div className="select-frame">
          <label htmlFor="tickets-event-scope">Evento</label>
          <select
            id="tickets-event-scope"
            value={selectedEventId ?? ""}
            onChange={(event) => eventsVm.setSelectedEventId(Number(event.target.value))}
            disabled={!eventsVm.events.length}
          >
            <option value="" disabled>
              Selecciona un evento
            </option>
            {eventsVm.events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.nombre}
              </option>
            ))}
          </select>
        </div>

        {!selectedEventId ? (
          <p className="muted-copy">Selecciona un evento para ver sus boletos.</p>
        ) : null}
        {loading ? <p className="muted-copy">Cargando boletos...</p> : null}
        {error ? <p className="inline-error">{error}</p> : null}

        {selectedEventId ? (
          <>
            <div className="stats-grid">
              <article className="stat-card">
                <span>Activos (sin escanear)</span>
                <strong>{activeTickets.length}</strong>
              </article>
              <article className="stat-card">
                <span>Usados (escaneados)</span>
                <strong>{usedTickets.length}</strong>
              </article>
              <article className="stat-card">
                <span>Asistencia</span>
                <strong>{attendance}%</strong>
              </article>
            </div>

            <div className="tab-nav">
              <button
                type="button"
                className={`tab-btn ${filter === "activos" ? "tab-btn-active" : ""}`}
                onClick={() => setFilter("activos")}
              >
                <span className="tab-icon">🎟️</span>
                <span className="tab-label">Activos ({activeTickets.length})</span>
              </button>
              <button
                type="button"
                className={`tab-btn ${filter === "usados" ? "tab-btn-active" : ""}`}
                onClick={() => setFilter("usados")}
              >
                <span className="tab-icon">✅</span>
                <span className="tab-label">Usados ({usedTickets.length})</span>
              </button>
            </div>

            <div className="inline-search rp-sales-search">
              <input
                placeholder="Buscar boleto por teléfono"
                value={phoneFilter}
                onChange={(event) => setPhoneFilter(event.target.value)}
                inputMode="numeric"
                aria-label="Buscar boleto por teléfono"
              />
            </div>

            <div className="collection-list compact-list rp-sales-list">
              {filteredList.map((ticket) => (
                <article
                  key={ticket.id}
                  className="collection-card compact-ticket-card rp-compact-card rp-ticket-clickable"
                  onClick={() => setSelectedTicketForQr(ticket)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedTicketForQr(ticket);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Ver QR del boleto ${ticket.codigo}`}
                >
                  <div className="rp-compact-main">
                    <h3>{ticket.cliente_nombre ?? `Cliente #${ticket.cliente_id}`}</h3>
                    <p>{ticket.cliente_telefono ?? "Sin teléfono"}</p>
                    <small>{ticket.codigo} • {ticket.tipo_boleto ?? "GENERAL"}</small>
                    <small>{ticket.rp_nombre ?? `RP #${ticket.rp_id}`} • {ticket.fase_nombre ?? `Fase #${ticket.fase_id}`}</small>
                    <small>{ticket.fecha_venta ? formatDateTime(ticket.fecha_venta) : "Sin fecha"}</small>
                  </div>
                  <div className="collection-actions">
                    <span
                      className={`pill pill-status is-active ${ticket.estado === "USADO" ? "pill-success" : "pill-warning"}`}
                    >
                      {ticket.estado === "USADO" ? "Usado" : "Activo"}
                    </span>
                    <span className="pill pill-success">{formatCurrency(ticket.precio)}</span>
                  </div>
                </article>
              ))}
              {!loading && filteredList.length === 0 ? (
                <p className="muted-copy">
                  {currentList.length === 0
                    ? `No hay boletos ${filter === "activos" ? "activos" : "usados"} para este evento.`
                    : "No se encontraron boletos para ese teléfono."}
                </p>
              ) : null}
            </div>
          </>
        ) : null}
      </section>
    </>
  );
}
