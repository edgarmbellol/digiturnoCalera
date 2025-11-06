import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import KioskScreen from './screens/KioskScreen'
import DisplayScreen from './screens/DisplayScreen'
import ProfessionalLogin from './screens/ProfessionalLogin'
import ProfessionalPanel from './screens/ProfessionalPanel'
import DoctorLogin from './screens/DoctorLogin'
import DoctorPanel from './screens/DoctorPanel'
import AdminLogin from './screens/AdminLogin'
import AdminPanel from './screens/AdminPanel'
import HomeScreen from './screens/HomeScreen'

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/kiosk" element={<KioskScreen />} />
        <Route path="/display" element={<DisplayScreen />} />
        <Route path="/professional/login" element={<ProfessionalLogin />} />
        <Route path="/professional/panel" element={<ProfessionalPanel />} />
        <Route path="/doctor/login" element={<DoctorLogin />} />
        <Route path="/doctor/panel" element={<DoctorPanel />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/panel" element={<AdminPanel />} />
      </Routes>
    </Router>
  )
}

export default App

