import { Card } from "./ui/card";
import { Trophy, Award, Target, Star } from "lucide-react";

interface AchievementsCardProps {
  timestamp: string;
}

export function AchievementsCard({
  timestamp,
}: AchievementsCardProps) {
  const achievements = [
    {
      icon: Trophy,
      label: "7 Day Streak",
      unlocked: true,
      color: "text-yellow-500 bg-yellow-50",
    },
    {
      icon: Award,
      label: "Perfect Week",
      unlocked: true,
      color: "text-blue-500 bg-blue-50",
    },
    {
      icon: Target,
      label: "100 Hours",
      unlocked: false,
      color: "text-gray-300 bg-gray-50",
    },
    {
      icon: Star,
      label: "30 Day Master",
      unlocked: false,
      color: "text-gray-300 bg-gray-50",
    },
  ];

  return (
    <Card className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-start justify-between mb-6">
        <h2>Achievements</h2>
        <span className="text-sm text-gray-400">
          {timestamp}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {achievements.map((achievement, index) => {
          const Icon = achievement.icon;
          return (
            <div
              key={index}
              className="flex flex-col items-center gap-2"
            >
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center ${achievement.color}`}
              >
                <Icon className="w-7 h-7" />
              </div>
              <span
                className={`text-xs text-center leading-tight ${achievement.unlocked ? "text-gray-700" : "text-gray-400"}`}
              >
                {achievement.label}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}