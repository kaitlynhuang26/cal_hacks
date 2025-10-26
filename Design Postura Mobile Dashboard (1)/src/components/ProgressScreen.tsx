import { RealTimePostureTracking } from "./RealTimePostureTracking";
import { Card } from "./ui/card";
import { useTheme } from "./ThemeContext";
import { TrendingUp, Calendar, Award } from "lucide-react";

export function ProgressScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Mock weekly data
  const weeklyData = [
    { day: "Mon", percentage: 78 },
    { day: "Tue", percentage: 82 },
    { day: "Wed", percentage: 75 },
    { day: "Thu", percentage: 88 },
    { day: "Fri", percentage: 85 },
    { day: "Sat", percentage: 90 },
    { day: "Sun", percentage: 82 },
  ];

  const maxPercentage = Math.max(...weeklyData.map(d => d.percentage));

  return (
    <div className="space-y-6">
      {/* Live Tracking Box */}
      <RealTimePostureTracking />

      {/* Weekly Progress Chart */}
      <Card className={`rounded-2xl shadow-md p-5 ${
        isDark 
          ? 'bg-[#0F1535] border border-[#1a2040]' 
          : 'bg-white border border-gray-100'
      }`}>
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <h2 className={`${isDark ? 'text-white' : 'text-gray-900'}`}>Weekly Progress</h2>
        </div>

        {/* Bar Chart */}
        <div className="flex items-end justify-between gap-2 h-40 mb-3">
          {weeklyData.map((data, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col justify-end h-32">
                <div 
                  className={`w-full rounded-t-lg transition-all ${
                    isDark ? 'bg-blue-500' : 'bg-blue-600'
                  }`}
                  style={{ height: `${(data.percentage / maxPercentage) * 100}%` }}
                />
              </div>
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {data.day}
              </span>
            </div>
          ))}
        </div>

        {/* Average */}
        <div className={`text-center pt-4 border-t ${
          isDark ? 'border-[#1a2040]' : 'border-gray-100'
        }`}>
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Weekly Average: 
          </span>
          <span className={`ml-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
            83%
          </span>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Total Hours */}
        <Card className={`rounded-2xl shadow-md p-4 ${
          isDark 
            ? 'bg-[#0F1535] border border-[#1a2040]' 
            : 'bg-white border border-gray-100'
        }`}>
          <Calendar className={`w-5 h-5 mb-2 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
          <div className={`text-2xl mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            42h
          </div>
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Tracked This Week
          </div>
        </Card>

        {/* Best Day */}
        <Card className={`rounded-2xl shadow-md p-4 ${
          isDark 
            ? 'bg-[#0F1535] border border-[#1a2040]' 
            : 'bg-white border border-gray-100'
        }`}>
          <Award className={`w-5 h-5 mb-2 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
          <div className={`text-2xl mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            90%
          </div>
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Best Day (Sat)
          </div>
        </Card>
      </div>
    </div>
  );
}
