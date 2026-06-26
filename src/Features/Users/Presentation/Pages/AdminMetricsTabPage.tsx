import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDateOnly, formatDateTime, formatTimeOnly } from "../../../../Core/Utils/date";
import MetricsPanel from "../../../Metrics/Presentation/Components/MetricsPanel";
import { useMetricsViewModel } from "../../../Metrics/Presentation/ViewModels/useMetricsViewModel";
import FormModal from "../../../Shared/Presentation/Components/FormModal";
import type { TicketDTO } from "../../../Tickets/Data/Models/Ticket";
import { ticketsUseCase } from "../../../Tickets/Domain/TicketsUseCase";
import { useAdminLayoutContext } from "./AdminLayoutPage";

export default function AdminMetricsTabPage() {
  const navigate = useNavigate();
  const { eventsVm } = useAdminLayoutContext();
  const metricsVm = useMetricsViewModel(eventsVm.selectedEventId);
  const rankingMetrics = eventsVm.selectedEventId ? metricsVm.eventRpMetrics : metricsVm.rpMetrics;
  const selectedEvent = eventsVm.events.find((event) => event.id === eventsVm.selectedEventId);
  const [isTicketsModalOpen, setIsTicketsModalOpen] = useState(false);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState("");
  const [soldTickets, setSoldTickets] = useState<TicketDTO[]>([]);
  const [detailTicket, setDetailTicket] = useState<TicketDTO | null>(null);
  const [ticketSearch, setTicketSearch] = useState("");

  const filteredTickets = useMemo(() => {
    const search = ticketSearch.trim().toLowerCase();
    if (!search) {
      return soldTickets;
    }

    return soldTickets.filter((ticket) => {
      const code = String(ticket.codigo ?? "").toLowerCase();
      const clientName = String(ticket.cliente_nombre ?? "").toLowerCase();
      const rpName = String(ticket.rp_nombre ?? "").toLowerCase();
      const clientPhone = String(ticket.cliente_telefono ?? "").toLowerCase();

      return code.includes(search) || clientName.includes(search) || rpName.includes(search) || clientPhone.includes(search);
    });
  }, [soldTickets, ticketSearch]);

  useEffect(() => {
    if (!detailTicket) {
      return;
    }

    const stillExists = filteredTickets.some((ticket) => ticket.id === detailTicket.id);
    if (!stillExists) {
      setDetailTicket(null);
    }
  }, [filteredTickets, detailTicket]);

  const openSoldTicketsModal = async () => {
    if (!selectedEvent) {
      return;
    }

    setIsTicketsModalOpen(true);
    setTicketsLoading(true);
    setTicketsError("");
    setTicketSearch("");

    try {
      const tickets = await ticketsUseCase.getTicketsByEventId(selectedEvent.id);
      setSoldTickets(tickets);
      setDetailTicket(null);
    } catch (error) {
      setTicketsError(error instanceof Error ? error.message : "No fue posible cargar los boletos del evento.");
      setSoldTickets([]);
      setDetailTicket(null);
    } finally {
      setTicketsLoading(false);
    }
  };

  return (
    <>
      <MetricsPanel
        summary={metricsVm.summary}
        rpMetrics={rankingMetrics}
        eventMetrics={metricsVm.eventMetrics}
        phaseMetrics={metricsVm.phaseMetrics}
        loading={metricsVm.loading}
        error={metricsVm.error}
        onOpenSoldTickets={selectedEvent ? () => void openSoldTicketsModal() : undefined}
        onSelectRp={(rpId) => {
          if (selectedEvent) {
            navigate(`/dashboard/rp/${rpId}?eventId=${selectedEvent.id}&eventName=${encodeURIComponent(selectedEvent.nombre)}`);
            return;
          }
          navigate(`/dashboard/rp/${rpId}`);
        }}
      />

      {isTicketsModalOpen ? (
        <FormModal
          title={selectedEvent ? `Boletos vendidos · ${selectedEvent.nombre}` : "Boletos vendidos"}
          subtitle="Lista de boletos"
          onClose={() => {
            setIsTicketsModalOpen(false);
            setDetailTicket(null);
          }}
        >
          {ticketsLoading ? <p className="muted-copy">Cargando boletos...</p> : null}
          {ticketsError ? <p className="inline-error">{ticketsError}</p> : null}

          {!ticketsLoading && !ticketsError ? (
            <div className="tickets-list-only">
              <div className="inline-search tickets-search-row">
                <input
                  placeholder="Buscar por código, cliente, RP o teléfono"
                  value={ticketSearch}
                  onChange={(event) => setTicketSearch(event.target.value)}
                />
              </div>
              <span className="status-chip">{filteredTickets.length} de {soldTickets.length} boletos</span>
              <div className="collection-list compact-list metrics-ticket-list">
                {filteredTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    type="button"
                    className={`selector-card ticket-list-item ${detailTicket?.id === ticket.id ? "selector-card-active" : ""}`}
                    onClick={() => setDetailTicket(ticket)}
                  >
                    <div>
                      <strong>{ticket.codigo}</strong>
                      <span>{ticket.cliente_nombre ?? `Cliente #${ticket.cliente_id}`}</span>
                      <span>{ticket.rp_nombre ?? `RP #${ticket.rp_id}`}</span>
                    </div>
                    <span className="pill pill-success">${Number(ticket.precio).toFixed(2)}</span>
                  </button>
                ))}
                {soldTickets.length === 0 ? <p className="muted-copy">No hay boletos vendidos para este evento.</p> : null}
                {soldTickets.length > 0 && filteredTickets.length === 0 ? (
                  <p className="muted-copy">No hay resultados para esa búsqueda.</p>
                ) : null}
              </div>
            </div>
          ) : null}
        </FormModal>
      ) : null}

      {isTicketsModalOpen && detailTicket ? (
        <FormModal
          title={`Boleto ${detailTicket.codigo}`}
          subtitle="Información del boleto"
          onClose={() => setDetailTicket(null)}
        >
          <div className="ticket-detail-pane">
            <div className="highlight-card">
              <strong>{detailTicket.codigo}</strong>
              <span>{detailTicket.cliente_nombre ?? `Cliente #${detailTicket.cliente_id}`}</span>
              <small>{detailTicket.cliente_telefono ?? "Sin teléfono"}</small>
            </div>

            <div className="detail-grid ticket-detail-grid">
              <article className="detail-card">
                <small>RP</small>
                <p>{detailTicket.rp_nombre ?? `RP #${detailTicket.rp_id}`}</p>
              </article>
              <article className="detail-card">
                <small>Fecha</small>
                <p>{detailTicket.fecha_venta ? formatDateOnly(detailTicket.fecha_venta) : "-"}</p>
              </article>
              <article className="detail-card">
                <small>Hora</small>
                <p>{detailTicket.fecha_venta ? formatTimeOnly(detailTicket.fecha_venta) : "-"}</p>
              </article>
              <article className="detail-card">
                <small>Precio</small>
                <p>${Number(detailTicket.precio).toFixed(2)}</p>
              </article>
              <article className="detail-card">
                <small>Comisión RP</small>
                <p>${Number(detailTicket.comision_rp ?? 0).toFixed(2)}</p>
              </article>
              <article className="detail-card">
                <small>Tipo de boleto</small>
                <p>{detailTicket.tipo_boleto ?? "GENERAL"}</p>
              </article>
              <article className="detail-card">
                <small>Evento</small>
                <p>{detailTicket.evento_nombre ?? `#${detailTicket.evento_id}`}</p>
              </article>
              <article className="detail-card">
                <small>Código evento</small>
                <p>{detailTicket.codigo_evento ?? "-"}</p>
              </article>
              <article className="detail-card">
                <small>Fase</small>
                <p>{detailTicket.fase_nombre ?? `#${detailTicket.fase_id}`}</p>
              </article>
              <article className="detail-card">
                <small>Estado</small>
                <p>{detailTicket.estado}</p>
              </article>
              <article className="detail-card">
                <small>Fecha de uso</small>
                <p>{detailTicket.fecha_uso ? formatDateTime(detailTicket.fecha_uso) : "-"}</p>
              </article>
            </div>
          </div>
        </FormModal>
      ) : null}
    </>
  );
}
