import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Patient } from '../types';

interface QueueContextType {
  patients: Patient[];
  addPatient: (patient: Patient) => void;
  markAsSeen: (id: string) => void;
  clearQueue: () => void;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

export const QueueProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>([]);

  // Load from local storage on mount
  useEffect(() => {
    const stored = localStorage.getItem('queuecare_patients');
    if (stored) {
      try {
        setPatients(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored patients", e);
      }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('queuecare_patients', JSON.stringify(patients));
  }, [patients]);

  const addPatient = (patient: Patient) => {
    setPatients(prev => [...prev, patient]);
  };

  const markAsSeen = (id: string) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, status: 'seen' } : p));
  };

  const clearQueue = () => {
    setPatients([]);
  };

  return (
    <QueueContext.Provider value={{ patients, addPatient, markAsSeen, clearQueue }}>
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = () => {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error("useQueue must be used within a QueueProvider");
  }
  return context;
};