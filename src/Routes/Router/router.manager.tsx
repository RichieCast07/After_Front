import { Route, Routes } from "react-router-dom";
import ManagerProtected from "../Protected/ManagerProtected";
import ManagerScannerPage from "../../Features/Users/Presentation/Pages/ManagerScannerPage";

export default function RouterManager() {
  return (
    <Routes>
      <Route element={<ManagerProtected />}>
        <Route path="/manager" element={<ManagerScannerPage />} />
        <Route path="*" element={<ManagerScannerPage />} />
      </Route>
    </Routes>
  );
}
