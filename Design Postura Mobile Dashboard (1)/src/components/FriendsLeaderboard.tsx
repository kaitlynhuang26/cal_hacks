import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { UserPlus, TrendingDown } from "lucide-react";
import { useTheme } from "./ThemeContext";

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  initials: string;
  isCurrentUser?: boolean;
}

export function FriendsLeaderboard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const leaderboard: LeaderboardEntry[] = [
    { rank: 1, name: "Kaitlyn", score: 94, initials: "KM" },
    { rank: 2, name: "Sophie", score: 88, initials: "SL" },
    { rank: 3, name: "Kevin", score: 82, initials: "KW" },
    { rank: 4, name: "Lina", score: 76, initials: "LR", isCurrentUser: true },
    { rank: 5, name: "Aria", score: 72, initials: "AC" },
    { rank: 6, name: "Marcus", score: 68, initials: "MJ" },
  ];

  const worstSlouchersList = [
    { rank: 1, name: "Tyler", score: 32, initials: "TM", tag: "Certified Pretzel 🥨" },
    { rank: 2, name: "Brandon", score: 28, initials: "BC", tag: "Chair Potato 🪑" },
    { rank: 3, name: "Jake", score: 24, initials: "JR", tag: "Neckflix Binger 📺" },
  ];

  const activities = [
    { emoji: "🔥", text: "Sophie hit a 5-day streak!" },
    { emoji: "💪", text: "Kevin improved his posture by 12%!" },
    { emoji: "🎉", text: "Aria unlocked 'Perfect Posture Day!'" },
  ];

  const getMedal = (rank: number) => {
    switch (rank) {
      case 1: return "🥇";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return null;
    }
  };

  const getAvatarColor = (index: number) => {
    const colors = [
      "bg-purple-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-pink-500",
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`px-6 pt-6 py-8 -mt-6 ${
        isDark ? 'bg-[#0F1535]' : 'bg-[#1E293B]'
      }`}>
        <h1 className="text-3xl text-white">Leaderboard</h1>
        <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-blue-200'}`}>
          See who's maintaining the best posture this week.
        </p>
      </div>

      {/* Weekly Leaderboard - Podium Style */}
      <div className="px-6 -mt-2">
        <Card className={`rounded-2xl shadow-md p-5 ${
          isDark 
            ? 'bg-[#0F1535] border border-[#1a2040]' 
            : 'bg-white border border-gray-100'
        }`}>
          <h2 className={`mb-5 ${isDark ? 'text-white' : 'text-gray-900'}`}>Weekly Leaderboard</h2>
          
          {/* Podium - Top 3 */}
          <div className="flex items-end justify-center gap-3 mb-6">
            {/* 2nd Place */}
            <div className="flex flex-col items-center flex-1">
              <Avatar className="h-14 w-14 bg-blue-500 mb-2 ring-2 ring-gray-300">
                <AvatarFallback className="text-white">
                  {leaderboard[1].initials}
                </AvatarFallback>
              </Avatar>
              <div className={`text-sm mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {leaderboard[1].name}
              </div>
              <div className={`text-xs mb-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                {leaderboard[1].score}%
              </div>
              <div className={`w-full rounded-t-lg pt-6 pb-3 flex flex-col items-center ${
                isDark ? 'bg-gray-600' : 'bg-gray-300'
              }`}>
                <span className="text-3xl">🥈</span>
                <span className={`text-xs mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>#2</span>
              </div>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center flex-1">
              <Avatar className="h-16 w-16 bg-purple-500 mb-2 ring-4 ring-yellow-400">
                <AvatarFallback className="text-white">
                  {leaderboard[0].initials}
                </AvatarFallback>
              </Avatar>
              <div className={`text-sm mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {leaderboard[0].name}
              </div>
              <div className={`text-xs mb-2 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                {leaderboard[0].score}%
              </div>
              <div className={`w-full rounded-t-lg pt-8 pb-3 flex flex-col items-center ${
                isDark ? 'bg-yellow-600' : 'bg-yellow-400'
              }`}>
                <span className="text-3xl">🥇</span>
                <span className={`text-xs mt-1 ${isDark ? 'text-yellow-100' : 'text-yellow-800'}`}>#1</span>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center flex-1">
              <Avatar className="h-14 w-14 bg-green-500 mb-2 ring-2 ring-orange-300">
                <AvatarFallback className="text-white">
                  {leaderboard[2].initials}
                </AvatarFallback>
              </Avatar>
              <div className={`text-sm mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {leaderboard[2].name}
              </div>
              <div className={`text-xs mb-2 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                {leaderboard[2].score}%
              </div>
              <div className={`w-full rounded-t-lg pt-4 pb-3 flex flex-col items-center ${
                isDark ? 'bg-orange-700' : 'bg-orange-400'
              }`}>
                <span className="text-3xl">🥉</span>
                <span className={`text-xs mt-1 ${isDark ? 'text-orange-100' : 'text-orange-800'}`}>#3</span>
              </div>
            </div>
          </div>

          {/* Rankings 4-6 */}
          <div className="space-y-2">
            {leaderboard.slice(3, 6).map((entry, index) => {
              return (
                <div
                  key={entry.rank}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    entry.isCurrentUser
                      ? (isDark 
                          ? "bg-[#1a2555] ring-2 ring-blue-500 ring-opacity-50"
                          : "bg-blue-50 ring-2 ring-blue-400 ring-opacity-50")
                      : (isDark ? "bg-[#1a2040]" : "bg-gray-50")
                  }`}
                >
                  {/* Rank */}
                  <div className="w-6 text-center">
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{entry.rank}</span>
                  </div>

                  {/* Avatar */}
                  <Avatar className={`h-10 w-10 ${getAvatarColor(index + 3)}`}>
                    <AvatarFallback className="text-white text-sm">
                      {entry.initials}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name */}
                  <div className="flex-1">
                    <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {entry.name}
                      {entry.isCurrentUser && (
                        <span className="text-xs text-gray-500 ml-2">(You)</span>
                      )}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{entry.score}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Worst Slouchers */}
      <div className="px-6">
        <Card className={`rounded-2xl shadow-md p-5 ${
          isDark 
            ? 'bg-[#0F1535] border border-[#1a2040]' 
            : 'bg-white border border-gray-100'
        }`}>
          <h2 className={`mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            😬 Worst Slouchers
          </h2>
          <p className={`text-sm mb-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            These legends are carrying the weight of bad posture.
          </p>
          
          <div className="space-y-2">
            {worstSlouchersList.map((entry, index) => {
              const medals = ["🥇", "🥈", "🥉"];
              return (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    isDark 
                      ? "bg-gradient-to-r from-red-950/40 to-red-900/20 border border-red-900/30" 
                      : "bg-gradient-to-r from-red-50 to-orange-50 border border-red-100"
                  }`}
                >
                  {/* Medal */}
                  <div className="w-6 text-center">
                    <span className="text-lg">{medals[index]}</span>
                  </div>

                  {/* Avatar */}
                  <Avatar className={`h-10 w-10 ${isDark ? 'bg-red-600' : 'bg-red-400'}`}>
                    <AvatarFallback className="text-white text-sm">
                      {entry.initials}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name & Tag */}
                  <div className="flex-1">
                    <div className={`text-sm mb-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {entry.name}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-red-300' : 'text-red-600'}`}>
                      {entry.tag}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                      {entry.score}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className={`mt-4 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Better luck next stretch 💪
          </div>
        </Card>
      </div>

      {/* Friend Activity Feed */}
      <div className="px-6">
        <Card className={`rounded-2xl shadow-md p-6 ${
          isDark 
            ? 'bg-[#0F1535] border border-[#1a2040]' 
            : 'bg-white border border-gray-100'
        }`}>
          <h2 className={`mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Recent Activity</h2>
          <div className="space-y-3">
            {activities.map((activity, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  isDark ? 'bg-[#1a2040]' : 'bg-gray-50'
                }`}
              >
                <span className="text-xl">{activity.emoji}</span>
                <p className={`text-sm pt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{activity.text}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Invite Friends Button */}
      <div className="px-6">
        <Button className={`w-full h-14 text-white rounded-xl shadow-md ${
          isDark 
            ? 'bg-blue-500 hover:bg-blue-600' 
            : 'bg-blue-600 hover:bg-blue-700'
        }`}>
          <UserPlus className="w-5 h-5 mr-2" />
          Invite a Friend
        </Button>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6 text-center">
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Keep your streak alive to climb the leaderboard 💪
        </p>
      </div>
    </div>
  );
}
