import { Card } from "./ui/card";
import { AlertCircle } from "lucide-react";

interface SlouchAlertsCardProps {
  alertCount: number;
  timestamp: string;
}

export function SlouchAlertsCard({ alertCount, timestamp }: SlouchAlertsCardProps) {
  return (
    <Card className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-start justify-between mb-6">
        <h2>Slouch Alerts</h2>
        <span className="text-sm text-gray-400">{timestamp}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-50">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <div className="flex-1">
          <div className="text-4xl text-red-500">{alertCount}</div>
          <div className="text-sm text-gray-500 mt-1">alerts today</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
        <div>
          <div className="text-xl">12</div>
          <div className="text-xs text-gray-500 mt-1">avg this week</div>
        </div>
        <div>
          <div className="text-xl text-green-500">-4</div>
          <div className="text-xs text-gray-500 mt-1">vs last week</div>
        </div>
      </div>
    </Card>
  );
}
