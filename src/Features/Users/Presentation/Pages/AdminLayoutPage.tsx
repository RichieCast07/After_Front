import { useContext } from "react";
import { Navigate, Outlet, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import UserContext from "../../../../Core/Context/UserContext";
import { useEventsViewModel } from "../../../Events/Presentation/ViewModels/useEventsViewModel";
import type { NavTab } from "../../../Shared/Presentation/Components/DashboardShell";
import DashboardShell from "../../../Shared/Presentation/Components/DashboardShell";

export interface AdminLayoutContext {
  eventsVm: ReturnType<typeof useEventsViewModel>;
}

const tabs: NavTab[] = [
  { id: "metricas", label: "Métricas", icon: "📊" },
  { id: "eventos", label: "Eventos", icon: "🎪" },
  { id: "fases", label: "Fases", icon: "🎫" },
  { id: "clientes", label: "Clientes", icon: "👥" },
  { id: "equipo", label: "Equipo", icon: "🧑‍💼" },
  { id: "noshow", label: "No-show", icon: "🚫" },
];

function resolveActiveTab(pathname: string): string {
  const matched = tabs.find((tab) => pathname.includes(`/dashboard/${tab.id}`));
  return matched?.id ?? "metricas";
}

export function useAdminLayoutContext() {
  return useOutletContext<AdminLayoutContext>();
}

export default function AdminLayoutPage() {
  const session = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();
  const eventsVm = useEventsViewModel();

  if (!session?.user || session.user.rol_id !== 1) {
    return <Navigate to="/" replace />;
  }

  const activeTab = resolveActiveTab(location.pathname);

  return (
    <DashboardShell
      title="Consola de operación"
      username={session.user.username}
      badge="Administrador"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(tabId) => navigate(`/dashboard/${tabId}`)}
      onLogout={() => session.logout()}
    >
      <Outlet context={{ eventsVm }} />
    </DashboardShell>
  );
}
