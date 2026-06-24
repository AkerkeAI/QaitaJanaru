"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../components/Sidebar";
import { useLanguage } from "../contexts/LanguageContext";
import { searchRecyclingPoints, buildRoute } from "../lib/recyclingSearch";
import { translateWasteType } from "../lib/wasteTranslations";
import type { RecyclingPoint } from "../data/recyclingPoints";

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
  recyclingPoints?: RecyclingPoint[];
}

export default function EcoAssistantPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { messages: translations, language } = useLanguage();

  useEffect(() => {
    const userId = localStorage.getItem("qaitaJanaru_user_id");
    if (!userId) {
      router.push("/login");
      return;
    }

    // Load chat history from backend
    const loadChatHistory = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/history/${userId}`);
        if (response.ok) {
          const data = await response.json();
          const messages = data.messages.map((msg: any) => ({
            id: msg.id,
            text: msg.text,
            isUser: msg.is_user,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(messages);
        }
      } catch (error) {
        console.error("Failed to load chat history:", error);
        // Fallback to localStorage if backend fetch fails
        const savedHistory = localStorage.getItem(`qaitaJanaru_chat_history_${userId}`);
        if (savedHistory) {
          try {
            const parsedMessages = JSON.parse(savedHistory).map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }));
            setMessages(parsedMessages);
          } catch (e) {
            console.error("Failed to parse chat history:", e);
          }
        }
      }
    };

    loadChatHistory();
  }, [router]);

  // Save chat history to localStorage as backup (user-specific key with user_id)
  useEffect(() => {
    const userId = localStorage.getItem("qaitaJanaru_user_id");
    if (messages.length > 0 && userId) {
      localStorage.setItem(`qaitaJanaru_chat_history_${userId}`, JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Check if the query is about recycling locations
  const isRecyclingQuery = (text: string): boolean => {
    const recyclingKeywords = [
      "recycle", "recycling", "where", "куда", "где", "қайда", "тәуелсіз",
      "пункт", "пункты", "центр", "центры", "ortaq", "point", "points", "center", "centers",
      "сдать", "throw", "dispose", "утилизировать", "тастау", "тапсыру"
    ];
    return recyclingKeywords.some(keyword => text.toLowerCase().includes(keyword));
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userId = localStorage.getItem("qaitaJanaru_user_id");
    if (!userId) {
      router.push("/login");
      return;
    }

    const userMessage: Message = {
      id: Date.now(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    
    setMessages(updatedMessages);
    setInputText("");
    setIsTyping(true);

    // Check if this is a recycling location query
    if (isRecyclingQuery(text)) {
      const matchingPoints = searchRecyclingPoints(text);
      const assistantMessage: Message = {
        id: Date.now() + 1,
        text: matchingPoints.length > 0 
          ? (language === "ru" ? "Вот несколько пунктов переработки, которые могут вам подойти:" 
            : language === "kz" ? "Мұнды сәйкес келетін қайта өңдеу орталықтары:" 
            : "Here are some recycling locations that might interest you:")
          : (language === "ru" ? translations.recyclingMap.noLocationsFound 
            : language === "kz" ? translations.recyclingMap.noLocationsFound 
            : translations.recyclingMap.noLocationsFound),
        isUser: false,
        timestamp: new Date(),
        recyclingPoints: matchingPoints.length > 0 ? matchingPoints : undefined,
      };

      setMessages([...updatedMessages, assistantMessage]);
      setIsTyping(false);
      return;
    }

    try {
      // Save user message to backend
      try {
        await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/chat/message/${userId}/user?message_text=${encodeURIComponent(text.trim())}`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  }
);
      } catch (error) {
        console.error("Failed to save user message to backend:", error);
      }

      // Get user profile data from localStorage
      const profile = {
        name: localStorage.getItem("qaitaJanaru_name") || "Unknown",
        city: localStorage.getItem("qaitaJanaru_city") || "Unknown",
        ecoPoints: parseInt(localStorage.getItem("qaitaJanaru_eco_points") || "0", 10),
        streak: parseInt(localStorage.getItem("qaitaJanaru_streak") || "0", 10),
        achievementsCount: parseInt(localStorage.getItem("qaitaJanaru_achievements_count") || "0", 10),
        level: parseInt(localStorage.getItem("qaitaJanaru_level") || "0", 10) || "Unknown",
        totalScans: parseInt(localStorage.getItem("qaitaJanaru_total_scans") || "0", 10)
      };

      // Keep only last 10 messages to reduce token usage
      const recentMessages = updatedMessages.slice(-10);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          history: recentMessages.map(msg => ({
            role: msg.isUser ? "user" : "model",
            text: msg.text
          })),
          profile
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();

        console.error("CHAT API ERROR");
        console.error("STATUS:", response.status);
        console.error("BODY:", errorText);

        throw new Error(`Failed: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: Date.now() + 1,
        text: data.response || translations.ecoAssistant.responseDefault,
        isUser: false,
        timestamp: new Date(),
      };
      
      // Save assistant message to backend
      try {
        await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/chat/message/${userId}/assistant?message_text=${encodeURIComponent(data.response)}`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  }
);
      } catch (error) {
        console.error("Failed to save assistant message to backend:", error);
      }

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const assistantMessage: Message = {
        id: Date.now() + 1,
        text: translations.ecoAssistant.responseDefault,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputText(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  const handleClearChat = async () => {
    const userId = localStorage.getItem("qaitaJanaru_user_id");
    
    // Clear from backend
    if (userId) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/history/${userId}`, {
  method: "DELETE",
});
      } catch (error) {
        console.error("Failed to clear chat history from backend:", error);
      }
    }

    // Clear from frontend
    setMessages([]);
    if (userId) {
      localStorage.removeItem(`qaitaJanaru_chat_history_${userId}`);
    }
  };

  // Convert audio blob to WAV format
  const convertToWav = async (audioBlob: Blob): Promise<Blob> => {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioContext = new AudioContext({ sampleRate: 16000 });
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const numberOfChannels = 1;
    const length = audioBuffer.length;
    const sampleRate = audioBuffer.sampleRate;
    const buffer = audioBuffer.getChannelData(0);

    const wavBuffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(wavBuffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, length * 2, true);

    // Write audio data
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, buffer[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }

    return new Blob([wavBuffer], { type: "audio/wav" });
  };

  const handleVoiceButtonClick = async () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    if (isProcessing) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        setIsProcessing(true);
        setIsRecording(false);
        setRecordingDuration(0);

        try {
          // Convert to WAV format
          const wavBlob = await convertToWav(audioBlob);
          
          // Send to transcription endpoint
          const formData = new FormData();
          formData.append("audio", wavBlob, "recording.wav");

          const response = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Transcription failed");
          }

          const data = await response.json();
          setInputText(data.text || "");
        } catch (error) {
          console.error("Transcription error:", error);
          alert("Transcription failed. Please try again.");
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingDuration(0);

      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= 30) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (error) {
      console.error("Microphone access error:", error);
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          alert("Microphone permission denied. Please enable microphone access in your browser settings.");
        } else if (error.name === "NotFoundError") {
          alert("No microphone found. Please connect a microphone and try again.");
        } else {
          alert("Failed to access microphone. Please try again.");
        }
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  return (
    <main className="h-screen text-white relative overflow-hidden bg-gradient-to-br from-emerald-950 via-green-900 to-cyan-950 flex flex-col">
      {/* Animated background orbs */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[120px] animate-pulse"></div>
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-cyan-500/10 blur-[100px] animate-pulse delay-1000"></div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-green-500/5 blur-[80px] animate-pulse delay-500"></div>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Fixed Header */}
      <header className="flex-shrink-0 flex items-center justify-between p-4 md:p-6 lg:p-8 relative z-10">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:scale-105 transition-all duration-300 shadow-lg group flex-shrink-0"
          aria-label="Open menu"
        >
          <svg
            className="w-6 h-6 text-emerald-300 group-hover:text-white transition-colors"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-2xl md:text-3xl">🤖</span>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">{translations.common.appName}</h1>
        </div>

        <button
          onClick={handleClearChat}
          className="px-4 py-2 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:scale-105 transition-all duration-300 shadow-lg text-sm text-emerald-200 flex-shrink-0"
        >
          {translations.ecoAssistant.clearChat}
        </button>
      </header>

      {/* Scrollable Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 relative z-10">
        {/* Page Title */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 mb-4 shadow-lg">
            <span className="text-4xl">🤖</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">{translations.ecoAssistant.title}</h2>
          <p className="text-emerald-300 text-sm md:text-base">{translations.ecoAssistant.subtitle}</p>
        </div>

        {/* Welcome Card */}
        <div className="relative rounded-3xl overflow-hidden border border-emerald-500/30 backdrop-blur-xl bg-gradient-to-br from-emerald-950/80 via-green-900/70 to-cyan-950/80 p-6 mb-6">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-emerald-500/10 pointer-events-none"></div>
          <p className="text-emerald-100 text-sm md:text-base relative z-10">{translations.ecoAssistant.welcomeMessage}</p>
        </div>

        {/* Chat Messages */}
        <div className="space-y-4 pb-4">
          {messages.length === 0 && (
            <div className="text-center text-emerald-300 py-8">
              <p className="text-sm">Start a conversation by asking an environmental question</p>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.isUser
                    ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white"
                    : "bg-white/10 backdrop-blur-xl border border-white/10 text-emerald-100"
                }`}
              >
                <p className="text-sm md:text-base whitespace-pre-wrap">{message.text}</p>

                {/* Recycling Points */}
                {!message.isUser && message.recyclingPoints && message.recyclingPoints.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {message.recyclingPoints.slice(0, 5).map((point, idx) => (
                      <div key={idx} className="bg-black/20 rounded-xl p-3 space-y-2">
                        <p className="font-semibold text-emerald-50">{point.name}</p>
                        <p className="text-xs text-emerald-200">{point.address}, {point.city}</p>
                        <p className="text-xs text-emerald-300">
                          {translations.recyclingMap.acceptedMaterials}: {translateWasteType(point.waste_type, language)}
                        </p>
                        <button
                          onClick={() => buildRoute(point)}
                          className="mt-2 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg text-white text-xs font-semibold hover:scale-105 transition-transform"
                        >
                          {translations.recyclingMap.buildRoute}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Action Buttons */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => handleSuggestionClick(translations.ecoAssistant.suggestionPlastic)}
              className="px-4 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:scale-105 transition-all duration-300 text-sm text-emerald-200"
            >
              {translations.ecoAssistant.suggestionPlastic}
            </button>
            <button
              onClick={() => handleSuggestionClick(translations.ecoAssistant.suggestionBatteries)}
              className="px-4 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:scale-105 transition-all duration-300 text-sm text-emerald-200"
            >
              {translations.ecoAssistant.suggestionBatteries}
            </button>
            <button
              onClick={() => handleSuggestionClick(translations.ecoAssistant.suggestionReduceWaste)}
              className="px-4 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:scale-105 transition-all duration-300 text-sm text-emerald-200"
            >
              {translations.ecoAssistant.suggestionReduceWaste}
            </button>
            <button
              onClick={() => handleSuggestionClick(translations.ecoAssistant.suggestionClimateChange)}
              className="px-4 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:scale-105 transition-all duration-300 text-sm text-emerald-200"
            >
              {translations.ecoAssistant.suggestionClimateChange}
            </button>
            <button
              onClick={() => handleSuggestionClick(translations.ecoAssistant.suggestionStudents)}
              className="px-4 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:scale-105 transition-all duration-300 text-sm text-emerald-200"
            >
              {translations.ecoAssistant.suggestionStudents}
            </button>
            <button
              onClick={() => handleSuggestionClick(translations.ecoAssistant.suggestionHazardous)}
              className="px-4 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:scale-105 transition-all duration-300 text-sm text-emerald-200"
            >
              {translations.ecoAssistant.suggestionHazardous}
            </button>
          </div>
        </div>
      </div>

      {/* Fixed Input Area */}
      <div className="flex-shrink-0 px-4 pb-4 md:px-6 md:pb-6 lg:px-8 lg:pb-8 relative z-10">
        <div className="relative rounded-3xl overflow-hidden border border-emerald-500/30 backdrop-blur-xl bg-gradient-to-br from-emerald-950/80 via-green-900/70 to-cyan-950/80 p-4">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-emerald-500/10 pointer-events-none"></div>
          
          <div className="flex gap-3 relative z-10">
            <div className="flex-1 relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={translations.ecoAssistant.placeholder}
                className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-4 pr-24 md:pr-12 text-emerald-100 placeholder-emerald-400/50 resize-none focus:outline-none focus:border-emerald-500/50 transition-colors"
                rows={1}
                style={{ minHeight: "56px" }}
              />
              <button
                onClick={handleVoiceButtonClick}
                disabled={isProcessing}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all duration-300 ${
                  isRecording 
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                    : 'bg-transparent hover:bg-white/10 text-emerald-300 hover:text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={isRecording ? "Stop recording" : "Voice input"}
              >
                {isRecording ? (
                  <svg
                    className="w-5 h-5 animate-pulse"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : isProcessing ? (
                  <svg
                    className="w-5 h-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </button>
              
              {/* Recording indicator */}
              {isRecording && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  <span>{recordingDuration}s</span>
                </div>
              )}
              
              {/* Processing indicator */}
              {isProcessing && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs px-2 py-1 rounded-lg animate-in fade-in slide-in-from-bottom-2">
                  Processing...
                </div>
              )}
            </div>
            <button
              onClick={() => sendMessage(inputText)}
              disabled={!inputText.trim() || isTyping}
              className="px-6 py-4 md:px-6 md:py-4 rounded-2xl md:rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 transition-all duration-300 shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-white font-semibold whitespace-nowrap w-12 h-12 md:w-auto md:h-auto rounded-full md:rounded-2xl flex items-center justify-center"
              style={{ minHeight: "56px" }}
            >
              <svg className="w-5 h-5 md:hidden" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              <span className="hidden md:inline">{translations.ecoAssistant.send}</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
