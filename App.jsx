import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { FoodOrderProvider } from './context/FoodOrderContext'
import AppLayout from './AppLayout'
import './App.css'
import './index.css'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <FoodOrderProvider>
          <AppLayout />
        </FoodOrderProvider>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
