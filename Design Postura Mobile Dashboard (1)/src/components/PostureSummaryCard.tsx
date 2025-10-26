import { Card } from "./ui/card";
import { CircularProgress } from "./CircularProgress";

interface PostureSummaryCardProps {
  percentage: number;
  timestamp: string;
}

export function PostureSummaryCard({ percentage, timestamp }: PostureSummaryCardProps) {
  return (
    <Card className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-start justify-between mb-6">
        <h2>Posture Summary</h2>
        <span className="text-sm text-gray-400">{timestamp}</span>
      </div>
      <div className="flex flex-col items-center">
        <CircularProgress percentage={percentage} />
        <div className="grid grid-cols-3 gap-6 w-full mt-8">
          <div className="text-center">
            <div className="text-2xl text-green-500">6.2</div>
            <div className="text-xs text-gray-500 mt-1">hrs good</div>
          </div>
          <div className="text-center">
            <div className="text-2xl text-yellow-500">1.3</div>
            <div className="text-xs text-gray-500 mt-1">hrs fair</div>
          </div>
          <div className="text-center">
            <div className="text-2xl text-red-500">0.5</div>
            <div className="text-xs text-gray-500 mt-1">hrs poor</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
