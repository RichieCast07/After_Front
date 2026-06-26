import { useEffect, useState } from "react";
import { formatDateTime } from "../../../../Core/Utils/date";
import type { TicketDTO } from "../../../Tickets/Data/Models/Ticket";
import { ticketsUseCase } from "../../../Tickets/Domain/TicketsUseCase";
import TicketQrModal from "../../../Tickets/Presentation/Components/TicketQrModal";

export default function AdminNoShowTabPage() {
  const [expiredActiveTickets, setExpiredActiveTickets] = useState<TicketDTO[]>([]);
  const [loadingNoShow, setLoadingNoShow] = useState(false);
  const [noShowError, setNoShowError] = useState("");
  const [noShowPhoneFilter, setNoShowPhoneFilter] = useState("");
  const [selectedTicketForQr, setSelectedTicketForQr] = useState<TicketDTO | null>(null);

  const loadExpiredActive = async () => {
    setLoadingNoShow(true);
    try {
      const tickets = await ticketsUseCase.getExpiredActiveTickets();
      setExpiredActiveTickets(tickets);
      setNoShowError("");
    } catch (error) {
      setNoShowError(error instanceof Error ? error.message : "No fue posible cargar los no-show.");
    } finally {
      setLoadingNoShow(false);
    }
  };

  useEffect(() => {
    void loadExpiredActive();
  }, []);

  const filteredExpiredActiveTickets = expiredActiveTickets.filter((ticket) => {
    const cleanFilter = noShowPhoneFilter.replace(/\D/g, "");
    if (!cleanFilter) {
      return true;
    }

    const ticketPhone = String(ticket.cliente_telefono ?? "").replace(/\D/g, "");
    return ticketPhone.includes(cleanFilter);
  });

  return (
    <>
      {selectedTicketForQr ? (
        <TicketQrModal ticket={selectedTicketForQr} onClose={() => setSelectedTicketForQr(null)} />
      ) : null}

      <section className="glass-panel panel-grid">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Control</span>
            <h2>Boletos activos de eventos ya finalizados</h2>
          </div>
          <span className="status-chip">{expiredActiveTickets.length} pendientes</span>
        </div>

        {loadingNoShow ? <p className="muted-copy">Cargando pendientes...</p> : null}
        {noShowError ? <p className="inline-error">{noShowError}</p> : null}

        <div className="inline-search rp-sales-search">
          <input
            placeholder="Buscar boleto por teléfono"
            value={noShowPhoneFilter}
            onChange={(event) => setNoShowPhoneFilter(event.target.value)}
            inputMode="numeric"
            aria-label="Buscar boleto no-show por teléfono"
          />
        </div>

        <div className="collection-list compact-list rp-sales-list">
          {filteredExpiredActiveTickets.map((ticket) => (
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
                <small>{ticket.codigo} • {ticket.evento_nombre ?? `Evento #${ticket.evento_id}`}</small>
                <small>{ticket.rp_nombre ?? `RP #${ticket.rp_id}`} • {ticket.tipo_boleto ?? "GENERAL"}</small>
                <small>{ticket.fecha_venta ? formatDateTime(ticket.fecha_venta) : "Sin fecha"}</small>
              </div>
              <div className="collection-actions">
                <span className="pill pill-muted">No asistió</span>
                <span className="pill pill-success">${Number(ticket.precio).toFixed(2)}</span>
              </div>
            </article>
          ))}
          {filteredExpiredActiveTickets.length === 0 ? (
            <p className="muted-copy">No se encontraron boletos para ese teléfono.</p>
          ) : null}
        </div>
      </section>
    </>
  );
}
