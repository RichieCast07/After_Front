import { useContext } from "react";
import UserContext from "../../Core/Context/UserContext";
import { Navigate, Outlet } from "react-router-dom";

export default function AdminProtected () {
    const value = useContext(UserContext)
    return value?.user?.rol_id == 1 ? <Outlet /> : <Navigate to={"/"}/>
}