import { Route, Routes, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { HomeMapMinimized } from './pages/HomeMapMinimized';
import { HomeMapMaximized } from './pages/HomeMapMaximized';
import { HomeProvider } from './context/HomeContext';

export default function App() {
  return (
    <HomeProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<HomeMapMinimized />} />
        <Route path="/home/map" element={<HomeMapMaximized />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HomeProvider>
  );
}
