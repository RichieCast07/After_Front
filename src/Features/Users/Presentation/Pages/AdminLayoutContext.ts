import { useOutletContext } from "react-router-dom";
import type { useEventsViewModel } from "../../../Events/Presentation/ViewModels/useEventsViewModel";

export interface AdminLayoutContext {
  eventsVm: ReturnType<typeof useEventsViewModel>;
}

export function useAdminLayoutContext() {
  return useOutletContext<AdminLayoutContext>();
}
