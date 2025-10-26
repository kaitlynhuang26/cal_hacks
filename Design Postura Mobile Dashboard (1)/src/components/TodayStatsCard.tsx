import { Card } from "./ui/card";
import { TrendingDown, Zap } from "lucide-react";
import { useTheme } from "./ThemeContext";

export function TodayStatsCard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Slouch Alerts */}
      <Card className={`rounded-3xl shadow-md p-6 ${
        isDark 
          ? 'bg-[#0F1535] border border-[#1a2040]' 
          : 'bg-white border border-gray-100'
      }`}>
        <div className="flex flex-col h-full justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Slouch Alerts</span>
            <TrendingDown className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-blue-500'}`} />
          </div>
          <div>
            <div className={`text-4xl mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>8</div>
            <div className="text-xs text-gray-500">-4 from yesterday</div>
          </div>
        </div>
      </Card>

      {/* Active Streak */}
      <Card className={`rounded-3xl shadow-md p-6 ${
        isDark 
          ? 'bg-[#0F1535] border border-[#1a2040]' 
          : 'bg-white border border-gray-100'
      }`}>
        <div className="flex flex-col h-full justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Active Streak</span>
            <Zap className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
          </div>
          <div>
            <div className={`text-4xl mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>6</div>
            <div className="text-xs text-gray-500">days in a row</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
