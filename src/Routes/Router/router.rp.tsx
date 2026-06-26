import { Route, Routes } from "react-router-dom";
import RPDashboard from "../../Features/Users/Presentation/Pages/RPDashboard";
import RPProtected from "../Protected/RPProtected";

export default function RouterRP (){
    return (
        <Routes>
            <Route element={<RPProtected></RPProtected>}>
                <Route path="/rp" element={<RPDashboard />} />
                <Route path="*" element={<RPDashboard />} />
            </Route>
        </Routes>
    )
}