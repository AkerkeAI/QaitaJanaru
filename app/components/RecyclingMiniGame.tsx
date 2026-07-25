"use client";

import { useState, useEffect } from "react";

interface RecyclingMiniGameProps {
  onComplete: () => void;
}

type WasteType = "plastic" | "paper" | "glass" | "organic";

interface WasteItem {
  id: string;
  type: WasteType;
  name: string;
  icon: string;
}

const WASTE_ITEMS: WasteItem[] = [
  { id: "1", type: "plastic", name: "plastic bottle", icon: "/assets/recycling-game/item-plastic-bottle.svg" },
  { id: "2", type: "glass", name: "glass bottle", icon: "/assets/recycling-game/item-glass-bottle.svg" },
  { id: "3", type: "paper", name: "newspaper", icon: "/assets/recycling-game/item-newspaper.svg" },
  { id: "4", type: "organic", name: "banana peel", icon: "/assets/recycling-game/item-banana-peel.svg" },
  { id: "5", type: "paper", name: "cardboard", icon: "/assets/recycling-game/item-cardboard.svg" },
];

const BINS = [
  { type: "plastic" as WasteType, color: "#FBBF24", label: "Plastic", icon: "/assets/recycling-game/bin-plastic.svg" },
  { type: "paper" as WasteType, color: "#3B82F6", label: "Paper", icon: "/assets/recycling-game/bin-paper.svg" },
  { type: "glass" as WasteType, color: "#10B981", label: "Glass", icon: "/assets/recycling-game/bin-glass.svg" },
  { type: "organic" as WasteType, color: "#A16207", label: "Organic", icon: "/assets/recycling-game/bin-organic.svg" },
];

export function RecyclingMiniGame({ onComplete }: RecyclingMiniGameProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const currentItem = WASTE_ITEMS[currentIndex];
  const progress = ((currentIndex) / WASTE_ITEMS.length) * 100;

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    setDragPosition({ x: clientX, y: clientY });
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    setDragPosition({ x: clientX, y: clientY });
  };

  const handleDragEnd = (e: React.MouseEvent | React.TouchEvent, binType: WasteType) => {
    if (!isDragging) return;
    setIsDragging(false);

    if (binType === currentItem.type) {
      // Correct answer
      setShowSuccess(true);
      setScore(score + 1);
      
      setTimeout(() => {
        setShowSuccess(false);
        if (currentIndex < WASTE_ITEMS.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          setIsComplete(true);
          setTimeout(() => {
            onComplete();
          }, 2000);
        }
      }, 1000);
    } else {
      // Wrong answer
      setShowError(true);
      setTimeout(() => {
        setShowError(false);
      }, 500);
    }
  };

  const handleDragEndOutside = () => {
    setIsDragging(false);
  };

  if (isComplete) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{
          background: "linear-gradient(to bottom right, #064e3b, #166534, #0f766e)",
        }}
      >
        <div className="text-center space-y-6">
          <div className="text-8xl animate-bounce">🎉</div>
          <h1 className="text-4xl font-bold text-white">Great job!</h1>
          <p className="text-xl text-emerald-200">
            You helped recycle the waste correctly.
          </p>
          <div className="text-6xl">♻️</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4"
      style={{
        background: "linear-gradient(to bottom right, #064e3b, #166534, #0f766e)",
      }}
    >
      {/* Progress Bar */}
      <div className="w-full max-w-md mb-8">
        <div className="h-2 bg-emerald-900/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">🌍 Help Heal the Planet</h1>
        <p className="text-emerald-200">Sort the waste into the correct recycling bins.</p>
      </div>

      {/* Waste Item */}
      <div className="relative mb-12">
        <div
          className={`w-32 h-32 rounded-3xl flex items-center justify-center cursor-grab active:cursor-grabbing transition-all duration-200 ${
            isDragging ? "scale-110 shadow-2xl" : "shadow-xl"
          } ${
            showSuccess ? "animate-pulse bg-emerald-500/30" : ""
          } ${
            showError ? "animate-shake bg-red-500/30" : ""
          }`}
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
            border: "2px solid rgba(255, 255, 255, 0.2)",
            transform: isDragging
              ? `translate(${dragPosition.x - window.innerWidth / 2}px, ${dragPosition.y - window.innerHeight / 2}px)`
              : "translate(0, 0)",
            position: isDragging ? "fixed" : "relative",
            left: isDragging ? dragPosition.x - 64 : "auto",
            top: isDragging ? dragPosition.y - 64 : "auto",
          }}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          onMouseMove={handleDragMove}
          onTouchMove={handleDragMove}
          onMouseUp={(e) => handleDragEndOutside()}
          onTouchEnd={(e) => handleDragEndOutside()}
        >
          <img src={currentItem.icon} alt={currentItem.name} className="w-20 h-20" />
        </div>
        <p className="text-center mt-4 text-white font-medium">{currentItem.name}</p>
      </div>

      {/* Bins */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {BINS.map((bin) => (
          <div
            key={bin.type}
            className="relative rounded-3xl p-6 flex flex-col items-center justify-center transition-all duration-200 hover:scale-105 cursor-pointer"
            style={{
              background: `${bin.color}20`,
              border: `2px solid ${bin.color}`,
            }}
            onMouseUp={(e) => handleDragEnd(e, bin.type)}
            onTouchEnd={(e) => handleDragEnd(e, bin.type)}
          >
            {/* Bin SVG */}
            <img
              src={bin.icon}
              alt={bin.label}
              className="w-16 h-16 mb-2"
            />
            <span className="text-white font-semibold">{bin.label}</span>
          </div>
        ))}
      </div>

      {/* Success Animation */}
      {showSuccess && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-6xl animate-bounce">✓</div>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
