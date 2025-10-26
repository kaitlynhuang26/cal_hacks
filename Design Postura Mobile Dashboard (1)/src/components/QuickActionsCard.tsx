import { Card } from "./ui/card";
import { Settings, Bell, Activity } from "lucide-react";
import { useTheme } from "./ThemeContext";

interface QuickActionsCardProps {
  onSettingsClick?: () => void;
}

export function QuickActionsCard({ onSettingsClick }: QuickActionsCardProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <Card className={`rounded-3xl shadow-md p-6 ${
      isDark 
        ? 'bg-[#0F1535] border border-[#1a2040]' 
        : 'bg-white border border-gray-100'
    }`}>
      <h3 className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Quick Actions</h3>
      <div className="grid grid-cols-3 gap-3">
        <button className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-colors ${
          isDark 
            ? 'bg-[#1a2040] hover:bg-[#222b50]' 
            : 'bg-gray-50 hover:bg-gray-100'
        }`}>
          <Activity className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Calibrate</span>
        </button>
        <button className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-colors ${
          isDark 
            ? 'bg-[#1a2040] hover:bg-[#222b50]' 
            : 'bg-gray-50 hover:bg-gray-100'
        }`}>
          <Bell className={`w-6 h-6 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
          <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Alerts</span>
        </button>
        <button 
          onClick={onSettingsClick}
          className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-colors ${
            isDark 
              ? 'bg-[#1a2040] hover:bg-[#222b50]' 
              : 'bg-gray-50 hover:bg-gray-100'
          }`}
        >
          <Settings className={`w-6 h-6 ${isDark ? 'text-indigo-400' : 'text-blue-600'}`} />
          <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Settings</span>
        </button>
      </div>
    </Card>
  );
}
