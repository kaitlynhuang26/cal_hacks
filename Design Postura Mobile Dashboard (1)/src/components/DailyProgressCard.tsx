import { Card } from "./ui/card";
import { Progress } from "./ui/progress";

interface DailyProgressCardProps {
  timestamp: string;
}

export function DailyProgressCard({ timestamp }: DailyProgressCardProps) {
  const goals = [
    { label: "Good Posture Time", value: 77, target: "6/8 hrs", color: "bg-green-500" },
    { label: "Active Hours", value: 62, target: "5/8 hrs", color: "bg-blue-500" },
    { label: "Streak Days", value: 85, target: "6/7 days", color: "bg-purple-500" }
  ];

  return (
    <Card className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-start justify-between mb-6">
        <h2>Daily Progress</h2>
        <span className="text-sm text-gray-400">{timestamp}</span>
      </div>
      <div className="space-y-5">
        {goals.map((goal, index) => (
          <div key={index}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-700">{goal.label}</span>
              <span className="text-sm">{goal.target}</span>
            </div>
            <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`absolute h-full ${goal.color} rounded-full transition-all duration-500`}
                style={{ width: `${goal.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
