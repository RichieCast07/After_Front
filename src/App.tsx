import './App.css'
import { useState } from 'react'
import { clearStoredUser, getStoredUser, persistUser } from './Core/Session/sessionStorage'
import UserContext from './Core/Context/UserContext'
import RouterAdmin from './Routes/Router/router.admin'
import RouterManager from './Routes/Router/router.manager'
import RouterPublic from './Routes/Router/router.public'
import RouterRP from './Routes/Router/router.rp'
import type { LoginResponseDTO } from './Features/Users/Data/Models/LoginResponseDTO'

function App() {
  const [user, setUserState] = useState<LoginResponseDTO | null>(() => getStoredUser())

  const setUser = (nextUser: LoginResponseDTO | null) => {
    setUserState(nextUser)

    if (nextUser) {
      persistUser(nextUser)
      return
    }

    clearStoredUser()
  }

  const logout = () => setUser(null)

  return (
    <>
    <UserContext.Provider value={{user, setUser, logout}}>
      {
        !user &&
          <RouterPublic />
      }
      {
        user?.rol_id === 1 && 
          <RouterAdmin />

      }
      {
        user?.rol_id === 2 &&
          <RouterRP></RouterRP>
      }
      {
        user?.rol_id === 3 &&
          <RouterManager />
      }
    </UserContext.Provider>
    </>
  )
}

export default App
