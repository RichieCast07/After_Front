import { useContext, useEffect, useMemo, useState } from "react";
import UserContext from "../../../../Core/Context/UserContext";
import { formatCurrency } from "../../../../Core/Utils/currency";
import { formatDateTime } from "../../../../Core/Utils/date";
import { clientsUseCase } from "../../../Clients/Domain/ClientsUseCase";
import type { EventTicketTypeDTO } from "../../../Events/Data/Models/TicketType";
import { eventsUseCase } from "../../../Events/Domain/EventsUseCase";
import EventsPanel from "../../../Events/Presentation/Components/EventsPanel";
import { useEventsViewModel } from "../../../Events/Presentation/ViewModels/useEventsViewModel";
import { metricsUseCase } from "../../../Metrics/Domain/MetricsUseCase";
import { usePhasesViewModel } from "../../../Phases/Presentation/ViewModels/usePhasesViewModel";
import DashboardShell from "../../../Shared/Presentation/Components/DashboardShell";
import type { TicketDTO } from "../../../Tickets/Data/Models/Ticket";
import TicketQrModal from "../../../Tickets/Presentation/Components/TicketQrModal";
import { useTicketsViewModel } from "../../../Tickets/Presentation/ViewModels/useTicketsViewModel";

// La app trata fecha_evento como hora de pared (se muestra en UTC), así que
// el día del evento es la parte UTC del valor; se compara contra hoy en México.
function isEventUpcoming(fechaEvento?: string): boolean {
  if (!fechaEvento) return true;
  const eventDay = new Date(fechaEvento).toISOString().slice(0, 10);
  const mxToday = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(new Date());
  return eventDay >= mxToday;
}

export default function RPDashboard() {
  const session = useContext(UserContext);
  const eventsVm = useEventsViewModel();
  const phasesVm = usePhasesViewModel(eventsVm.selectedEventId);
  const ticketsVm = useTicketsViewModel({
    eventId: eventsVm.selectedEventId,
    defaultRpId: session?.user?.user_id ?? 0,
  });
  const [activeTab, setActiveTab] = useState("eventos");
  const [clientLookupMessage, setClientLookupMessage] = useState("");
  const [selectedTicketForQr, setSelectedTicketForQr] = useState<TicketDTO | null>(null);
  const [salesPhoneFilter, setSalesPhoneFilter] = useState("");
  const [salesEventFilter, setSalesEventFilter] = useState(0);
  const [eventTicketTypes, setEventTicketTypes] = useState<EventTicketTypeDTO[]>([]);

  // Eventos vigentes: refuerzo del filtro que ya aplica el backend para el RP.
  const upcomingEvents = useMemo(
    () => eventsVm.events.filter((event) => isEventUpcoming(event.fecha_evento)),
    [eventsVm.events]
  );

  const selectedEvent = eventsVm.events.find((event) => event.id === eventsVm.selectedEventId);
  const canGenerateTicket = Boolean(
    selectedEvent && (phasesVm.phases.length > 0 || Number(selectedEvent.precio_inicial ?? 0) > 0)
  );

  // ===== Ventas (historial completo del RP, con filtro por evento) =====
  const salesEvents = useMemo(() => {
    const map = new Map<number, string>();
    for (const ticket of ticketsVm.rpTickets) {
      if (!map.has(ticket.evento_id)) {
        map.set(ticket.evento_id, ticket.evento_nombre ?? `Evento #${ticket.evento_id}`);
      }
    }
    return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [ticketsVm.rpTickets]);

  const salesByEvent = useMemo(
    () =>
      salesEventFilter === 0
        ? ticketsVm.rpTickets
        : ticketsVm.rpTickets.filter((ticket) => ticket.evento_id === salesEventFilter),
    [ticketsVm.rpTickets, salesEventFilter]
  );

  const salesSummary = useMemo(() => {
    const boletos = salesByEvent.length;
    const ingresos = salesByEvent.reduce((acc, ticket) => acc + Number(ticket.precio || 0), 0);
    const comision = salesByEvent.reduce((acc, ticket) => acc + Number(ticket.comision_rp || 0), 0);
    return { boletos, ingresos, comision };
  }, [salesByEvent]);

  const salesPhaseStats = useMemo(() => {
    const map = new Map<string, { boletos: number; ingresos: number }>();
    for (const ticket of salesByEvent) {
      const key = ticket.fase_nombre ?? `Fase #${ticket.fase_id}`;
      const current = map.get(key) ?? { boletos: 0, ingresos: 0 };
      map.set(key, { boletos: current.boletos + 1, ingresos: current.ingresos + Number(ticket.precio || 0) });
    }
    return Array.from(map.entries()).map(([nombre, stats]) => ({ nombre, ...stats }));
  }, [salesByEvent]);

  const filteredSales = useMemo(() => {
    const cleanFilter = salesPhoneFilter.replace(/\D/g, "");
    if (!cleanFilter) {
      return salesByEvent;
    }

    return salesByEvent.filter((ticket) => {
      const ticketPhone = String(ticket.cliente_telefono ?? "").replace(/\D/g, "");
      return ticketPhone.includes(cleanFilter);
    });
  }, [salesByEvent, salesPhoneFilter]);

  const tabs = [
    { id: "eventos", label: "Eventos", icon: "🎪" },
    { id: "ventas", label: "Ventas", icon: "🧾" },
    { id: "generar", label: "Generar boletos", icon: "🎟️" },
  ];

  const lookupClientByPhone = async () => {
    const phone = ticketsVm.form.cliente_telefono.replace(/\D/g, "");
    if (phone.length !== 10) {
      setClientLookupMessage("Ingresa un teléfono de 10 dígitos.");
      return;
    }

    try {
      const client = await clientsUseCase.searchByPhone(phone);
      ticketsVm.handleChange("cliente_nombre", client.nombre_completo);
      setClientLookupMessage("Cliente encontrado. Nombre autocompletado.");
    } catch {
      setClientLookupMessage("Cliente nuevo. Completa el nombre para registrarlo.");
    }
  };

  useEffect(() => {
    if (eventsVm.selectedEventId && activeTab === "eventos") {
      setActiveTab("generar");
    }
  }, [eventsVm.selectedEventId]);

  useEffect(() => {
    if (!eventsVm.selectedEventId) return;
    void metricsUseCase.syncPrices(eventsVm.selectedEventId)
      .then(() => ticketsVm.reloadRpTickets())
      .catch(() => {});
  }, [eventsVm.selectedEventId]);

  useEffect(() => {
    const loadEventTicketTypes = async () => {
      if (!eventsVm.selectedEventId) {
        setEventTicketTypes([]);
        return;
      }

      try {
        const types = await eventsUseCase.getTicketTypes(eventsVm.selectedEventId);
        const activeTypes = types.filter((type) => type.activo);
        setEventTicketTypes(activeTypes);

        if (activeTypes.length > 0) {
          const selectedTypeExists = activeTypes.some((type) => type.nombre === ticketsVm.form.tipo_boleto);
          if (!selectedTypeExists) {
            ticketsVm.handleChange("tipo_boleto", activeTypes[0]!.nombre);
          }
        }
      } catch {
        setEventTicketTypes([]);
      }
    };

    void loadEventTicketTypes();
  }, [eventsVm.selectedEventId]);

  const previewTicket = ticketsVm.generatedTicket ?? selectedTicketForQr;

  const closeTicketModal = () => {
    ticketsVm.closeGeneratedTicket();
    setSelectedTicketForQr(null);
  };

  return (
    <DashboardShell
      title="Cabina RP"
      username={session?.user?.username ?? "rp"}
      badge="Relación pública"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={() => session?.logout()}
    >
      {previewTicket ? (
        <TicketQrModal
          ticket={previewTicket}
          eventName={selectedEvent?.nombre}
          eventLocation={selectedEvent?.lugar ?? undefined}
          onClose={closeTicketModal}
        />
      ) : null}

      {activeTab === "eventos" && (
        <EventsPanel
          events={upcomingEvents}
          selectedEventId={eventsVm.selectedEventId}
          setSelectedEventId={eventsVm.setSelectedEventId}
          loading={eventsVm.loading}
          saving={eventsVm.saving}
          error={eventsVm.error}
          readOnly
          onEdit={eventsVm.handleEdit}
          onToggle={(id) => void eventsVm.toggleStatus(id)}
        />
      )}

      {activeTab === "ventas" && (
        <section className="glass-panel panel-grid">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Tus ventas</span>
              <h2>Historial de ventas</h2>
            </div>
            <span className="status-chip">{salesSummary.boletos} boletos</span>
          </div>

          <div className="select-frame">
            <label htmlFor="rp-sales-event">Filtrar por evento</label>
            <select
              id="rp-sales-event"
              value={salesEventFilter}
              onChange={(event) => setSalesEventFilter(Number(event.target.value))}
            >
              <option value={0}>Todos los eventos</option>
              {salesEvents.map((salesEvent) => (
                <option key={salesEvent.id} value={salesEvent.id}>
                  {salesEvent.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="stats-grid rp-summary-grid">
            <article className="stat-card rp-summary-card">
              <span title="Boletos vendidos por ti">Boletos</span>
              <strong>{salesSummary.boletos}</strong>
            </article>
            <article className="stat-card rp-summary-card">
              <span title="Ingresos generados">Ingresos</span>
              <strong>{formatCurrency(salesSummary.ingresos)}</strong>
            </article>
            <article className="stat-card rp-summary-card">
              <span title="Comisión estimada">Comisión</span>
              <strong>{formatCurrency(salesSummary.comision)}</strong>
            </article>
          </div>

          {salesEventFilter !== 0 && salesPhaseStats.length > 0 ? (
            <div className="phase-breakdown">
              <h3>Tus boletos por fase</h3>
              <div className="collection-list compact-list">
                {salesPhaseStats.map((phase) => (
                  <article key={phase.nombre} className="collection-card compact-ticket-card rp-compact-card">
                    <div className="rp-compact-main">
                      <h3>{phase.nombre}</h3>
                    </div>
                    <div className="collection-actions metrics-compact-actions">
                      <span className="pill">{phase.boletos} boletos</span>
                      <span className="pill pill-success">{formatCurrency(phase.ingresos)}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          <div className="inline-search rp-sales-search">
            <input
              placeholder="Buscar por teléfono"
              value={salesPhoneFilter}
              onChange={(event) => setSalesPhoneFilter(event.target.value)}
              inputMode="numeric"
              aria-label="Buscar boleto vendido por teléfono"
            />
          </div>

          <div className="collection-list compact-list rp-sales-list">
            {filteredSales.map((ticket) => (
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
                  <small>{ticket.codigo}</small>
                  <small>{ticket.evento_nombre ?? `Evento #${ticket.evento_id}`} • {ticket.fase_nombre ?? `Fase #${ticket.fase_id}`}</small>
                  <small>{ticket.fecha_venta ? formatDateTime(ticket.fecha_venta) : "Sin fecha"}</small>
                </div>
                <span className="pill pill-success">{formatCurrency(ticket.precio)}</span>
              </article>
            ))}
            {filteredSales.length === 0 ? (
              <p className="muted-copy">
                {ticketsVm.rpTickets.length === 0 ? "Aún no tienes ventas registradas." : "No se encontraron boletos para ese filtro."}
              </p>
            ) : null}
          </div>
        </section>
      )}

      {activeTab === "generar" && (
        <section className="glass-panel panel-grid">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Generar boletos</span>
              <h2>{selectedEvent?.nombre ?? "Selecciona un evento"}</h2>
            </div>
          </div>

          <div className="field-grid">
            <label>
              <span>Teléfono del cliente</span>
              <input
                value={ticketsVm.form.cliente_telefono}
                onChange={(event) => ticketsVm.handleChange("cliente_telefono", event.target.value)}
                onBlur={() => void lookupClientByPhone()}
              />
            </label>
            <label>
              <span>Nombre del cliente</span>
              <input
                value={ticketsVm.form.cliente_nombre}
                onChange={(event) => ticketsVm.handleChange("cliente_nombre", event.target.value)}
              />
            </label>
            <label>
              <span>Tipo de boleto</span>
              <select
                value={ticketsVm.form.tipo_boleto}
                onChange={(event) => ticketsVm.handleChange("tipo_boleto", event.target.value)}
              >
                {eventTicketTypes.map((ticketType) => (
                  <option key={ticketType.id} value={ticketType.nombre}>
                    {ticketType.nombre}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="action-row">
            <button type="button" className="ghost-button" onClick={() => void lookupClientByPhone()}>
              Buscar cliente por teléfono
            </button>
            <button
              type="button"
              className="primary-button"
              disabled={!selectedEvent || ticketsVm.saving || !canGenerateTicket}
              onClick={() => void ticketsVm.sellTicket()}
            >
              {ticketsVm.saving ? "Generando..." : "Generar boleto"}
            </button>
          </div>

          {clientLookupMessage ? <p className="muted-copy">{clientLookupMessage}</p> : null}
          {!canGenerateTicket ? (
            <p className="inline-error">
              El evento no tiene fases ni precio inicial configurado. Pide al admin definir al menos una fase o precio inicial.
            </p>
          ) : null}
          {ticketsVm.error ? <p className="inline-error">{ticketsVm.error}</p> : null}

          {ticketsVm.ticket ? (
            <div className="highlight-card">
              <strong>Boleto generado: {ticketsVm.ticket.codigo}</strong>
              <span>
                {ticketsVm.ticket.cliente_nombre ?? ticketsVm.form.cliente_nombre} • {formatCurrency(ticketsVm.ticket.precio)} • {ticketsVm.ticket.tipo_boleto ?? "GENERAL"}
              </span>
            </div>
          ) : null}
        </section>
      )}
    </DashboardShell>
  );
}
