import { Navigate, Route, Routes } from "react-router-dom";
import AdminEventDetailPage from "../../Features/Users/Presentation/Pages/AdminEventDetailPage";
import AdminLayoutPage from "../../Features/Users/Presentation/Pages/AdminLayoutPage";
import AdminMetricsTabPage from "../../Features/Users/Presentation/Pages/AdminMetricsTabPage";
import AdminPhasesTabPage from "../../Features/Users/Presentation/Pages/AdminPhasesTabPage";
import AdminTicketsTabPage from "../../Features/Users/Presentation/Pages/AdminTicketsTabPage";
import AdminRpDetailPage from "../../Features/Users/Presentation/Pages/AdminRpDetailPage";
import AdminProtected from "../Protected/AdminProtected";

export default function RouterAdmin () {
    return(
        <Routes>
            <Route element={<AdminProtected />} >
                <Route path="/dashboard" element={<AdminLayoutPage />}>
                    <Route index element={<Navigate to="metricas" replace />} />
                    <Route path="metricas" element={<AdminMetricsTabPage />} />
                    <Route path="fases" element={<AdminPhasesTabPage />} />
                    <Route path="tickets" element={<AdminTicketsTabPage />} />
                </Route>
                <Route path="/dashboard/events/:eventId" element={<AdminEventDetailPage />} />
                <Route path="/dashboard/rp/:rpId" element={<AdminRpDetailPage />} />
                <Route path="*" element={<Navigate to="/dashboard/metricas" replace />} />
            </Route>
        </Routes>
    )
}