import { useState } from "react";
import { useTheme } from "./ThemeContext";
import { User, Calendar as CalendarIcon, Edit2, Mail, Cake } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { format } from "date-fns";

export function SettingsScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // State
  const [name, setName] = useState("Richard Wang");
  const [email, setEmail] = useState("richard.wang@postura.app");
  const [age, setAge] = useState(28);
  const [birthday, setBirthday] = useState<Date>(new Date(1996, 5, 15));
  const [durationThreshold, setDurationThreshold] = useState([5]);
  const [vibrationSensitivity, setVibrationSensitivity] = useState([18]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  return (
    <div className="space-y-6">

      {/* Personal Info Card */}
      <div className={`rounded-2xl p-8 shadow-sm ${
        isDark 
          ? 'bg-[#0F1535] border border-[#1a2040]' 
          : 'bg-white'
      }`}>
          {/* Profile Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <Avatar className="w-24 h-24 mb-4 ring-4 ring-blue-500/20">
              <AvatarImage src="https://images.unsplash.com/photo-1585923491671-0ced430efe9c?w=200&h=200&fit=crop&crop=faces" />
              <AvatarFallback className={`${isDark ? 'bg-blue-500' : 'bg-blue-600'} text-white text-2xl`}>RW</AvatarFallback>
            </Avatar>
            
            <h3 className={`text-2xl mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {name}
            </h3>
            <div className={`flex items-center gap-2 text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <Mail className="w-4 h-4" />
              <span>{email}</span>
            </div>
            <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <Cake className="w-4 h-4" />
              <span>{format(birthday, "MMMM d, yyyy")} • Age {age}</span>
            </div>
          </div>

          {/* Birthday Picker */}
          <div className="mb-6">
            <Label className={`text-sm mb-3 block ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Update Birthday
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start text-left ${
                    isDark 
                      ? 'bg-[#1a2040] border-[#2a3550] text-white hover:bg-[#222b50] hover:text-white' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {birthday ? format(birthday, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={birthday}
                  onSelect={(date) => date && setBirthday(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

        {/* Edit Profile Button */}
        <Button
          onClick={() => setIsEditingProfile(!isEditingProfile)}
          className={`w-full ${
            isDark 
              ? 'bg-blue-500 hover:bg-blue-600' 
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white shadow-md`}
        >
          <Edit2 className="w-4 h-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      {/* Divider */}
      <div className={`h-px ${isDark ? 'bg-[#1a2040]' : 'bg-gray-200'}`} />

      {/* Device Settings Card */}
      <div className={`rounded-2xl p-6 shadow-sm ${
        isDark 
          ? 'bg-[#0F1535] border border-[#1a2040]' 
          : 'bg-white'
      }`}>
          <h3 className={`text-lg mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Device Settings
          </h3>

        {/* Duration Threshold */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Duration Threshold
            </Label>
            <span className={`text-sm px-3 py-1 rounded-full ${
              isDark 
                ? 'bg-[#1a2040] text-blue-400' 
                : 'bg-blue-50 text-blue-600'
            }`}>
              {durationThreshold[0]}s
            </span>
          </div>
          <Slider
            value={durationThreshold}
            onValueChange={setDurationThreshold}
            min={3}
            max={15}
            step={1}
            className="w-full"
          />
          <div className="flex items-center justify-between mt-2">
            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              3s
            </span>
            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              15s
            </span>
          </div>
        </div>

        {/* Vibration Sensitivity */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <Label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Vibration Sensitivity
            </Label>
            <span className={`text-sm px-3 py-1 rounded-full ${
              isDark 
                ? 'bg-[#1a2040] text-blue-400' 
                : 'bg-blue-50 text-blue-600'
            }`}>
              {vibrationSensitivity[0]}°
            </span>
          </div>
          <Slider
            value={vibrationSensitivity}
            onValueChange={setVibrationSensitivity}
            min={10}
            max={25}
            step={1}
            className="w-full"
          />
          <div className="flex items-center justify-between mt-2">
            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              10°
            </span>
            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              25°
            </span>
          </div>
        </div>
      </div>

      {/* About Section - Compact */}
      <div className={`rounded-2xl p-4 shadow-sm ${
        isDark 
          ? 'bg-[#0F1535] border border-[#1a2040]' 
          : 'bg-white'
      }`}>
        <h3 className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          About
        </h3>
        <div className="space-y-2">
          <button className={`w-full text-left text-sm py-1.5 px-2 rounded transition-colors ${
            isDark ? 'hover:bg-[#1a2040] text-gray-300' : 'hover:bg-gray-50 text-gray-700'
          }`}>
            Privacy Policy
          </button>
          <button className={`w-full text-left text-sm py-1.5 px-2 rounded transition-colors ${
            isDark ? 'hover:bg-[#1a2040] text-gray-300' : 'hover:bg-gray-50 text-gray-700'
          }`}>
            Terms of Service
          </button>
          <div className={`text-xs py-1.5 px-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            Version 1.0.0
          </div>
        </div>
      </div>
    </div>
  );
}
