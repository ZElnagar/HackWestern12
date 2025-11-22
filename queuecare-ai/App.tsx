import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { QueueProvider } from './contexts/QueueContext';
import { Home } from './pages/Home';
import { PatientIntake } from './pages/PatientIntake';
import { StaffDashboard } from './pages/StaffDashboard';

const App: React.FC = () => {
  return (
    <QueueProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/check-in" element={<PatientIntake />} />
          <Route path="/staff" element={<StaffDashboard />} />
        </Routes>
      </Router>
    </QueueProvider>
  );
};

export default App;