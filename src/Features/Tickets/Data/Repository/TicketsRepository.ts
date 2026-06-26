import { apiRequest } from "../../../../Core/Api/apiClient";
import type { TicketDTO, TicketPayload } from "../Models/Ticket";

export class TicketsRepository {
  sellTicket(payload: TicketPayload) {
    return apiRequest<TicketDTO>("tickets", {
      method: "POST",
      body: payload,
    });
  }

  getTicketByCode(code: string) {
    return apiRequest<TicketDTO>(`tickets/${encodeURIComponent(code)}`);
  }

  getPublicTicketByToken(token: string) {
    return apiRequest<TicketDTO>(`tickets/public/${encodeURIComponent(token)}`, {
      auth: false,
    });
  }

  markTicketAsUsed(code: string) {
    return apiRequest<TicketDTO>(`tickets/${encodeURIComponent(code)}/use`, {
      method: "PATCH",
    });
  }

  deleteTicketByCode(code: string) {
    return apiRequest<{ success: boolean; message: string }>(`tickets/${encodeURIComponent(code)}`, {
      method: "DELETE",
    });
  }

  getTicketsByEventId(eventId: number) {
    return apiRequest<TicketDTO[]>(`tickets/event/${eventId}`);
  }

  getTicketsByRpId(rpId: number) {
    return apiRequest<TicketDTO[]>(`tickets/rp/${rpId}`);
  }

  getExpiredActiveTickets() {
    return apiRequest<TicketDTO[]>("tickets/expired-active");
  }
}