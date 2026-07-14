import { useContext, useEffect, useMemo, useState } from "react";
import UserContext from "../../../../Core/Context/UserContext";
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
  const [eventTicketTypes, setEventTicketTypes] = useState<EventTicketTypeDTO[]>([]);

  const selectedEvent = eventsVm.events.find((event) => event.id === eventsVm.selectedEventId);
  const canGenerateTicket = Boolean(
    selectedEvent && (phasesVm.phases.length > 0 || Number(selectedEvent.precio_inicial ?? 0) > 0)
  );
  const rpTicketsByEvent = useMemo(
    () => ticketsVm.rpTickets.filter((ticket) => ticket.evento_id === eventsVm.selectedEventId),
    [ticketsVm.rpTickets, eventsVm.selectedEventId]
  );
  const rpSummary = useMemo(() => {
    const boletos = rpTicketsByEvent.length;
    const ingresos = rpTicketsByEvent.reduce((acc, ticket) => acc + Number(ticket.precio || 0), 0);
    const comision = rpTicketsByEvent.reduce((acc, ticket) => acc + Number(ticket.comision_rp || 0), 0);
    return { boletos, ingresos, comision };
  }, [rpTicketsByEvent]);
  const rpPhaseStats = useMemo(() => {
    const map = new Map<string, { boletos: number; ingresos: number }>();
    for (const ticket of rpTicketsByEvent) {
      const key = ticket.fase_nombre ?? `Fase #${ticket.fase_id}`;
      const current = map.get(key) ?? { boletos: 0, ingresos: 0 };
      map.set(key, { boletos: current.boletos + 1, ingresos: current.ingresos + Number(ticket.precio || 0) });
    }
    return Array.from(map.entries()).map(([nombre, stats]) => ({ nombre, ...stats }));
  }, [rpTicketsByEvent]);

  const filteredRpTicketsByEvent = useMemo(() => {
    const cleanFilter = salesPhoneFilter.replace(/\D/g, "");

    if (!cleanFilter) {
      return rpTicketsByEvent;
    }

    return rpTicketsByEvent.filter((ticket) => {
      const ticketPhone = String(ticket.cliente_telefono ?? "").replace(/\D/g, "");
      return ticketPhone.includes(cleanFilter);
    });
  }, [rpTicketsByEvent, salesPhoneFilter]);

  const tabs = [
    { id: "eventos", label: "Eventos", icon: "🎪" },
    { id: "detalle", label: "Detalle evento", icon: "📋" },
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
      setActiveTab("detalle");
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
          events={eventsVm.events}
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

      {activeTab === "detalle" && (
        <section className="glass-panel panel-grid">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Evento seleccionado</span>
              <h2>{selectedEvent?.nombre ?? "Selecciona un evento"}</h2>
            </div>
            <button
              type="button"
              className="primary-button"
              disabled={!selectedEvent}
              onClick={() => setActiveTab("generar")}
            >
              Ir a generar boletos
            </button>
          </div>

          <div className="stats-grid rp-summary-grid">
            <article className="stat-card rp-summary-card">
              <span title="Boletos vendidos por ti">Boletos</span>
              <strong>{rpSummary.boletos}</strong>
            </article>
            <article className="stat-card rp-summary-card">
              <span title="Ingresos generados">Ingresos</span>
              <strong>${rpSummary.ingresos.toFixed(2)}</strong>
            </article>
            <article className="stat-card rp-summary-card">
              <span title="Comisión estimada">Comisión</span>
              <strong>${rpSummary.comision.toFixed(2)}</strong>
            </article>
          </div>

          {rpPhaseStats.length > 0 ? (
            <div className="phase-breakdown">
              <h3>Tus boletos por fase</h3>
              <div className="collection-list compact-list">
                {rpPhaseStats.map((phase) => (
                  <article key={phase.nombre} className="collection-card compact-ticket-card rp-compact-card">
                    <div className="rp-compact-main">
                      <h3>{phase.nombre}</h3>
                    </div>
                    <div className="collection-actions metrics-compact-actions">
                      <span className="pill">{phase.boletos} boletos</span>
                      <span className="pill pill-success">${phase.ingresos.toFixed(2)}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          <div className="panel-grid panel-grid-wide rp-sales-grid">
            <div className="rp-sales-column">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Tus boletos</span>
                  <h2>Ventas del evento</h2>
                </div>
              </div>
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
                {filteredRpTicketsByEvent.map((ticket) => (
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
                      <small>{ticket.tipo_boleto ?? "GENERAL"} • {ticket.fase_nombre ?? `Fase #${ticket.fase_id}`}</small>
                      <small>{ticket.fecha_venta ? formatDateTime(ticket.fecha_venta) : "Sin fecha"}</small>
                    </div>
                    <span className="pill pill-success">${Number(ticket.precio).toFixed(2)}</span>
                  </article>
                ))}
                {filteredRpTicketsByEvent.length === 0 ? (
                  <p className="muted-copy">No se encontraron boletos para ese teléfono.</p>
                ) : null}
              </div>
            </div>
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
                {ticketsVm.ticket.cliente_nombre ?? ticketsVm.form.cliente_nombre} • ${Number(ticketsVm.ticket.precio).toFixed(2)} • {ticketsVm.ticket.tipo_boleto ?? "GENERAL"}
              </span>
            </div>
          ) : null}
        </section>
      )}
    </DashboardShell>
  );
}