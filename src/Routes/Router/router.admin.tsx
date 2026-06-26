import { Navigate, Route, Routes } from "react-router-dom";
import AdminClientsTabPage from "../../Features/Users/Presentation/Pages/AdminClientsTabPage";
import AdminEventDetailPage from "../../Features/Users/Presentation/Pages/AdminEventDetailPage";
import AdminEventsTabPage from "../../Features/Users/Presentation/Pages/AdminEventsTabPage";
import AdminLayoutPage from "../../Features/Users/Presentation/Pages/AdminLayoutPage";
import AdminMetricsTabPage from "../../Features/Users/Presentation/Pages/AdminMetricsTabPage";
import AdminNoShowTabPage from "../../Features/Users/Presentation/Pages/AdminNoShowTabPage";
import AdminPhasesTabPage from "../../Features/Users/Presentation/Pages/AdminPhasesTabPage";
import AdminRpDetailPage from "../../Features/Users/Presentation/Pages/AdminRpDetailPage";
import AdminTeamTabPage from "../../Features/Users/Presentation/Pages/AdminTeamTabPage";
import AdminProtected from "../Protected/AdminProtected";

export default function RouterAdmin () {
    return(
        <Routes>
            <Route element={<AdminProtected />} >
                <Route path="/dashboard" element={<AdminLayoutPage />}>
                    <Route index element={<Navigate to="metricas" replace />} />
                    <Route path="metricas" element={<AdminMetricsTabPage />} />
                    <Route path="eventos" element={<AdminEventsTabPage />} />
                    <Route path="fases" element={<AdminPhasesTabPage />} />
                    <Route path="clientes" element={<AdminClientsTabPage />} />
                    <Route path="equipo" element={<AdminTeamTabPage />} />
                    <Route path="noshow" element={<AdminNoShowTabPage />} />
                </Route>
                <Route path="/dashboard/events/:eventId" element={<AdminEventDetailPage />} />
                <Route path="/dashboard/rp/:rpId" element={<AdminRpDetailPage />} />
                <Route path="*" element={<Navigate to="/dashboard/metricas" replace />} />
            </Route>
        </Routes>
    )
}