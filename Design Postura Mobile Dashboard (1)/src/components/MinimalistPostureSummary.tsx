import { Card } from "./ui/card";
import { useTheme } from "./ThemeContext";

interface MinimalistPostureSummaryProps {
  percentage: number;
}

export function MinimalistPostureSummary({ percentage }: MinimalistPostureSummaryProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const radius = 70;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <Card className={`rounded-3xl shadow-md p-8 ${
      isDark 
        ? 'bg-[#0F1535] border border-[#1a2040]' 
        : 'bg-white border border-gray-100'
    }`}>
      <div className="flex flex-col items-center py-6">
        {/* Large Circular Progress */}
        <div className="relative inline-flex items-center justify-center mb-8">
          <svg width={160} height={160} className="transform -rotate-90">
            <circle
              cx={80}
              cy={80}
              r={radius}
              stroke={isDark ? "#1a2040" : "#E5E7EB"}
              strokeWidth={strokeWidth}
              fill="none"
            />
            <circle
              cx={80}
              cy={80}
              r={radius}
              stroke={isDark ? "#60A5FA" : "#3B82F6"}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-5xl ${isDark ? 'text-white' : 'text-gray-900'}`}>{percentage}%</span>
            <span className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Good Posture</span>
          </div>
        </div>

        {/* Time Breakdown */}
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isDark ? 'bg-blue-400' : 'bg-blue-500'}`}></div>
              <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Good Posture</span>
            </div>
            <span className={isDark ? 'text-white' : 'text-gray-900'}>6h 15m</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isDark ? 'bg-cyan-400' : 'bg-sky-400'}`}></div>
              <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Fair Posture</span>
            </div>
            <span className={isDark ? 'text-white' : 'text-gray-900'}>1h 20m</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isDark ? 'bg-indigo-400' : 'bg-slate-400'}`}></div>
              <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Poor Posture</span>
            </div>
            <span className={isDark ? 'text-white' : 'text-gray-900'}>30m</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
