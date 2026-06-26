import { createContext } from "react";
import type { ProviderDTO } from "../../Features/Users/Data/Models/ProviderDTO";

const UserContext = createContext<ProviderDTO | null> (null)

export default UserContext;