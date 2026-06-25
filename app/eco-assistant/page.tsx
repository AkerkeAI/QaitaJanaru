"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../components/Sidebar";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";
import { searchRecyclingPoints, buildRoute } from "../lib/recyclingSearch";
import { translateWasteType, preparationSteps } from "../lib/wasteTranslations";
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
  const { theme, colors } = useTheme();

  // Swipe gesture refs
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchEndX.current - touchStartX.current;
    if (diff > 50 && touchStartX.current < 50) {
      setSidebarOpen(true);
    }
  };

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

  // Check if the query is about recycling locations or what to do with an item
  const isRecyclingQuery = (text: string): boolean => {
    const recyclingKeywords = [
      "recycle", "recycling", "where", "куда", "где", "қайда", "тәуелсіз",
      "пункт", "пункты", "центр", "центры", "ortaq", "point", "points", "center", "centers",
      "сдать", "throw", "dispose", "утилизировать", "тастау", "тапсыру",
      "what should i do with", "how to recycle", "how do i recycle",
      "как утилизировать", "что делать с", "қайта өңдеу", "менімен не істеймін"
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
      
      // Find which materials are mentioned to get preparation steps
      const normalizedQuery = text.toLowerCase();
      let detectedMaterial: string | null = null;
      
      const materialKeywordsCheck: Record<string, string[]> = {
        "Plastic": ["plastic", "plastik", "пластик", "пластик", "пластик", "pet", "pet bottle", "water bottle", "plastic bottle"],
        "Paper": ["paper", "бумага", "қағаз"],
        "Cardboard": ["cardboard", "carton", "картон"],
        "Glass": ["glass", "glas", "стекло", "шыны"],
        "Aluminum": ["aluminum", "aluminium", "алюминий"],
        "Batteries": ["batteries", "battery", "батарейки", "батареялар"],
        "E-waste": ["e-waste", "electronic", "electronics", "электроника", "laptop", "phone", "tv", "computer"],
        "Organic Waste": ["organic", "organik", "органические отходы", "пищевые отходы", "органикалық қалдықтар"],
      };
      
      for (const [material, keywords] of Object.entries(materialKeywordsCheck)) {
        if (keywords.some(keyword => normalizedQuery.includes(keyword))) {
          detectedMaterial = material;
          break;
        }
      }
      
      let messageText = "";
      if (detectedMaterial && preparationSteps[detectedMaterial]) {
        const steps = preparationSteps[detectedMaterial][language];
        const intro = language === "ru" ? "Вот как правильно подготовить этот материал к переработке:" 
                      : language === "kz" ? "Осы материалды қайта өңдеуге дұрыс дайындау жолдары:" 
                      : "Here's how to properly prepare this material for recycling:";
        messageText = `${intro}\n\n${steps.join("\n")}`;
        
        if (matchingPoints.length > 0) {
          const addendum = language === "ru" ? "\n\nА вот несколько пунктов переработки, которые могут вам подойти:" 
                         : language === "kz" ? "\n\nМұнды сәйкес келетін қайта өңдеу орталықтары:" 
                         : "\n\nHere are some recycling locations that might interest you:";
          messageText += addendum;
        }
      } else {
        messageText = matchingPoints.length > 0 
          ? (language === "ru" ? "Вот несколько пунктов переработки, которые могут вам подойти:" 
            : language === "kz" ? "Мұнды сәйкес келетін қайта өңдеу орталықтары:" 
            : "Here are some recycling locations that might interest you:")
          : (language === "ru" ? translations.recyclingMap.noLocationsFound 
            : language === "kz" ? translations.recyclingMap.noLocationsFound 
            : translations.recyclingMap.noLocationsFound);
      }

      const assistantMessage: Message = {
        id: Date.now() + 1,
        text: messageText,
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
    <main 
      className="h-screen text-white relative overflow-hidden flex flex-col" 
      style={{ background: colors.bg }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Animated background orbs */}
      <div 
        className="fixed top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] animate-pulse"
        style={{ background: `${colors.primary}10` }}
      ></div>
      <div 
        className="fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[100px] animate-pulse delay-1000"
        style={{ background: `${colors.accent}10` }}
      ></div>
      <div 
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full blur-[80px] animate-pulse delay-500"
        style={{ background: `${colors.primary}05` }}
      ></div>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Fixed Header */}
      <header className="flex-shrink-0 flex items-center justify-between p-4 md:p-6 lg:p-8 relative z-10">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-3 rounded-2xl backdrop-blur-xl hover:scale-105 transition-all duration-300 shadow-lg group flex-shrink-0"
          style={{ background: colors.cardBg, borderColor: colors.border, borderWidth: 1 }}
          aria-label="Open menu"
        >
          <svg
            className="w-6 h-6 transition-colors"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
            stroke={colors.textSecondary}
            style={{ color: colors.textSecondary }}
            onMouseEnter={(e) => e.currentTarget.style.stroke = colors.text}
            onMouseLeave={(e) => e.currentTarget.style.stroke = colors.textSecondary}
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
          className="px-4 py-2 rounded-2xl backdrop-blur-xl hover:scale-105 transition-all duration-300 shadow-lg text-sm flex-shrink-0"
          style={{ background: colors.cardBg, borderColor: colors.border, borderWidth: 1, color: colors.textSecondary }}
        >
          {translations.ecoAssistant.clearChat}
        </button>
      </header>

      {/* Scrollable Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 relative z-10">
        {/* Page Title */}
        <div className="mb-6 text-center">
          <div 
            className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 shadow-lg"
            style={{ background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.accent})` }}
          >
            <span className="text-4xl">🤖</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">{translations.ecoAssistant.title}</h2>
          <p className="text-sm md:text-base" style={{ color: colors.textSecondary }}>{translations.ecoAssistant.subtitle}</p>
        </div>

        {/* Welcome Card */}
        <div 
          className="relative rounded-3xl overflow-hidden backdrop-blur-xl p-6 mb-6"
          style={{ borderColor: `${colors.primary}30`, borderWidth: 1, background: `linear-gradient(to bottom right, ${colors.primary}10, ${colors.primaryDark}10, ${colors.accent}10)` }}
        >
          <div 
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{ background: `linear-gradient(to right, ${colors.primary}10, ${colors.accent}10, ${colors.primary}10)` }}
          ></div>
          <p className="text-sm md:text-base relative z-10" style={{ color: colors.text }}>{translations.ecoAssistant.welcomeMessage}</p>
        </div>

        {/* Chat Messages */}
        <div className="space-y-4 pb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3`}
                style={{
                  background: message.isUser 
                    ? `linear-gradient(to right, ${colors.primary}, ${colors.accent})` 
                    : colors.cardBg,
                  borderColor: message.isUser ? "transparent" : colors.border,
                  borderWidth: message.isUser ? 0 : 1,
                  color: message.isUser ? "#ffffff" : colors.text
                }}
              >
                <p className="text-sm md:text-base whitespace-pre-wrap">{message.text}</p>

                {/* Recycling Points */}
                {!message.isUser && message.recyclingPoints && message.recyclingPoints.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {message.recyclingPoints.slice(0, 5).map((point, idx) => (
                      <div key={idx} className="bg-black/20 rounded-xl p-3 space-y-2">
                        <p className="font-semibold" style={{ color: colors.text }}>{point.name}</p>
                        <p className="text-xs" style={{ color: colors.textSecondary }}>{point.address}, {point.city}</p>
                        <p className="text-xs" style={{ color: colors.textSecondary }}>
                          {translations.recyclingMap.acceptedMaterials}: {translateWasteType(point.waste_type, language)}
                        </p>
                        <button
                          onClick={() => buildRoute(point)}
                          className="mt-2 px-3 py-1.5 rounded-lg text-white text-xs font-semibold hover:scale-105 transition-transform"
                          style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})` }}
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
              <div 
                className="rounded-2xl px-4 py-3"
                style={{ background: colors.cardBg, borderColor: colors.border, borderWidth: 1 }}
              >
                <div className="flex space-x-2">
                  <div 
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ background: colors.primary }}
                  ></div>
                  <div 
                    className="w-2 h-2 rounded-full animate-bounce delay-100"
                    style={{ background: colors.primary }}
                  ></div>
                  <div 
                    className="w-2 h-2 rounded-full animate-bounce delay-200"
                    style={{ background: colors.primary }}
                  ></div>
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
              className="px-4 py-2 rounded-full backdrop-blur-xl hover:scale-105 transition-all duration-300 text-sm"
              style={{ background: colors.cardBg, borderColor: colors.border, borderWidth: 1, color: colors.textSecondary }}
            >
              {translations.ecoAssistant.suggestionPlastic}
            </button>
            <button
              onClick={() => handleSuggestionClick(translations.ecoAssistant.suggestionBatteries)}
              className="px-4 py-2 rounded-full backdrop-blur-xl hover:scale-105 transition-all duration-300 text-sm"
              style={{ background: colors.cardBg, borderColor: colors.border, borderWidth: 1, color: colors.textSecondary }}
            >
              {translations.ecoAssistant.suggestionBatteries}
            </button>
            <button
              onClick={() => handleSuggestionClick(translations.ecoAssistant.suggestionReduceWaste)}
              className="px-4 py-2 rounded-full backdrop-blur-xl hover:scale-105 transition-all duration-300 text-sm"
              style={{ background: colors.cardBg, borderColor: colors.border, borderWidth: 1, color: colors.textSecondary }}
            >
              {translations.ecoAssistant.suggestionReduceWaste}
            </button>
            <button
              onClick={() => handleSuggestionClick(translations.ecoAssistant.suggestionClimateChange)}
              className="px-4 py-2 rounded-full backdrop-blur-xl hover:scale-105 transition-all duration-300 text-sm"
              style={{ background: colors.cardBg, borderColor: colors.border, borderWidth: 1, color: colors.textSecondary }}
            >
              {translations.ecoAssistant.suggestionClimateChange}
            </button>
            <button
              onClick={() => handleSuggestionClick(translations.ecoAssistant.suggestionStudents)}
              className="px-4 py-2 rounded-full backdrop-blur-xl hover:scale-105 transition-all duration-300 text-sm"
              style={{ background: colors.cardBg, borderColor: colors.border, borderWidth: 1, color: colors.textSecondary }}
            >
              {translations.ecoAssistant.suggestionStudents}
            </button>
            <button
              onClick={() => handleSuggestionClick(translations.ecoAssistant.suggestionHazardous)}
              className="px-4 py-2 rounded-full backdrop-blur-xl hover:scale-105 transition-all duration-300 text-sm"
              style={{ background: colors.cardBg, borderColor: colors.border, borderWidth: 1, color: colors.textSecondary }}
            >
              {translations.ecoAssistant.suggestionHazardous}
            </button>
          </div>
        </div>
      </div>

      {/* Fixed Input Area */}
      <div className="flex-shrink-0 px-4 pb-4 md:px-6 md:pb-6 lg:px-8 lg:pb-8 relative z-10">
        {/* Hide Safari default media controls */}
        <style jsx global>{`
          /* Hide Safari's default media controls */
          video::-webkit-media-controls,
          audio::-webkit-media-controls,
          *::-webkit-media-controls-enclosure,
          *::-webkit-media-controls-panel {
            display: none !important;
            visibility: hidden !important;
          }
        `}</style>
        
        <div 
          className="relative rounded-3xl overflow-hidden backdrop-blur-xl p-4"
          style={{ borderColor: `${colors.primary}30`, borderWidth: 1, background: `linear-gradient(to bottom right, ${colors.primary}10, ${colors.primaryDark}10, ${colors.accent}10)` }}
        >
          <div 
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{ background: `linear-gradient(to right, ${colors.primary}10, ${colors.accent}10, ${colors.primary}10)` }}
          ></div>
          
          <div className="flex gap-3 relative z-10">
            <div className="flex-1 relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isRecording ? `🎤 Listening... ${recordingDuration}s` : isProcessing ? "⏳ Processing..." : translations.ecoAssistant.placeholder}
                className="w-full bg-white/5 backdrop-blur-xl rounded-2xl px-4 py-4 pr-12 md:pr-12 resize-none focus:outline-none transition-colors"
                style={{ 
                  borderColor: colors.border, 
                  borderWidth: 1,
                  color: colors.text,
                  minHeight: "56px"
                }}
                rows={1}
              />
              
              <button
                onClick={handleVoiceButtonClick}
                disabled={isProcessing}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{ 
                  background: isRecording ? `${colors.danger}20` : "transparent",
                  color: isRecording ? colors.danger : colors.textSecondary
                }}
                title={isRecording ? "Stop recording" : "Voice input"}
                onMouseEnter={(e) => {
                  if (!isRecording) {
                    e.currentTarget.style.background = `${colors.primary}10`;
                    e.currentTarget.style.color = colors.text;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isRecording) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = colors.textSecondary;
                  }
                }}
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
            </div>
            <button
              onClick={() => sendMessage(inputText)}
              disabled={!inputText.trim() || isTyping}
              className="px-6 py-4 md:px-6 md:py-4 rounded-2xl md:rounded-2xl hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-semibold whitespace-nowrap w-12 h-12 md:w-auto md:h-auto rounded-full md:rounded-2xl flex items-center justify-center"
              style={{ 
                background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`, 
                minHeight: "56px",
                color: "#ffffff"
              }}
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
