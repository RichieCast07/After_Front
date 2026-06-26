import { PhasesRepository } from "../Data/Repository/PhasesRepository";
import type { PhasePayload } from "../Data/Models/Phase";

const repository = new PhasesRepository();

export const phasesUseCase = {
  getPhases: (eventId: number) => repository.getPhases(eventId),
  createPhase: (eventId: number, payload: PhasePayload) => repository.createPhase(eventId, payload),
  updatePhase: (eventId: number, phaseId: number, payload: Partial<PhasePayload>) =>
    repository.updatePhase(eventId, phaseId, payload),
  togglePhase: (eventId: number, phaseId: number) => repository.togglePhase(eventId, phaseId),
};