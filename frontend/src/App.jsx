import { Routes, Route } from 'react-router-dom'
import Home from "@/pages/Home.jsx"
import MainTest from "@/pages/MainTest.jsx"
import Login from "@/pages/Login.jsx"
import SignUp from "@/pages/SignUp.jsx"
import MainPage from "@/pages/MainPage.jsx"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/test" element={<MainTest />} />
      <Route path="/main" element={<MainPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/sign-up" element={<SignUp />} />
    </Routes>
  )
}

export default App
