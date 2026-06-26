import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import UserContext from "../../Core/Context/UserContext";

export default function ManagerProtected() {
  const value = useContext(UserContext);
  return value?.user?.rol_id === 3 ? <Outlet /> : <Navigate to="/" />;
}
