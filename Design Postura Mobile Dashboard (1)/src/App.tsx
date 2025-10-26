import { useState } from "react";
import { MinimalistPostureSummary } from "./components/MinimalistPostureSummary";
import { TodayStatsCard } from "./components/TodayStatsCard";
import { QuickActionsCard } from "./components/QuickActionsCard";
import { FriendsLeaderboard } from "./components/FriendsLeaderboard";
import { SettingsScreen } from "./components/SettingsScreen";
import { ProgressScreen } from "./components/ProgressScreen";
import { BottomNav } from "./components/BottomNav";
import { ThemeProvider, useTheme } from "./components/ThemeContext";
import { Moon, Sun } from "lucide-react";

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === 'dark';

  const handleAIAgentClick = () => {
    // TODO: Implement AI Agent functionality
    console.log('AI Agent clicked');
    alert('AI Agent feature coming soon!');
  };

  return (
    <div className={`min-h-screen pb-24 ${isDark ? 'bg-[#0A0E27]' : 'bg-gray-50'}`}>
      {/* Header - hide for friends tab */}
      {activeTab !== 'friends' && (
        <header className={`shadow-sm ${isDark ? 'bg-[#0F1535] border-b border-[#1a2040]' : 'bg-[#1E293B]'}`}>
          <div className="max-w-md mx-auto px-6 py-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl text-white">Postura</h1>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-blue-200'}`}>Saturday, October 25</p>
            </div>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-colors ${
                isDark ? 'bg-[#1a2040] hover:bg-[#222b50] text-blue-400' : 'bg-slate-700 hover:bg-slate-600 text-yellow-300'
              }`}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={`max-w-md mx-auto ${activeTab === 'friends' ? '' : 'px-6 py-8'} space-y-6`}>
        {activeTab === 'dashboard' && (
          <>
            <MinimalistPostureSummary percentage={78} />
            <TodayStatsCard />
            <QuickActionsCard onSettingsClick={() => setActiveTab('settings')} />
          </>
        )}

        {activeTab === 'progress' && (
          <ProgressScreen />
        )}

        {activeTab === 'friends' && (
          <FriendsLeaderboard />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onAIAgentClick={handleAIAgentClick}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function TrendingUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}
