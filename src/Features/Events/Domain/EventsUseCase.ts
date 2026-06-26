import type { EventPayload } from "../Data/Models/Event";
import type { EventTicketTypePayload } from "../Data/Models/TicketType";
import { EventsRepository } from "../Data/Repository/EventsRepository";

const repository = new EventsRepository();

export const eventsUseCase = {
  getEvents: () => repository.getEvents(),
  getEventById: (id: number) => repository.getEventById(id),
  createEvent: (payload: EventPayload) => repository.createEvent(payload),
  updateEvent: (id: number, payload: Partial<EventPayload>) => repository.updateEvent(id, payload),
  toggleEvent: (id: number) => repository.toggleEvent(id),
  getTicketTypes: (eventId: number) => repository.getTicketTypes(eventId),
  createTicketType: (eventId: number, payload: EventTicketTypePayload) => repository.createTicketType(eventId, payload),
  updateTicketType: (eventId: number, ticketTypeId: number, payload: Partial<{ nombre: string; activo: boolean }>) =>
    repository.updateTicketType(eventId, ticketTypeId, payload),
  getPhaseTicketTypePrices: (eventId: number, phaseId: number) => repository.getPhaseTicketTypePrices(eventId, phaseId),
  updatePhaseTicketTypePrice: (eventId: number, phaseId: number, ticketTypeId: number, precio: number) =>
    repository.updatePhaseTicketTypePrice(eventId, phaseId, ticketTypeId, precio),
};