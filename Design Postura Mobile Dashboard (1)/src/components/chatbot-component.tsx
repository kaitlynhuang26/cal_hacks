import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "./ThemeContext";
import { X, Send, Sparkles } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface ChatBotProps {
  onClose: () => void;
}

export function ChatBot({ onClose }: ChatBotProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! I'm your Postura AI assistant. I can help you with posture tips, analyze your progress, or answer questions about your health metrics. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    try {
      // Call the Flask backend API
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputText }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Add bot response
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: "bot",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error calling API:', error);
      
      // Fallback response on error
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble connecting to the posture data. Please make sure the backend server is running and try again.",
        sender: "bot",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Chat Container */}
      <div className={`relative w-full max-w-md h-[85vh] rounded-t-3xl shadow-2xl flex flex-col ${
        isDark ? 'bg-[#0A0E27]' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 rounded-t-3xl ${
          isDark ? 'bg-[#0F1535] border-b border-[#1a2040]' : 'bg-blue-600'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isDark ? 'bg-blue-500' : 'bg-blue-500'
            }`}>
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white">Postura AI</h2>
              <p className="text-xs text-blue-200">Always here to help</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.sender === "user"
                    ? isDark
                      ? "bg-blue-600 text-white"
                      : "bg-blue-600 text-white"
                    : isDark
                    ? "bg-[#0F1535] text-white border border-[#1a2040]"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <p className="text-sm leading-relaxed">{message.text}</p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div
                className={`rounded-2xl px-4 py-3 ${
                  isDark
                    ? "bg-[#0F1535] border border-[#1a2040]"
                    : "bg-gray-100"
                }`}
              >
                <div className="flex gap-1">
                  <div className={`w-2 h-2 rounded-full animate-bounce ${
                    isDark ? 'bg-gray-500' : 'bg-gray-400'
                  }`} style={{ animationDelay: "0ms" }} />
                  <div className={`w-2 h-2 rounded-full animate-bounce ${
                    isDark ? 'bg-gray-500' : 'bg-gray-400'
                  }`} style={{ animationDelay: "150ms" }} />
                  <div className={`w-2 h-2 rounded-full animate-bounce ${
                    isDark ? 'bg-gray-500' : 'bg-gray-400'
                  }`} style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className={`px-6 py-4 border-t ${
          isDark ? 'border-[#1a2040] bg-[#0F1535]' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center gap-2">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              className={`flex-1 rounded-full ${
                isDark 
                  ? 'bg-[#1a2040] border-[#2a3050] text-white placeholder:text-gray-500' 
                  : 'bg-white border-gray-200'
              }`}
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                inputText.trim()
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : isDark
                  ? 'bg-[#1a2040] text-gray-600'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
