import { Routes, Route } from 'react-router-dom'
import Home from "@/pages/Home.jsx"
import Dashboard from "@/pages/Dashboard.jsx"
import Login from "@/pages/Login.jsx"
import SignUp from "@/pages/SignUp.jsx"
import ForgotPassword from "@/pages/ForgotPassword.jsx"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/sign-up" element={<SignUp />} />
    </Routes>
  )
}

export default App
