import React, { useMemo } from 'react';
import { Layout } from '../components/Layout';
import { useQueue } from '../contexts/QueueContext';
import { TriageLevel, Patient } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const StaffDashboard: React.FC = () => {
  const { patients, markAsSeen, clearQueue } = useQueue();

  // Sort patients: Active first, then by priority (RED > ORANGE > YELLOW > GREEN), then by time
  const sortedPatients = useMemo(() => {
    const priorityOrder = {
      [TriageLevel.RED]: 0,
      [TriageLevel.ORANGE]: 1,
      [TriageLevel.YELLOW]: 2,
      [TriageLevel.GREEN]: 3
    };

    return [...patients]
      .filter(p => p.status === 'waiting')
      .sort((a, b) => {
        const pDiff = priorityOrder[a.triageLevel] - priorityOrder[b.triageLevel];
        if (pDiff !== 0) return pDiff;
        return a.timestamp - b.timestamp;
      });
  }, [patients]);

  const seenPatients = patients.filter(p => p.status === 'seen');

  // Stats for Chart
  const stats = useMemo(() => {
     const data = [
       { name: 'Critical', count: 0, color: '#DC2626' }, // Red
       { name: 'Urgent', count: 0, color: '#EA580C' }, // Orange
       { name: 'Stable', count: 0, color: '#CA8A04' }, // Yellow
       { name: 'Minor', count: 0, color: '#16A34A' }, // Green
     ];
     patients.forEach(p => {
       if (p.triageLevel === TriageLevel.RED) data[0].count++;
       else if (p.triageLevel === TriageLevel.ORANGE) data[1].count++;
       else if (p.triageLevel === TriageLevel.YELLOW) data[2].count++;
       else if (p.triageLevel === TriageLevel.GREEN) data[3].count++;
     });
     return data;
  }, [patients]);

  const getRowColor = (level: TriageLevel) => {
    switch (level) {
      case TriageLevel.RED: return 'bg-red-50 border-l-4 border-red-600';
      case TriageLevel.ORANGE: return 'bg-orange-50 border-l-4 border-orange-500';
      case TriageLevel.YELLOW: return 'bg-yellow-50 border-l-4 border-yellow-400';
      case TriageLevel.GREEN: return 'bg-white border-l-4 border-green-500';
      default: return 'bg-white';
    }
  };

  return (
    <Layout>
      <div className="bg-gray-100 min-h-screen p-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left: Queue List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
               <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                 <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                 Live Queue ({sortedPatients.length})
               </h2>
               <button onClick={clearQueue} className="text-xs text-gray-400 hover:text-red-500">Reset Data</button>
            </div>

            <div className="space-y-3">
              {sortedPatients.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl text-gray-400">
                  No patients waiting.
                </div>
              ) : (
                sortedPatients.map((patient) => (
                  <div key={patient.id} className={`relative p-5 rounded-xl shadow-sm flex flex-col sm:flex-row justify-between items-start gap-4 ${getRowColor(patient.triageLevel)} transition-all hover:shadow-md`}>
                    <div className="flex-1 w-full">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-2xl font-mono font-bold text-gray-900">#{patient.id}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded text-white
                          ${patient.triageLevel === TriageLevel.RED ? 'bg-red-600' : 
                            patient.triageLevel === TriageLevel.ORANGE ? 'bg-orange-500' :
                            patient.triageLevel === TriageLevel.YELLOW ? 'bg-yellow-500' : 'bg-green-500'
                          }`}>
                          {patient.triageLevel}
                        </span>
                        <span className="text-xs text-gray-500">
                          {Math.floor((Date.now() - patient.timestamp) / 60000)} min wait
                        </span>
                      </div>
                      <div className="text-gray-800 font-medium">{patient.symptoms.complaint} <span className="text-gray-400 font-normal mx-1">|</span> Pain: {patient.symptoms.painLevel}/10</div>
                      <div className="text-sm text-gray-500 mt-1 truncate max-w-md">{patient.triageReason}</div>
                      
                      {/* Medical Research Insight for Staff */}
                      {patient.visuals?.research?.insight && (
                         <div className="mt-3 bg-white/60 p-2 rounded border border-black/5 text-xs text-gray-700">
                           <span className="font-bold text-gray-500 block mb-1">AI Suspected Deficiencies:</span>
                           <p className="line-clamp-2">{patient.visuals.research.insight}</p>
                         </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                       {patient.visuals && (
                         <div className="hidden md:block text-right text-xs text-gray-400 space-y-0.5">
                           <div>Alertness: {patient.visuals.alertness}</div>
                           <div>Skin: {patient.visuals.pallor}</div>
                           {patient.visuals.observations && patient.visuals.observations.length > 0 && (
                             <div className="flex gap-1 justify-end mt-1 flex-wrap">
                               {patient.visuals.observations.slice(0, 3).map((obs, i) => (
                                 <span key={i} className="bg-gray-200 text-gray-600 px-1 rounded text-[10px] whitespace-nowrap">{obs}</span>
                               ))}
                             </div>
                           )}
                         </div>
                       )}
                       <button 
                         onClick={() => markAsSeen(patient.id)}
                         className="mt-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg text-sm transition-colors shadow-sm whitespace-nowrap w-full sm:w-auto"
                       >
                         Admit
                       </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Stats & History */}
          <div className="space-y-6">
             <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-4">Triage Overview</h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats}>
                      <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        cursor={{fill: 'transparent'}}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {stats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
             </div>

             <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-4">Recently Admitted</h3>
                <ul className="space-y-3">
                  {seenPatients.slice(-5).reverse().map(p => (
                    <li key={p.id} className="flex justify-between text-sm border-b border-gray-100 pb-2 last:border-0">
                      <span className="text-gray-600 font-medium">#{p.id}</span>
                      <span className="text-gray-400">{p.symptoms.complaint}</span>
                    </li>
                  ))}
                  {seenPatients.length === 0 && <li className="text-gray-300 text-sm italic">No history yet.</li>}
                </ul>
             </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};