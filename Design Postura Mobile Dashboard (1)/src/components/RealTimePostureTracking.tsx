import { useState, useEffect } from "react";
import { useTheme } from "./ThemeContext";
import { Card } from "./ui/card";

type PostureStatus = "excellent" | "warning" | "poor";

interface PostureData {
  percentage: number;
  status: PostureStatus;
}

export function RealTimePostureTracking() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [postureData, setPostureData] = useState<PostureData>({
    percentage: 82,
    status: "excellent"
  });

  // Connect to WebSocket for real-time updates
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws');
    
    ws.onopen = () => {
      console.log('Connected to posture tracking WebSocket');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const az = data.az || 0;
        
        // Convert az value (0-128) to percentage (0-100)
        // We'll invert the percentage because higher az means more slouching
        const percentage = Math.max(0, Math.min(100, Math.round((1 - az / 128) * 100)));
        let status: PostureStatus;
        
        if (percentage >= 75) {
          status = "excellent";
        } else if (percentage >= 50) {
          status = "warning";
        } else {
          status = "poor";
        }

        setPostureData({
          percentage,
          status
        });
      } catch (error) {
        console.error('Error parsing WebSocket data:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('Disconnected from posture tracking WebSocket');
    };

    // Clean up WebSocket connection when component unmounts
    return () => {
      ws.close();
    };
  }, []);

  const getBackgroundColor = () => {
    switch (postureData.status) {
      case "excellent":
        return isDark ? "#10b981" : "#10b981"; // green
      case "warning":
        return isDark ? "#f59e0b" : "#f59e0b"; // yellow/orange
      case "poor":
        return isDark ? "#ef4444" : "#ef4444"; // red
    }
  };

  const getStatusText = () => {
    switch (postureData.status) {
      case "excellent":
        return "Straight";
      case "warning":
        return "Slightly Slouching";
      case "poor":
        return "Slouching";
    }
  };

  return (
    <Card className={`rounded-2xl shadow-md overflow-hidden ${
      isDark 
        ? 'border border-[#1a2040]' 
        : 'border border-gray-100'
    }`}>
      {/* Colored Rectangle Box */}
      <div 
        className="flex flex-col items-center justify-center py-16 px-6 transition-colors duration-500"
        style={{ backgroundColor: getBackgroundColor() }}
      >
        <div className="text-7xl text-white mb-3">
          {postureData.percentage}%
        </div>
        <div className="text-2xl text-white mb-6">
          {getStatusText()}
        </div>
        
        {/* Live Indicator */}
        <div className="flex items-center gap-2 mt-2">
          <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
          <span className="text-sm text-white">Live Tracking</span>
        </div>
      </div>
    </Card>
  );
}
