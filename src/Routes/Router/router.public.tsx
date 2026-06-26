import { Navigate, Route, Routes } from "react-router-dom";
import PublicTicketPage from "../../Features/Tickets/Presentation/Pages/PublicTicketPage";
import Login from "../../Features/Users/Presentation/Pages/Login";

export default function RouterPublic () {
    return(
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/ticket/:token" element={<PublicTicketPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
            {
                // queda abierto para posibles rutas publicas.
            }
            
        </Routes>
    )
}