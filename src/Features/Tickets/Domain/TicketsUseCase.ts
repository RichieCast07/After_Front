import type { TicketPayload } from "../Data/Models/Ticket";
import { TicketsRepository } from "../Data/Repository/TicketsRepository";

const repository = new TicketsRepository();

export const ticketsUseCase = {
  sellTicket: (payload: TicketPayload) => repository.sellTicket(payload),
  getTicketByCode: (code: string) => repository.getTicketByCode(code),
  getPublicTicketByToken: (token: string) => repository.getPublicTicketByToken(token),
  markTicketAsUsed: (code: string) => repository.markTicketAsUsed(code),
  deleteTicketByCode: (code: string) => repository.deleteTicketByCode(code),
  getTicketsByEventId: (eventId: number) => repository.getTicketsByEventId(eventId),
  getTicketsByRpId: (rpId: number) => repository.getTicketsByRpId(rpId),
  getExpiredActiveTickets: () => repository.getExpiredActiveTickets(),
};