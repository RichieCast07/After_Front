import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import UserContext from "../../../../Core/Context/UserContext";
import { formatDateTime } from "../../../../Core/Utils/date";
import DashboardShell from "../../../Shared/Presentation/Components/DashboardShell";
import type { TicketDTO } from "../../../Tickets/Data/Models/Ticket";
import { ticketsUseCase } from "../../../Tickets/Domain/TicketsUseCase";
import TicketQrModal from "../../../Tickets/Presentation/Components/TicketQrModal";
import { UserRepository } from "../../Data/Repository/UserRepository";

const userRepository = new UserRepository();

export default function AdminRpDetailPage() {
  const { rpId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const session = useContext(UserContext);

  const parsedRpId = Number(rpId);
  const selectedEventParam = searchParams.get("eventId");
  const parsedEventId = selectedEventParam ? Number(selectedEventParam) : null;
  const selectedEventId = parsedEventId && !Number.isNaN(parsedEventId) ? parsedEventId : null;
  const selectedEventName = searchParams.get("eventName");
  const [tickets, setTickets] = useState<TicketDTO[]>([]);
  const [rpName, setRpName] = useState("RP");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [selectedTicketForQr, setSelectedTicketForQr] = useState<TicketDTO | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!parsedRpId || Number.isNaN(parsedRpId)) {
        setError("RP inválido");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [rpTickets, usersResponse] = await Promise.all([
          ticketsUseCase.getTicketsByRpId(parsedRpId),
          userRepository.getUsers(),
        ]);

        const rpUser = usersResponse.data.find((user) => user.id === parsedRpId);
        setRpName(rpUser?.nombre_completo ?? rpUser?.username ?? `RP #${parsedRpId}`);
        setTickets(rpTickets);
        setError("");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "No fue posible cargar el detalle del RP.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [parsedRpId]);

  const ticketsByEvent = useMemo(() => {
    if (!selectedEventId) {
      return tickets;
    }

    return tickets.filter((ticket) => ticket.evento_id === selectedEventId);
  }, [tickets, selectedEventId]);

  const totals = useMemo(() => {
    const boletos = ticketsByEvent.length;
    const ingresos = ticketsByEvent.reduce((acc, ticket) => acc + Number(ticket.precio || 0), 0);
    const comision = ticketsByEvent.reduce((acc, ticket) => acc + Number(ticket.comision_rp || 0), 0);
    return { boletos, ingresos, comision };
  }, [ticketsByEvent]);

  const phaseStats = useMemo(() => {
    const map = new Map<string, { boletos: number; ingresos: number }>();
    for (const ticket of ticketsByEvent) {
      const key = ticket.fase_nombre ?? `Fase #${ticket.fase_id}`;
      const current = map.get(key) ?? { boletos: 0, ingresos: 0 };
      map.set(key, { boletos: current.boletos + 1, ingresos: current.ingresos + Number(ticket.precio || 0) });
    }
    return Array.from(map.entries()).map(([nombre, stats]) => ({ nombre, ...stats }));
  }, [ticketsByEvent]);

  const filteredTickets = useMemo(() => {
    const cleanFilter = phoneFilter.replace(/\D/g, "");

    if (!cleanFilter) {
      return ticketsByEvent;
    }

    return ticketsByEvent.filter((ticket) => {
      const ticketPhone = String(ticket.cliente_telefono ?? "").replace(/\D/g, "");
      return ticketPhone.includes(cleanFilter);
    });
  }, [ticketsByEvent, phoneFilter]);

  return (
    <DashboardShell
      title="Detalle de RP"
      username={session?.user?.username ?? "admin"}
      badge="Administrador"
      tabs={[{ id: "rp", label: "RP", icon: "🧾" }]}
      activeTab="rp"
      onTabChange={() => undefined}
      onLogout={() => session?.logout()}
    >
      {selectedTicketForQr ? (
        <TicketQrModal
          ticket={selectedTicketForQr}
          onClose={() => setSelectedTicketForQr(null)}
        />
      ) : null}

      <section className="glass-panel panel-grid">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Perfil RP</span>
            <h2>{rpName}</h2>
            {selectedEventId ? <p className="muted-copy">Evento: {selectedEventName ?? `#${selectedEventId}`}</p> : null}
          </div>
          <button type="button" className="ghost-button" onClick={() => navigate("/dashboard/metricas")}>Regresar</button>
        </div>

        {loading ? <p className="muted-copy">Cargando detalle...</p> : null}
        {error ? <p className="inline-error">{error}</p> : null}

        <div className="stats-grid">
          <article className="stat-card">
            <span>Boletos vendidos</span>
            <strong>{totals.boletos}</strong>
          </article>
          <article className="stat-card">
            <span>Ingresos generados</span>
            <strong>${totals.ingresos.toFixed(2)}</strong>
          </article>
          <article className="stat-card">
            <span>Comisión total</span>
            <strong>${totals.comision.toFixed(2)}</strong>
          </article>
        </div>

        {phaseStats.length > 0 ? (
          <div className="phase-breakdown">
            <h3>Boletos por fase</h3>
            <div className="collection-list compact-list">
              {phaseStats.map((phase) => (
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

        <div className="inline-search rp-sales-search">
          <input
            placeholder="Buscar boleto por teléfono"
            value={phoneFilter}
            onChange={(event) => setPhoneFilter(event.target.value)}
            inputMode="numeric"
            aria-label="Buscar boleto vendido por teléfono"
          />
        </div>

        <div className="collection-list compact-list rp-sales-list">
          {filteredTickets.map((ticket) => (
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
                <h3>{ticket.codigo}</h3>
                <p>{ticket.cliente_nombre ?? `Cliente #${ticket.cliente_id}`}</p>
                <small>{ticket.cliente_telefono ?? "Sin teléfono"} • {ticket.evento_nombre ?? `Evento #${ticket.evento_id}`}</small>
                <small>{ticket.tipo_boleto ?? "GENERAL"} • {ticket.fase_nombre ?? `Fase #${ticket.fase_id}`}</small>
                <small>{ticket.fecha_venta ? formatDateTime(ticket.fecha_venta) : "Sin fecha"}</small>
              </div>
              <div className="collection-actions">
                <span className={`pill ${ticket.estado === "USADO" ? "pill-success" : "pill-muted"}`}>{ticket.estado}</span>
                <span className="pill pill-success">${Number(ticket.precio).toFixed(2)}</span>
              </div>
            </article>
          ))}
          {filteredTickets.length === 0 ? <p className="muted-copy">No se encontraron boletos para ese teléfono.</p> : null}
        </div>
      </section>
    </DashboardShell>
  );
}
