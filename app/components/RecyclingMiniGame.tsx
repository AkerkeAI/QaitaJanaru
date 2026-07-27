"use client";

import { useState, useEffect, useRef } from "react";

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
  { 
    id: "1", 
    type: "plastic", 
    name: "plastic bottle", 
    icon: "/assets/recycling-game/item-plastic-bottle.jpeg" 
  },
  { 
    id: "2", 
    type: "glass", 
    name: "glass bottle", 
    icon: "/assets/recycling-game/item-glass-bottle.jpeg" 
  },
  { 
    id: "3", 
    type: "paper", 
    name: "newspaper", 
    icon: "/assets/recycling-game/item-newspaper.jpeg" 
  },
  { 
    id: "4", 
    type: "organic", 
    name: "banana peel", 
    icon: "/assets/recycling-game/item-banana-peel.jpeg" 
  },
  { 
    id: "5", 
    type: "paper", 
    name: "cardboard", 
    icon: "/assets/recycling-game/item-cardboard.jpeg" 
  },
];

const BINS = [
  { 
    type: "plastic" as WasteType, 
    color: "#FBBF24", 
    label: "Plastic", 
    icon: "/assets/recycling-game/bin-plastic.jpeg" 
  },
  { 
    type: "paper" as WasteType, 
    color: "#3B82F6", 
    label: "Paper", 
    icon: "/assets/recycling-game/bin-paper.jpeg" 
  },
  { 
    type: "glass" as WasteType, 
    color: "#10B981", 
    label: "Glass", 
    icon: "/assets/recycling-game/bin-glass.jpeg" 
  },
  { 
    type: "organic" as WasteType, 
    color: "#A16207", 
    label: "Organic", 
    icon: "/assets/recycling-game/bin-organic.jpg" 
  },
];

export function RecyclingMiniGame({ onComplete }: RecyclingMiniGameProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 });
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; vx: number; vy: number }>>([]);
  const [leaves, setLeaves] = useState<Array<{ id: number; x: number; y: number; rotation: number; speed: number }>>([]);
  const [clouds, setClouds] = useState<Array<{ id: number; x: number; y: number; speed: number; scale: number }>>([]);
  const [lightParticles, setLightParticles] = useState<Array<{ id: number; x: number; y: number; speed: number; opacity: number }>>([]);
  const [janaAnimation, setJanaAnimation] = useState<'idle' | 'happy' | 'shake'>('idle');
  const itemRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const binsRef = useRef<{ [key: string]: DOMRect }>({});
  const initialPositionRef = useRef({ x: 0, y: 0 });

  const currentItem = WASTE_ITEMS[currentIndex];
  const progress = ((currentIndex) / WASTE_ITEMS.length) * 100;

  // Initialize falling leaves, clouds, and light particles
  useEffect(() => {
    const newLeaves = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      rotation: Math.random() * 360,
      speed: 0.05 + Math.random() * 0.1,
    }));
    setLeaves(newLeaves);

    const newClouds = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: 5 + Math.random() * 20,
      speed: 0.01 + Math.random() * 0.02,
      scale: 0.8 + Math.random() * 0.4,
    }));
    setClouds(newClouds);

    const newLightParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      speed: 0.02 + Math.random() * 0.05,
      opacity: 0.3 + Math.random() * 0.4,
    }));
    setLightParticles(newLightParticles);
  }, []);

  // Animate leaves, clouds, and light particles
  useEffect(() => {
    const interval = setInterval(() => {
      setLeaves(prev => prev.map(leaf => ({
        ...leaf,
        y: (leaf.y + leaf.speed) % 100,
        x: (leaf.x + Math.sin(Date.now() / 1000 + leaf.id) * 0.02) % 100,
        rotation: (leaf.rotation + 0.3) % 360,
      })));
      setClouds(prev => prev.map(cloud => ({
        ...cloud,
        x: (cloud.x + cloud.speed) % 110,
      })));
      setLightParticles(prev => prev.map(p => ({
        ...p,
        y: (p.y - p.speed + 100) % 100,
        x: (p.x + Math.sin(Date.now() / 2000 + p.id) * 0.03 + 100) % 100,
      })));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Create particles on correct drop
  const createParticles = (x: number, y: number) => {
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      x,
      y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 1000);
  };

  // Animate particles
  useEffect(() => {
    if (particles.length === 0) return;
    const interval = setInterval(() => {
      setParticles(prev => prev.map(p => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        vy: p.vy + 0.3, // gravity
      })));
    }, 16);
    return () => clearInterval(interval);
  }, [particles]);

  // Get bin positions for collision detection
  const updateBinPositions = () => {
    const bins: { [key: string]: DOMRect } = {};
    BINS.forEach(bin => {
      const binElement = document.getElementById(`bin-${bin.type}`);
      if (binElement) {
        bins[bin.type] = binElement.getBoundingClientRect();
      }
    });
    binsRef.current = bins;
  };

  const handleDragStart = (e: React.PointerEvent) => {
    e.preventDefault();
    
    // Capture pointer immediately to prevent drag interruption
    if (itemRef.current) {
      itemRef.current.setPointerCapture(e.pointerId);
    }
    
    // Start dragging instantly - no thresholds
    setIsDragging(true);
    
    // Center item under finger immediately
    const newX = e.clientX - window.innerWidth / 2;
    const newY = e.clientY - window.innerHeight / 2;
    setCurrentPosition({ x: newX, y: newY });
    
    // Prevent page scrolling
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    
    // Update bin positions for collision detection
    updateBinPositions();
  };

  const handleDragMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();

    // Update position to keep item centered under finger
    const newX = e.clientX - window.innerWidth / 2;
    const newY = e.clientY - window.innerHeight / 2;
    setCurrentPosition({ x: newX, y: newY });
  };

  const handleDragEnd = (e: React.PointerEvent) => {
    if (!isDragging) return;
    
    // Release pointer capture
    if (itemRef.current) {
      itemRef.current.releasePointerCapture(e.pointerId);
    }
    
    setIsDragging(false);
    
    // Restore page scrolling
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
    
    // Check collision with bins
    const itemRect = itemRef.current?.getBoundingClientRect();
    if (!itemRect) return;

    const itemCenter = {
      x: itemRect.left + itemRect.width / 2,
      y: itemRect.top + itemRect.height / 2,
    };

    let droppedOnBin: WasteType | null = null;
    
    for (const bin of BINS) {
      const binRect = binsRef.current[bin.type];
      if (!binRect) continue;

      // Check if item center is within bin bounds with some padding
      const padding = 20;
      if (
        itemCenter.x >= binRect.left - padding &&
        itemCenter.x <= binRect.right + padding &&
        itemCenter.y >= binRect.top - padding &&
        itemCenter.y <= binRect.bottom + padding
      ) {
        droppedOnBin = bin.type;
        break;
      }
    }

    if (droppedOnBin) {
      if (droppedOnBin === currentItem.type) {
        // Correct answer - snap to bin center
        const binRect = binsRef.current[droppedOnBin];
        if (binRect) {
          const binCenterX = binRect.left + binRect.width / 2 - window.innerWidth / 2;
          const binCenterY = binRect.top + binRect.height / 2 - window.innerHeight / 2;
          setCurrentPosition({ x: binCenterX, y: binCenterY });
        }
        
        setShowSuccess(true);
        setScore(score + 1);
        createParticles(itemCenter.x, itemCenter.y);
        setJanaAnimation('happy');
        setTimeout(() => setJanaAnimation('idle'), 800);
        
        setTimeout(() => {
          setShowSuccess(false);
          if (currentIndex < WASTE_ITEMS.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setCurrentPosition({ x: 0, y: 0 });
          } else {
            setIsComplete(true);
            setTimeout(() => {
              onComplete();
            }, 2000);
          }
        }, 1000);
      } else {
        // Wrong bin - shake and return to origin
        setShowError(true);
        setJanaAnimation('shake');
        setTimeout(() => setJanaAnimation('idle'), 500);
        
        // Animate back to origin
        setTimeout(() => {
          setCurrentPosition({ x: 0, y: 0 });
          setShowError(false);
        }, 500);
      }
    } else {
      // Dropped outside - animate back to origin
      setCurrentPosition({ x: 0, y: 0 });
    }
  };

  if (isComplete) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden"
        style={{
          backgroundImage: "url('/assets/recycling-game/background.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative text-center space-y-6">
          <div className="text-8xl animate-bounce">🎉</div>
          <h1 className="text-4xl font-bold text-white drop-shadow-lg">Great job!</h1>
          <p className="text-xl text-emerald-100 drop-shadow-md">
            You helped recycle the waste correctly.
          </p>
          <div className="text-6xl">♻️</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 overflow-hidden"
      style={{
        backgroundImage: "url('/assets/recycling-game/background.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Parallax background overlay */}
      <div className="absolute inset-0 bg-black/20" />
      
      {/* Parallax clouds */}
      {clouds.map(cloud => (
        <div
          key={cloud.id}
          className="absolute pointer-events-none opacity-40"
          style={{
            left: `${cloud.x}%`,
            top: `${cloud.y}%`,
            transform: `scale(${cloud.scale})`,
            transition: 'left 0.1s linear',
          }}
        >
          <svg width="120" height="60" viewBox="0 0 120 60" fill="white">
            <ellipse cx="60" cy="40" rx="50" ry="20" />
            <ellipse cx="30" cy="35" rx="25" ry="15" />
            <ellipse cx="90" cy="35" rx="25" ry="15" />
            <ellipse cx="50" cy="25" rx="30" ry="18" />
            <ellipse cx="75" cy="28" rx="22" ry="14" />
          </svg>
        </div>
      ))}

      {/* Falling leaves background */}
      {leaves.map(leaf => (
        <div
          key={leaf.id}
          className="absolute pointer-events-none opacity-30"
          style={{
            left: `${leaf.x}%`,
            top: `${leaf.y}%`,
            transform: `rotate(${leaf.rotation}deg)`,
            transition: 'top 0.1s ease-out, left 0.1s ease-out, transform 0.1s ease-out',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#4ade80">
            <path d="M12 2C12 2 8 6 8 10C8 14 12 18 12 22C12 18 16 14 16 10C16 6 12 2 12 2Z" />
          </svg>
        </div>
      ))}

      {/* Light particles floating upward */}
      {lightParticles.map(p => (
        <div
          key={p.id}
          className="absolute pointer-events-none rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: '4px',
            height: '4px',
            background: `rgba(255, 255, 200, ${p.opacity})`,
            boxShadow: '0 0 8px rgba(255, 255, 200, 0.5)',
            transition: 'top 0.1s ease-out, left 0.1s ease-out',
          }}
        />
      ))}

      {/* Particles */}
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute pointer-events-none"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#22c55e',
            boxShadow: '0 0 10px #22c55e',
          }}
        />
      ))}

      {/* Jana Character */}
      <div 
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10"
        style={{
          animation: janaAnimation === 'happy' ? 'janaHappy 0.6s ease-out' : 
                     janaAnimation === 'shake' ? 'janaShake 0.5s ease-in-out' : 'none',
        }}
      >
        <div 
          className="relative"
          style={{
            animation: 'janaIdle 2.5s ease-in-out infinite, janaFloat 3s ease-in-out infinite, janaRotate 4s ease-in-out infinite',
          }}
        >
          <img 
            src="/assets/recycling-game/jana.png" 
            alt="Jana"
            className="h-32 sm:h-40 lg:h-48 object-contain drop-shadow-2xl"
            style={{
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
            }}
          />
          {/* Blink overlay */}
          <div 
            className="absolute inset-0"
            style={{
              animation: 'janaBlink 5s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-2xl mb-4 sm:mb-6">
        <div className="h-3 sm:h-4 bg-emerald-900/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-6 sm:mb-8 px-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">🌍 Help Heal the Planet</h1>
        <p className="text-sm sm:text-base lg:text-lg text-emerald-200">Sort the waste into the correct recycling bins.</p>
      </div>

      {/* Waste Item */}
      <div className="relative mb-8 sm:mb-12">
        <div
          ref={itemRef}
          className={`w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-3xl flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none ${
            isDragging ? "scale-110 shadow-2xl z-50" : "shadow-xl"
          } ${
            showSuccess ? "animate-pulse bg-emerald-500/30" : ""
          } ${
            showError ? "animate-shake bg-red-500/30" : ""
          }`}
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
            border: "2px solid rgba(255, 255, 255, 0.2)",
            transform: `translate3d(${currentPosition.x}px, ${currentPosition.y}px, 0)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out',
            willChange: 'transform',
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
          }}
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
        >
          <img 
            src={currentItem.icon} 
            alt={currentItem.name} 
            className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 object-contain"
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
            }}
          />
        </div>
        <p className="text-center mt-4 text-white font-medium text-sm sm:text-base">{currentItem.name}</p>
      </div>

      {/* Bins */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full max-w-2xl px-4">
        {BINS.map((bin) => (
          <div
            key={bin.type}
            id={`bin-${bin.type}`}
            className="relative rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col items-center justify-center transition-all duration-200 hover:scale-105"
            style={{
              background: `${bin.color}20`,
              border: `2px solid ${bin.color}`,
            }}
          >
            {/* Bin Image */}
            <img 
              src={bin.icon} 
              alt={bin.label}
              className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 mb-2 object-contain"
              style={{
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
              }}
            />
            <span className="text-white font-semibold text-sm sm:text-base">{bin.label}</span>
          </div>
        ))}
      </div>

      {/* Success Animation */}
      {showSuccess && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-6xl sm:text-8xl animate-bounce">✓</div>
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
        
        @keyframes janaIdle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        
        @keyframes janaFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        
        @keyframes janaRotate {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(2deg); }
          75% { transform: rotate(-2deg); }
        }
        
        @keyframes janaBlink {
          0%, 45%, 55%, 100% { opacity: 0; }
          50% { opacity: 0.3; }
        }
        
        @keyframes janaHappy {
          0%, 100% { transform: translateY(0) scale(1); }
          30% { transform: translateY(-15px) scale(1.1); }
          50% { transform: translateY(-20px) scale(1.15); }
          70% { transform: translateY(-10px) scale(1.05); }
        }
        
        @keyframes janaShake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          20% { transform: translateX(-8px) rotate(-5deg); }
          40% { transform: translateX(8px) rotate(5deg); }
          60% { transform: translateX(-6px) rotate(-3deg); }
          80% { transform: translateX(6px) rotate(3deg); }
        }
      `}</style>
    </div>
  );
}
