import { useState } from 'react'
import StationManagement from './components/Station.tsx'
import {BrowserRouter, Routes, Route, Link} from "react-router-dom"
import { Home } from 'lucide-react';
import Homepage from './components/Home.tsx';
import DashboardPage from './pages/DashboradPage.tsx';
import LoginPage from './pages/LoginPage.tsx';


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  const handleLoginSuccess = (id: number) => {
    setUserId(id);
    setIsLoggedIn(true);
  };

  return (
    <>
        {!isLoggedIn ? (
          <LoginPage onLoginSuccess={handleLoginSuccess} />
        ) : (
          <DashboardPage />
        )}
      </>
  );
}

export default App;