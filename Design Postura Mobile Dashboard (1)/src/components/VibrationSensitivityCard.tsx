import { Card } from "./ui/card";
import { Slider } from "./ui/slider";
import { useState } from "react";

interface VibrationSensitivityCardProps {
  timestamp: string;
}

export function VibrationSensitivityCard({ timestamp }: VibrationSensitivityCardProps) {
  const [sensitivity, setSensitivity] = useState([60]);

  return (
    <Card className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-start justify-between mb-6">
        <h2>Vibration Sensitivity</h2>
        <span className="text-sm text-gray-400">{timestamp}</span>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Low</span>
          <span className="text-2xl">{sensitivity[0]}%</span>
          <span className="text-sm text-gray-600">High</span>
        </div>
        <Slider
          value={sensitivity}
          onValueChange={setSensitivity}
          max={100}
          step={1}
          className="w-full"
        />
        <p className="text-xs text-gray-500 text-center mt-4">
          Adjust how strongly the necklace vibrates when poor posture is detected
        </p>
      </div>
    </Card>
  );
}
