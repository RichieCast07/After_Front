import { useEffect, useState } from "react";
import { formatCurrency } from "../../../../Core/Utils/currency";
import type { EventTicketTypeDTO, PhaseTicketTypePriceDTO } from "../../../Events/Data/Models/TicketType";
import { eventsUseCase } from "../../../Events/Domain/EventsUseCase";
import PhasesPanel from "../../../Phases/Presentation/Components/PhasesPanel";
import { usePhasesViewModel } from "../../../Phases/Presentation/ViewModels/usePhasesViewModel";
import FormModal from "../../../Shared/Presentation/Components/FormModal";
import { useAdminLayoutContext } from "./AdminLayoutContext";

export default function AdminPhasesTabPage() {
  const { eventsVm } = useAdminLayoutContext();
  const phasesVm = usePhasesViewModel(eventsVm.selectedEventId);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [ticketTypes, setTicketTypes] = useState<EventTicketTypeDTO[]>([]);
  const [phasePrices, setPhasePrices] = useState<PhaseTicketTypePriceDTO[]>([]);
  const [selectedPhaseId, setSelectedPhaseId] = useState<number | null>(null);
  const [phasePriceDrafts, setPhasePriceDrafts] = useState<Record<number, string>>({});
  const [priceModal, setPriceModal] = useState<{ ticketTypeId: number; nombre: string } | null>(null);
  const [pricesError, setPricesError] = useState("");
  const [savingPrice, setSavingPrice] = useState(false);

  const selectedEvent = eventsVm.events.find((event) => event.id === eventsVm.selectedEventId);

  useEffect(() => {
    if (!eventsVm.selectedEventId) {
      setTicketTypes([]);
      return;
    }
    eventsUseCase
      .getTicketTypes(eventsVm.selectedEventId)
      .then(setTicketTypes)
      .catch(() => setTicketTypes([]));
  }, [eventsVm.selectedEventId]);

  // Mantiene seleccionada la fase más reciente (la última creada) cuando cambia la lista de fases.
  useEffect(() => {
    if (phasesVm.phases.length === 0) {
      setSelectedPhaseId(null);
      return;
    }
    setSelectedPhaseId((current) => {
      if (current && phasesVm.phases.some((phase) => phase.id === current)) {
        return current;
      }
      return phasesVm.phases[phasesVm.phases.length - 1].id;
    });
  }, [phasesVm.phases]);

  const loadPhasePrices = async () => {
    if (!eventsVm.selectedEventId || !selectedPhaseId) {
      setPhasePrices([]);
      return;
    }
    try {
      const prices = await eventsUseCase.getPhaseTicketTypePrices(eventsVm.selectedEventId, selectedPhaseId);
      setPhasePrices(prices);
      setPhasePriceDrafts(
        Object.fromEntries(prices.map((priceRow) => [priceRow.ticket_type_id, String(Number(priceRow.precio).toFixed(2))]))
      );
      setPricesError("");
    } catch (loadError) {
      setPricesError(loadError instanceof Error ? loadError.message : "No fue posible cargar precios por tipo.");
    }
  };

  useEffect(() => {
    void loadPhasePrices();
  }, [selectedPhaseId, eventsVm.selectedEventId]);

  const openPriceModal = (priceRow: PhaseTicketTypePriceDTO) => {
    setPricesError("");
    setPhasePriceDrafts((current) => ({
      ...current,
      [priceRow.ticket_type_id]: String(Number(priceRow.precio).toFixed(2)),
    }));
    setPriceModal({ ticketTypeId: priceRow.ticket_type_id, nombre: priceRow.nombre });
  };

  const updatePriceByType = async (ticketTypeId: number) => {
    if (!eventsVm.selectedEventId || !selectedPhaseId) {
      setPricesError("Selecciona una fase.");
      return;
    }

    const priceDraft = Number(phasePriceDrafts[ticketTypeId]);
    if (!Number.isFinite(priceDraft) || priceDraft < 0) {
      setPricesError("Precio inválido.");
      return;
    }

    setSavingPrice(true);
    try {
      await eventsUseCase.updatePhaseTicketTypePrice(eventsVm.selectedEventId, selectedPhaseId, ticketTypeId, priceDraft);
      setPriceModal(null);
      await loadPhasePrices();
      setPricesError("");
    } catch (updateError) {
      setPricesError(updateError instanceof Error ? updateError.message : "No fue posible actualizar el precio.");
    } finally {
      setSavingPrice(false);
    }
  };

  const submit = async () => {
    const success = await phasesVm.submit();
    if (success) {
      setIsModalOpen(false);
    }
  };

  const selectedPhase = phasesVm.phases.find((phase) => phase.id === selectedPhaseId) ?? null;

  return (
    <>
      <PhasesPanel
        eventName={selectedEvent?.nombre}
        phases={phasesVm.phases}
        loading={phasesVm.loading}
        saving={phasesVm.saving}
        error={phasesVm.error}
        onCreateClick={() => {
          phasesVm.resetForm();
          setIsModalOpen(true);
        }}
        onEdit={(phase) => {
          phasesVm.handleEdit(phase);
          setIsModalOpen(true);
        }}
        onToggle={(phaseId) => void phasesVm.toggleStatus(phaseId)}
      />

      <section className="glass-panel panel-grid">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Tipos de boleto</span>
            <h2>Precios por tipo de boleto</h2>
          </div>
        </div>

        {pricesError ? <p className="inline-error">{pricesError}</p> : null}

        <div className="select-frame">
          <label htmlFor="phases-tab-phase">Fase para editar precios por tipo</label>
          <select
            id="phases-tab-phase"
            value={selectedPhaseId ?? ""}
            onChange={(event) => setSelectedPhaseId(Number(event.target.value))}
            disabled={!phasesVm.phases.length}
          >
            {phasesVm.phases.length === 0 ? <option value="">Sin fases</option> : null}
            {phasesVm.phases.map((phase) => (
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
                <span className="pill pill-success">{formatCurrency(priceRow.precio)}</span>
                <button type="button" className="ghost-button" onClick={() => openPriceModal(priceRow)}>
                  Editar
                </button>
              </div>
            </article>
          ))}
          {phasePrices.length === 0 ? (
            <p className="muted-copy">
              {ticketTypes.length === 0
                ? "Este evento aún no tiene tipos de boleto."
                : phasesVm.phases.length === 0
                ? "Crea una fase para definir precios."
                : "No hay precios por tipo en esta fase."}
            </p>
          ) : null}
        </div>
      </section>

      {isModalOpen ? (
        <FormModal
          title={phasesVm.editingId ? "Actualizar fase" : "Crear fase"}
          subtitle="Fases"
          error={phasesVm.error}
          onClose={() => setIsModalOpen(false)}
        >
          <div className="field-grid">
            <label>
              <span>Nombre</span>
              <input value={phasesVm.form.nombre} onChange={(event) => phasesVm.handleChange("nombre", event.target.value)} />
            </label>
            <label>
              <span>Precio base</span>
              <input
                type="number"
                value={phasesVm.form.precio}
                onChange={(event) => phasesVm.handleChange("precio", event.target.value)}
              />
            </label>
            <label>
              <span>Inicio</span>
              <input
                type="datetime-local"
                value={phasesVm.form.fecha_inicio}
                onChange={(event) => phasesVm.handleChange("fecha_inicio", event.target.value)}
              />
            </label>
            <label>
              <span>Fin</span>
              <input
                type="datetime-local"
                value={phasesVm.form.fecha_fin}
                onChange={(event) => phasesVm.handleChange("fecha_fin", event.target.value)}
              />
            </label>
          </div>
          {!phasesVm.editingId ? (
            <p className="muted-copy">
              Al crear la fase, cada tipo de boleto existente heredará automáticamente el precio de su fase anterior. Podrás
              ajustarlo después en "Precios por tipo de boleto".
            </p>
          ) : null}

          <div className="action-row">
            <button type="button" className="primary-button" disabled={phasesVm.saving} onClick={() => void submit()}>
              {phasesVm.saving ? "Guardando..." : phasesVm.editingId ? "Actualizar" : "Crear"}
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                phasesVm.resetForm();
                setIsModalOpen(false);
              }}
            >
              Cancelar
            </button>
          </div>
        </FormModal>
      ) : null}

      {priceModal ? (
        <FormModal
          title={`Editar precio · ${priceModal.nombre}`}
          subtitle={selectedPhase?.nombre ?? "Fase"}
          error={pricesError}
          onClose={() => setPriceModal(null)}
        >
          <div className="field-grid">
            <label>
              <span>Precio ({priceModal.nombre})</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={phasePriceDrafts[priceModal.ticketTypeId] ?? ""}
                onChange={(event) =>
                  setPhasePriceDrafts((current) => ({ ...current, [priceModal.ticketTypeId]: event.target.value }))
                }
              />
            </label>
          </div>
          <div className="action-row">
            <button
              type="button"
              className="primary-button"
              disabled={savingPrice}
              onClick={() => void updatePriceByType(priceModal.ticketTypeId)}
            >
              {savingPrice ? "Guardando..." : "Guardar precio"}
            </button>
            <button type="button" className="ghost-button" onClick={() => setPriceModal(null)}>
              Cancelar
            </button>
          </div>
        </FormModal>
      ) : null}
    </>
  );
}
