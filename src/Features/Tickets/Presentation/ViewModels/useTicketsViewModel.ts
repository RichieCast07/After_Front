import { useEffect, useState } from "react";
import type { TicketDTO } from "../../Data/Models/Ticket";
import { ticketsUseCase } from "../../Domain/TicketsUseCase";

interface UseTicketsViewModelOptions {
  eventId: number | null;
  defaultRpId: number;
}

const initialForm = {
  cliente_nombre: "",
  cliente_telefono: "",
  rp_id: "",
  tipo_boleto: "GENERAL",
};

export function useTicketsViewModel({ eventId, defaultRpId }: UseTicketsViewModelOptions) {
  const [ticket, setTicket] = useState<TicketDTO | null>(null);
  const [generatedTicket, setGeneratedTicket] = useState<TicketDTO | null>(null);
  const [eventTickets, setEventTickets] = useState<TicketDTO[]>([]);
  const [rpTickets, setRpTickets] = useState<TicketDTO[]>([]);
  const [lookupCode, setLookupCode] = useState("");
  const [form, setForm] = useState({ ...initialForm, rp_id: String(defaultRpId) });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadEventTickets = async () => {
    if (!eventId) {
      setEventTickets([]);
      return;
    }

    try {
      const data = await ticketsUseCase.getTicketsByEventId(eventId);
      setEventTickets(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No fue posible cargar los boletos del evento.");
    }
  };

  const loadRpTickets = async () => {
    try {
      const data = await ticketsUseCase.getTicketsByRpId(defaultRpId);
      setRpTickets(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No fue posible cargar los boletos del RP.");
    }
  };

  useEffect(() => {
    setForm((current) => ({ ...current, rp_id: String(defaultRpId) }));
    void loadRpTickets();
  }, [defaultRpId]);

  useEffect(() => {
    void loadEventTickets();
  }, [eventId]);

  const handleChange = (field: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const sellTicket = async () => {
    if (!eventId) {
      setError("Selecciona un evento antes de vender boletos.");
      return false;
    }

    const cleanPhone = form.cliente_telefono.replace(/\D/g, "");

    if (!form.cliente_nombre.trim() || !cleanPhone) {
      setError("Nombre y telefono del cliente son obligatorios.");
      return false;
    }

    if (cleanPhone.length !== 10) {
      setError("El telefono debe tener 10 dígitos.");
      return false;
    }

    setSaving(true);
    try {
      const created = await ticketsUseCase.sellTicket({
        cliente_nombre: form.cliente_nombre.trim(),
        cliente_telefono: cleanPhone,
        rp_id: Number(form.rp_id),
        evento_id: eventId,
        tipo_boleto: form.tipo_boleto?.trim() || "GENERAL",
      });

      setTicket(created);
      setGeneratedTicket(created);
      setLookupCode(created.codigo);
      setForm({ ...initialForm, rp_id: String(defaultRpId) });
      setError("");
      await Promise.all([loadEventTickets(), loadRpTickets()]);
      return true;
    } catch (sellError) {
      setError(sellError instanceof Error ? sellError.message : "No fue posible registrar el boleto.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const lookupTicket = async () => {
    if (!lookupCode) {
      setError("Ingresa un codigo para buscar.");
      return;
    }

    setLoading(true);
    try {
      const data = await ticketsUseCase.getTicketByCode(lookupCode);
      setTicket(data);
      setError("");
    } catch (lookupError) {
      setTicket(null);
      setError(lookupError instanceof Error ? lookupError.message : "No fue posible encontrar el boleto.");
    } finally {
      setLoading(false);
    }
  };

  const markAsUsed = async () => {
    if (!ticket) {
      return;
    }

    setSaving(true);
    try {
      const updated = await ticketsUseCase.markTicketAsUsed(ticket.codigo);
      setTicket(updated);
      await Promise.all([loadEventTickets(), loadRpTickets()]);
    } catch (useError) {
      setError(useError instanceof Error ? useError.message : "No fue posible marcar el boleto como usado.");
    } finally {
      setSaving(false);
    }
  };

  return {
    ticket,
    generatedTicket,
    eventTickets,
    rpTickets,
    lookupCode,
    setLookupCode,
    form,
    loading,
    saving,
    error,
    handleChange,
    sellTicket,
    lookupTicket,
    markAsUsed,
    closeGeneratedTicket: () => setGeneratedTicket(null),
    reloadEventTickets: loadEventTickets,
    reloadRpTickets: loadRpTickets,
  };
}