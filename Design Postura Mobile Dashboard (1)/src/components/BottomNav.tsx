import { Home, TrendingUp, Users, Settings, Search } from "lucide-react";
import { useTheme } from "./ThemeContext";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onAIAgentClick?: () => void;
}

export function BottomNav({ activeTab, onTabChange, onAIAgentClick }: BottomNavProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const leftTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
  ];

  const rightTabs = [
    { id: 'friends', label: 'Friends', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <nav className={`fixed bottom-0 left-0 right-0 safe-area-pb shadow-lg ${
      isDark 
        ? 'bg-[#0F1535] border-t border-[#1a2040]' 
        : 'bg-white border-t border-gray-200'
    }`}>
      <div className="max-w-md mx-auto flex justify-around items-center h-20 px-4 relative">
        {/* Left tabs */}
        {leftTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 transition-colors ${
                isActive 
                  ? (isDark ? 'text-blue-400' : 'text-blue-600')
                  : (isDark ? 'text-gray-500' : 'text-gray-400')
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs">{tab.label}</span>
            </button>
          );
        })}

        {/* Center AI Agent Button */}
        <div className="flex-1 flex justify-center">
          <button
            onClick={onAIAgentClick}
            className={`w-14 h-14 rounded-full flex items-center justify-center -mt-8 shadow-lg transition-all hover:scale-105 ${
              isDark 
                ? 'bg-blue-500 hover:bg-blue-600' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Search className="w-7 h-7 text-white" strokeWidth={2.5} />
          </button>
        </div>

        {/* Right tabs */}
        {rightTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 transition-colors ${
                isActive 
                  ? (isDark ? 'text-blue-400' : 'text-blue-600')
                  : (isDark ? 'text-gray-500' : 'text-gray-400')
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
