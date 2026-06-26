import { apiRequest } from "../../../../Core/Api/apiClient";
import type { EventDTO, EventPayload } from "../Models/Event";
import type { EventTicketTypeDTO, EventTicketTypePayload, PhaseTicketTypePriceDTO } from "../Models/TicketType";

export class EventsRepository {
  getEvents() {
    return apiRequest<EventDTO[]>("events");
  }

  createEvent(payload: EventPayload) {
    return apiRequest<EventDTO>("events", {
      method: "POST",
      body: payload,
    });
  }

  getEventById(id: number) {
    return apiRequest<EventDTO>(`events/${id}`);
  }

  updateEvent(id: number, payload: Partial<EventPayload>) {
    return apiRequest<EventDTO>(`events/${id}`, {
      method: "PUT",
      body: payload,
    });
  }

  toggleEvent(id: number) {
    return apiRequest<EventDTO>(`events/${id}/toggle`, {
      method: "PATCH",
    });
  }

  getTicketTypes(eventId: number) {
    return apiRequest<EventTicketTypeDTO[]>(`events/${eventId}/ticket-types`);
  }

  createTicketType(eventId: number, payload: EventTicketTypePayload) {
    return apiRequest<EventTicketTypeDTO>(`events/${eventId}/ticket-types`, {
      method: "POST",
      body: payload,
    });
  }

  updateTicketType(eventId: number, ticketTypeId: number, payload: Partial<{ nombre: string; activo: boolean }>) {
    return apiRequest<EventTicketTypeDTO>(`events/${eventId}/ticket-types/${ticketTypeId}`, {
      method: "PUT",
      body: payload,
    });
  }

  getPhaseTicketTypePrices(eventId: number, phaseId: number) {
    return apiRequest<PhaseTicketTypePriceDTO[]>(`events/${eventId}/phases/${phaseId}/ticket-types`);
  }

  updatePhaseTicketTypePrice(eventId: number, phaseId: number, ticketTypeId: number, precio: number) {
    return apiRequest<PhaseTicketTypePriceDTO>(`events/${eventId}/phases/${phaseId}/ticket-types/${ticketTypeId}`, {
      method: "PUT",
      body: { precio },
    });
  }
}