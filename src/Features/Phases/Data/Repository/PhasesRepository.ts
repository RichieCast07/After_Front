import { apiRequest } from "../../../../Core/Api/apiClient";
import type { PhaseDTO, PhasePayload } from "../Models/Phase";

export class PhasesRepository {
  getPhases(eventId: number) {
    return apiRequest<PhaseDTO[]>(`events/${eventId}/phases`);
  }

  createPhase(eventId: number, payload: PhasePayload) {
    return apiRequest<PhaseDTO>(`events/${eventId}/phases`, {
      method: "POST",
      body: payload,
    });
  }

  updatePhase(eventId: number, phaseId: number, payload: Partial<PhasePayload>) {
    return apiRequest<PhaseDTO>(`events/${eventId}/phases/${phaseId}`, {
      method: "PUT",
      body: payload,
    });
  }

  togglePhase(eventId: number, phaseId: number) {
    return apiRequest<PhaseDTO>(`events/${eventId}/phases/${phaseId}/toggle`, {
      method: "PATCH",
    });
  }
}