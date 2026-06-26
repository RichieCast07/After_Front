import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import UserContext from "../../../../Core/Context/UserContext";
import type { EventDTO } from "../../../Events/Data/Models/Event";
import type { EventTicketTypeDTO, PhaseTicketTypePriceDTO } from "../../../Events/Data/Models/TicketType";
import { eventsUseCase } from "../../../Events/Domain/EventsUseCase";
import type { PhaseDTO } from "../../../Phases/Data/Models/Phase";
import { phasesUseCase } from "../../../Phases/Domain/PhasesUseCase";
import DashboardShell from "../../../Shared/Presentation/Components/DashboardShell";

const initialPhaseForm = {
  nombre: "",
  precio: "",
  fecha_inicio: "",
  fecha_fin: "",
};

export default function AdminEventDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const session = useContext(UserContext);

  const parsedEventId = Number(eventId);

  const [event, setEvent] = useState<EventDTO | null>(null);
  const [phases, setPhases] = useState<PhaseDTO[]>([]);
  const [ticketTypes, setTicketTypes] = useState<EventTicketTypeDTO[]>([]);
  const [phasePrices, setPhasePrices] = useState<PhaseTicketTypePriceDTO[]>([]);
  const [selectedPhaseId, setSelectedPhaseId] = useState<number | null>(null);
  const [phasePriceDrafts, setPhasePriceDrafts] = useState<Record<number, string>>({});

  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeInitialPrice, setNewTypeInitialPrice] = useState("");
  const [phaseForm, setPhaseForm] = useState(initialPhaseForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const tabs = [{ id: "detalle", label: "Detalle evento", icon: "🎪" }];

  const loadEventContext = async () => {
    if (!Number.isFinite(parsedEventId) || parsedEventId <= 0) {
      setError("Evento inválido");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [eventData, phasesData, ticketTypesData] = await Promise.all([
        eventsUseCase.getEventById(parsedEventId),
        phasesUseCase.getPhases(parsedEventId),
        eventsUseCase.getTicketTypes(parsedEventId),
      ]);

      setEvent(eventData);
      setPhases(phasesData);
      setTicketTypes(ticketTypesData);
      setSelectedPhaseId((current) => {
        if (current && phasesData.some((phase) => phase.id === current)) {
          return current;
        }
        return phasesData[0]?.id ?? null;
      });
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No fue posible cargar el detalle del evento.");
    } finally {
      setLoading(false);
    }
  };

  const loadPhasePrices = async () => {
    if (!selectedPhaseId || !Number.isFinite(parsedEventId) || parsedEventId <= 0) {
      setPhasePrices([]);
      return;
    }

    try {
      const prices = await eventsUseCase.getPhaseTicketTypePrices(parsedEventId, selectedPhaseId);
      setPhasePrices(prices);
      setPhasePriceDrafts(
        Object.fromEntries(prices.map((priceRow) => [priceRow.ticket_type_id, String(Number(priceRow.precio).toFixed(2))]))
      );
      setError("");
    } catch (phaseError) {
      setError(phaseError instanceof Error ? phaseError.message : "No fue posible cargar precios por tipo.");
    }
  };

  useEffect(() => {
    void loadEventContext();
  }, [parsedEventId]);

  useEffect(() => {
    void loadPhasePrices();
  }, [selectedPhaseId, parsedEventId]);

  const selectedPhase = useMemo(
    () => phases.find((phase) => phase.id === selectedPhaseId) ?? null,
    [phases, selectedPhaseId]
  );

  const createTicketType = async () => {
    if (!newTypeName.trim()) {
      setError("Escribe el nombre del tipo de boleto.");
      return;
    }

    const initialPrice = newTypeInitialPrice !== ""
      ? Number(newTypeInitialPrice)
      : Number(selectedPhase?.precio ?? event?.precio_inicial ?? 0);

    if (!Number.isFinite(initialPrice) || initialPrice < 0) {
      setError("Precio inicial inválido para el tipo.");
      return;
    }

    setSaving(true);
    try {
      await eventsUseCase.createTicketType(parsedEventId, {
        nombre: newTypeName,
        precio_inicial: initialPrice,
      });
      setNewTypeName("");
      setNewTypeInitialPrice("");
      await Promise.all([loadEventContext(), loadPhasePrices()]);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "No fue posible crear el tipo de boleto.");
    } finally {
      setSaving(false);
    }
  };

  const updatePriceByType = async (ticketTypeId: number) => {
    if (!selectedPhaseId) {
      setError("Selecciona una fase.");
      return;
    }

    const priceDraft = Number(phasePriceDrafts[ticketTypeId]);
    if (!Number.isFinite(priceDraft) || priceDraft < 0) {
      setError("Precio inválido.");
      return;
    }

    setSaving(true);
    try {
      await eventsUseCase.updatePhaseTicketTypePrice(parsedEventId, selectedPhaseId, ticketTypeId, priceDraft);
      await loadPhasePrices();
      setError("");
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "No fue posible actualizar el precio.");
    } finally {
      setSaving(false);
    }
  };

  const createPhase = async () => {
    if (!phaseForm.nombre || !phaseForm.fecha_inicio || !phaseForm.fecha_fin || !phaseForm.precio) {
      setError("Completa todos los campos para crear la fase.");
      return;
    }

    const basePrice = Number(phaseForm.precio);
    if (!Number.isFinite(basePrice) || basePrice < 0) {
      setError("Precio base inválido para la fase.");
      return;
    }

    setSaving(true);
    try {
      const created = await phasesUseCase.createPhase(parsedEventId, {
        nombre: phaseForm.nombre,
        precio: basePrice,
        fecha_inicio: phaseForm.fecha_inicio,
        fecha_fin: phaseForm.fecha_fin,
      });

      setPhaseForm(initialPhaseForm);
      await loadEventContext();
      setSelectedPhaseId(created.id);
      setError("");
    } catch (phaseError) {
      setError(phaseError instanceof Error ? phaseError.message : "No fue posible crear la fase.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell
      title="Detalle de evento"
      username={session?.user?.username ?? "admin"}
      badge="Administrador"
      tabs={tabs}
      activeTab="detalle"
      onTabChange={() => undefined}
      onLogout={() => session?.logout()}
    >
      <section className="glass-panel panel-grid event-detail-page">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Evento</span>
            <h2>{event?.nombre ?? "Cargando..."}</h2>
            {event ? (
              <p className="muted-copy event-detail-meta">
                {event.lugar} • {new Date(event.fecha_evento).toLocaleString("es-MX")}
              </p>
            ) : null}
          </div>
          <button type="button" className="ghost-button event-detail-back" onClick={() => navigate("/dashboard")}>Regresar</button>
        </div>

        {loading ? <p className="muted-copy">Cargando detalle...</p> : null}
        {error ? <p className="inline-error">{error}</p> : null}

        <div className="stats-grid">
          <article className="stat-card">
            <span>Fases</span>
            <strong>{phases.length}</strong>
          </article>
          <article className="stat-card">
            <span>Tipos de boleto</span>
            <strong>{ticketTypes.length}</strong>
          </article>
          <article className="stat-card">
            <span>Código</span>
            <strong>{event?.codigo_evento ?? "-"}</strong>
          </article>
        </div>

        <div className="panel-grid panel-grid-wide event-detail-columns">
          <div className="form-stack event-detail-block">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Tipos de boleto</span>
                <h2>Agregar tipo</h2>
              </div>
            </div>

            <div className="field-grid">
              <label>
                <span>Nombre del tipo</span>
                <input value={newTypeName} onChange={(event) => setNewTypeName(event.target.value)} placeholder="VIP, BACKSTAGE..." />
              </label>
              <label>
                <span>Precio inicial para fases actuales</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newTypeInitialPrice}
                  onChange={(event) => setNewTypeInitialPrice(event.target.value)}
                  placeholder={String(selectedPhase?.precio ?? event?.precio_inicial ?? 0)}
                />
              </label>
            </div>

            <div className="action-row event-detail-actions">
              <button type="button" className="primary-button" disabled={saving} onClick={() => void createTicketType()}>
                {saving ? "Guardando..." : "Agregar tipo"}
              </button>
            </div>

            <div className="collection-list compact-list">
              {ticketTypes.map((ticketType) => (
                <article key={ticketType.id} className="collection-card compact-ticket-card">
                  <div>
                    <h3>{ticketType.nombre}</h3>
                    <small>{ticketType.activo ? "Activo" : "Inactivo"}</small>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="form-stack event-detail-block">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Fases</span>
                <h2>Crear fase</h2>
              </div>
            </div>

            <div className="field-grid">
              <label>
                <span>Nombre</span>
                <input value={phaseForm.nombre} onChange={(event) => setPhaseForm((current) => ({ ...current, nombre: event.target.value }))} />
              </label>
              <label>
                <span>Precio base (General)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={phaseForm.precio}
                  onChange={(event) => setPhaseForm((current) => ({ ...current, precio: event.target.value }))}
                />
              </label>
              <label>
                <span>Inicio</span>
                <input
                  type="datetime-local"
                  value={phaseForm.fecha_inicio}
                  onChange={(event) => setPhaseForm((current) => ({ ...current, fecha_inicio: event.target.value }))}
                />
              </label>
              <label>
                <span>Fin</span>
                <input
                  type="datetime-local"
                  value={phaseForm.fecha_fin}
                  onChange={(event) => setPhaseForm((current) => ({ ...current, fecha_fin: event.target.value }))}
                />
              </label>
            </div>

            <div className="action-row event-detail-actions">
              <button type="button" className="primary-button" disabled={saving} onClick={() => void createPhase()}>
                {saving ? "Creando..." : "Crear fase"}
              </button>
            </div>

            <div className="select-frame">
              <label htmlFor="event-detail-phase">Fase para editar precios por tipo</label>
              <select
                id="event-detail-phase"
                value={selectedPhaseId ?? ""}
                onChange={(event) => setSelectedPhaseId(Number(event.target.value))}
              >
                {phases.map((phase) => (
                  <option key={phase.id} value={phase.id}>
                    {phase.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="collection-list compact-list">
              {phasePrices.map((priceRow) => (
                <article key={priceRow.ticket_type_id} className="collection-card compact-ticket-card event-price-row">
                  <div>
                    <h3>{priceRow.nombre}</h3>
                    <small>{selectedPhase?.nombre ?? "Fase"}</small>
                  </div>
                  <div className="collection-actions">
                    <input
                      className="event-price-input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={phasePriceDrafts[priceRow.ticket_type_id] ?? ""}
                      onChange={(event) =>
                        setPhasePriceDrafts((current) => ({ ...current, [priceRow.ticket_type_id]: event.target.value }))
                      }
                    />
                    <button
                      type="button"
                      className="ghost-button"
                      disabled={saving}
                      onClick={() => void updatePriceByType(priceRow.ticket_type_id)}
                    >
                      Guardar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}
