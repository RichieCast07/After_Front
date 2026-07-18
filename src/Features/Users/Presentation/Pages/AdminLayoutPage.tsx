import { useContext, useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import UserContext from "../../../../Core/Context/UserContext";
import { useEventsViewModel } from "../../../Events/Presentation/ViewModels/useEventsViewModel";
import type { NavTab } from "../../../Shared/Presentation/Components/DashboardShell";
import DashboardShell from "../../../Shared/Presentation/Components/DashboardShell";
import AdminClientsTabPage from "./AdminClientsTabPage";
import AdminEventSelectionPage from "./AdminEventSelectionPage";
import AdminTeamTabPage from "./AdminTeamTabPage";

export interface AdminLayoutContext {
  eventsVm: ReturnType<typeof useEventsViewModel>;
}

const CHOSEN_EVENT_KEY = "after.admin.chosenEventId";

// Datos generales (no dependen del evento): viven en la pantalla de selección.
const generalTabs: NavTab[] = [
  { id: "eventos", label: "Eventos", icon: "🎪" },
  { id: "clientes", label: "Clientes", icon: "👥" },
  { id: "equipo", label: "Equipo", icon: "🧑‍💼" },
];

// Datos del evento: viven dentro del panel de un evento abierto.
const eventTabs: NavTab[] = [
  { id: "metricas", label: "Métricas", icon: "📊" },
  { id: "fases", label: "Fases", icon: "🎫" },
  { id: "tickets", label: "Tickets", icon: "🎟️" },
];

function resolveActiveTab(pathname: string): string {
  const matched = eventTabs.find((tab) => pathname.includes(`/dashboard/${tab.id}`));
  return matched?.id ?? "metricas";
}

function readStoredEventId(): number | null {
  const raw = sessionStorage.getItem(CHOSEN_EVENT_KEY);
  const id = raw ? Number(raw) : NaN;
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function useAdminLayoutContext() {
  return useOutletContext<AdminLayoutContext>();
}

export default function AdminLayoutPage() {
  const session = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();
  const eventsVm = useEventsViewModel();
  const [chosenEventId, setChosenEventId] = useState<number | null>(() => readStoredEventId());
  const [generalTab, setGeneralTab] = useState("eventos");

  // Restaura el evento elegido en el viewModel al montar / cargar eventos
  // (p. ej. al volver desde el detalle de un RP, que desmonta este layout).
  useEffect(() => {
    if (chosenEventId != null && eventsVm.events.some((event) => event.id === chosenEventId)) {
      eventsVm.setSelectedEventId(chosenEventId);
    }
  }, [chosenEventId, eventsVm.events]);

  if (!session?.user || session.user.rol_id !== 1) {
    return <Navigate to="/" replace />;
  }

  const enterEvent = (eventId: number) => {
    sessionStorage.setItem(CHOSEN_EVENT_KEY, String(eventId));
    eventsVm.setSelectedEventId(eventId);
    setChosenEventId(eventId);
    navigate("/dashboard/metricas");
  };

  const backToEvents = () => {
    sessionStorage.removeItem(CHOSEN_EVENT_KEY);
    setGeneralTab("eventos");
    setChosenEventId(null);
  };

  if (chosenEventId == null) {
    return (
      <DashboardShell
        title="Administración"
        username={session.user.username}
        badge="Administrador"
        tabs={generalTabs}
        activeTab={generalTab}
        onTabChange={setGeneralTab}
        onLogout={() => session.logout()}
      >
        {generalTab === "eventos" ? <AdminEventSelectionPage eventsVm={eventsVm} onEnter={enterEvent} /> : null}
        {generalTab === "clientes" ? <AdminClientsTabPage /> : null}
        {generalTab === "equipo" ? <AdminTeamTabPage /> : null}
      </DashboardShell>
    );
  }

  const selectedEvent = eventsVm.events.find((event) => event.id === chosenEventId);
  const activeTab = resolveActiveTab(location.pathname);

  return (
    <DashboardShell
      title="Consola de operación"
      username={session.user.username}
      badge={selectedEvent ? selectedEvent.nombre : "Administrador"}
      tabs={eventTabs}
      activeTab={activeTab}
      onTabChange={(tabId) => navigate(`/dashboard/${tabId}`)}
      onLogout={() => session.logout()}
      headerAction={
        <button type="button" className="ghost-button" onClick={backToEvents}>
          ← Eventos
        </button>
      }
    >
      <Outlet context={{ eventsVm }} />
    </DashboardShell>
  );
}
