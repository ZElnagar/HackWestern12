import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Props {
  score: number;
  label: string;
  size?: 'small' | 'large';
  color?: string;
}

const HealthRing: React.FC<Props> = ({ score, label, size = 'small', color }) => {
  const isLarge = size === 'large';
  const radius = isLarge ? 80 : 40;
  const strokeWidth = isLarge ? 12 : 6;
  const textSize = isLarge ? 'text-4xl' : 'text-lg';
  const labelSize = isLarge ? 'text-lg' : 'text-xs';

  // Determine color based on score if not provided
  const getColor = (value: number) => {
    if (color) return color;
    if (value >= 80) return '#22c55e'; // Green - Optimal
    if (value >= 60) return '#eab308'; // Yellow - Needs Improvement
    return '#ef4444'; // Red - At Risk
  };

  const ringColor = getColor(score);
  
  const data = [
    { value: score },
    { value: 100 - score }
  ];

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center">
        <div style={{ width: radius * 2 + 20, height: radius * 2 + 20 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={radius - strokeWidth}
                outerRadius={radius}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                stroke="none"
              >
                <Cell fill={ringColor} />
                <Cell fill="var(--ring-track)" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold text-slate-800 dark:text-white ${textSize}`}>
            {score}
          </span>
        </div>
      </div>
      <span className={`mt-2 font-medium text-slate-600 dark:text-slate-300 ${labelSize} text-center`}>
        {label}
      </span>
    </div>
  );
};

export default HealthRing;

