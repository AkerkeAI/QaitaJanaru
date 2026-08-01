"use client";

import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../contexts/LanguageContext";

interface RecyclingMiniGameProps {
  onComplete: () => void;
}

type WasteType = "plastic" | "paper" | "glass" | "organic";

interface WasteItem {
  id: string;
  type: WasteType;
  nameKey: string;
  icon: string;
}

const WASTE_ITEMS: WasteItem[] = [
  { 
    id: "1", 
    type: "plastic", 
    nameKey: "plasticBottle", 
    icon: "/assets/recycling-game/item-plastic-bottle.png" 
  },
  { 
    id: "2", 
    type: "glass", 
    nameKey: "glassBottle", 
    icon: "/assets/recycling-game/item-glass-bottle.png" 
  },
  { 
    id: "3", 
    type: "paper", 
    nameKey: "newspaper", 
    icon: "/assets/recycling-game/item-newspaper.png" 
  },
  { 
    id: "4", 
    type: "organic", 
    nameKey: "bananaPeel", 
    icon: "/assets/recycling-game/item-banana-peel.png" 
  },
  { 
    id: "5", 
    type: "paper", 
    nameKey: "cardboard", 
    icon: "/assets/recycling-game/item-cardboard.png" 
  },
];

const BINS = [
  { 
    type: "plastic" as WasteType, 
    color: "#FBBF24", 
    label: "Plastic", 
    icon: "/assets/recycling-game/bin-plastic.png" 
  },
  { 
    type: "paper" as WasteType, 
    color: "#3B82F6", 
    label: "Paper", 
    icon: "/assets/recycling-game/bin-paper.png" 
  },
  { 
    type: "glass" as WasteType, 
    color: "#10B981", 
    label: "Glass", 
    icon: "/assets/recycling-game/bin-glass.png" 
  },
  { 
    type: "organic" as WasteType, 
    color: "#A16207", 
    label: "Organic", 
    icon: "/assets/recycling-game/bin-organic.png" 
  },
];

export function RecyclingMiniGame({ onComplete }: RecyclingMiniGameProps) {
  const [activeItems, setActiveItems] = useState<Array<{ item: WasteItem; id: string; position: { x: number; y: number } }>>([]);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; vx: number; vy: number }>>([]);
  const [leaves, setLeaves] = useState<Array<{ id: number; x: number; y: number; rotation: number; speed: number }>>([]);
  const [clouds, setClouds] = useState<Array<{ id: number; x: number; y: number; speed: number; scale: number }>>([]);
  const [lightParticles, setLightParticles] = useState<Array<{ id: number; x: number; y: number; speed: number; opacity: number }>>([]);
  const [janaState, setJanaState] = useState<'idle' | 'happy' | 'sad'>('idle');
  const [showIntro, setShowIntro] = useState(true);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorText, setErrorText] = useState('');
  const { messages } = useLanguage();
  const itemRef = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const binsRef = useRef<{ [key: string]: DOMRect }>({});
  const initialPositionRef = useRef<{ [key: string]: { x: number; y: number } }>({});
  const [processedItems, setProcessedItems] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [isSpawning, setIsSpawning] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const ambientOscillatorRef = useRef<OscillatorNode | null>(null);
  const ambientGainRef = useRef<GainNode | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const progress = (processedItems.size / WASTE_ITEMS.length) * 100;

  // Initialize audio context on first user interaction
  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioUnlocked(true);
      startAmbientSound();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().then(() => {
        setAudioUnlocked(true);
        if (!ambientOscillatorRef.current) {
          startAmbientSound();
        }
      });
    }
  };

  // Start ambient sound
  const startAmbientSound = () => {
    try {
      if (!audioContextRef.current) return;
      if (ambientOscillatorRef.current) return;

      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(80, ctx.currentTime); // Low frequency for ambient
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 2); // Fade in to ~5% volume (quieter)
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.start();
      
      ambientOscillatorRef.current = oscillator;
      ambientGainRef.current = gainNode;
    } catch (error) {
      console.error('Ambient sound failed:', error);
    }
  };

  // Sound effects using Web Audio API
  const playSound = (type: 'correct' | 'wrong' | 'combo') => {
    try {
      initAudioContext();
      const ctx = audioContextRef.current;
      if (!ctx) return;

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      if (type === 'correct') {
        // Pleasant ding sound
        oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        oscillator.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.1); // G5
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
      } else if (type === 'wrong') {
        // Soft error sound
        oscillator.frequency.setValueAtTime(200, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
      } else if (type === 'combo') {
        // Brighter success sound
        oscillator.frequency.setValueAtTime(523.25, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0.18, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
      }
    } catch (error) {
      console.error('Sound playback failed:', error);
    }
  };

  // Get localized item name
  const getItemName = (item: WasteItem) => {
    return messages.recyclingGame?.[item.nameKey as keyof typeof messages.recyclingGame] || item.nameKey;
  };

  // Spawn two items initially - only once when intro ends
  useEffect(() => {
    if (!showIntro && activeItems.length === 0 && !isSpawning) {
      setIsSpawning(true);
      
      const availableItems = WASTE_ITEMS.filter(item => !processedItems.has(item.id));
      
      // Always spawn exactly 2 items if available, or 1 if only 1 remains
      const itemsToSpawn = availableItems.slice(0, 2);
      
      if (itemsToSpawn.length > 0) {
        // Calculate responsive positions based on viewport width
        const viewportWidth = window.innerWidth;
        const itemSpacing = Math.min(viewportWidth * 0.15, 100); // 15% of viewport, max 100px
        
        const newItems = itemsToSpawn.map((item, index) => ({
          item,
          id: `item-${item.id}`,
          position: { 
            x: itemsToSpawn.length === 1 ? 0 : (index === 0 ? -itemSpacing : itemSpacing),
            y: 0 
          }
        }));
        setActiveItems(newItems);
      }
      
      setTimeout(() => setIsSpawning(false), 200);
    }
  }, [showIntro, processedItems]);

  // Spawn new item when one is removed to maintain exactly 2 items
  const spawnNewItem = () => {
    if (isSpawning || activeItems.length >= 2) return;
    setIsSpawning(true);
    
    const availableItems = WASTE_ITEMS.filter(item => !processedItems.has(item.id));
    if (availableItems.length > 0 && activeItems.length < 2) {
      const newItem = availableItems[0];
      
      // Calculate responsive position to keep items centered
      const viewportWidth = window.innerWidth;
      const itemSpacing = Math.min(viewportWidth * 0.15, 100);
      const newX = activeItems.length === 1 
        ? (activeItems[0].position.x > 0 ? -itemSpacing : itemSpacing)
        : 0;
      
      setActiveItems(prev => [...prev, { 
        item: newItem, 
        id: `item-${newItem.id}`, 
        position: { x: newX, y: 0 } 
      }]);
    }
    
    setTimeout(() => setIsSpawning(false), 200);
  };

  // Initialize falling leaves, clouds, light particles, and butterflies
  useEffect(() => {
    const newLeaves = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      rotation: Math.random() * 360,
      speed: 0.03 + Math.random() * 0.07,
    }));
    setLeaves(newLeaves);

    const newClouds = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: 5 + Math.random() * 25,
      speed: 0.008 + Math.random() * 0.015,
      scale: 0.7 + Math.random() * 0.5,
    }));
    setClouds(newClouds);

    const newLightParticles = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      speed: 0.015 + Math.random() * 0.04,
      opacity: 0.25 + Math.random() * 0.35,
    }));
    setLightParticles(newLightParticles);
  }, []);

  // Animate leaves, clouds, and light particles
  useEffect(() => {
    const interval = setInterval(() => {
      setLeaves(prev => prev.map(leaf => ({
        ...leaf,
        y: (leaf.y + leaf.speed) % 100,
        x: (leaf.x + Math.sin(Date.now() / 1500 + leaf.id) * 0.015 + 100) % 100,
        rotation: (leaf.rotation + 0.2) % 360,
      })));
      setClouds(prev => prev.map(cloud => ({
        ...cloud,
        x: (cloud.x + cloud.speed) % 110,
      })));
      setLightParticles(prev => prev.map(p => ({
        ...p,
        y: (p.y - p.speed + 100) % 100,
        x: (p.x + Math.sin(Date.now() / 2500 + p.id) * 0.025 + 100) % 100,
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

  const handleDragStart = (itemId: string, e: React.PointerEvent) => {
    e.preventDefault();
    
    const itemElement = itemRef.current[itemId];
    if (!itemElement) return;
    
    // Capture pointer immediately to prevent drag interruption
    itemElement.setPointerCapture(e.pointerId);
    
    // Start dragging
    setDraggingItemId(itemId);
    
    // Store initial position
    const activeItem = activeItems.find(ai => ai.id === itemId);
    if (activeItem) {
      initialPositionRef.current[itemId] = { ...activeItem.position };
    }
    
    // Prevent page scrolling
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    
    // Update bin positions for collision detection
    updateBinPositions();
  };

  const handleDragMove = (itemId: string, e: React.PointerEvent) => {
    if (draggingItemId !== itemId) return;
    e.preventDefault();

    // Update position to keep item centered under finger
    // Use percentage-based positioning for responsiveness
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const newX = ((e.clientX - rect.left) / rect.width - 0.5) * 100; // -50 to 50
    const newY = ((e.clientY - rect.top) / rect.height - 0.5) * 100; // -50 to 50
    
    setActiveItems(prev => prev.map(ai => 
      ai.id === itemId ? { ...ai, position: { x: newX, y: newY } } : ai
    ));
  };

  const handleDragEnd = (itemId: string, e: React.PointerEvent) => {
    if (draggingItemId !== itemId) return;
    
    const itemElement = itemRef.current[itemId];
    if (!itemElement) return;
    
    // Release pointer capture
    itemElement.releasePointerCapture(e.pointerId);
    
    setDraggingItemId(null);
    
    // Restore page scrolling
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
    
    // Get the dragged item
    const activeItem = activeItems.find(ai => ai.id === itemId);
    if (!activeItem) return;
    
    // Check collision with bins
    const itemRect = itemElement.getBoundingClientRect();
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
      if (droppedOnBin === activeItem.item.type) {
        // Correct answer
        setShowSuccess(true);
        setScore(score + 1);
        createParticles(itemCenter.x, itemCenter.y);
        setJanaState('happy');
        playSound(score > 0 ? 'combo' : 'correct');
        setTimeout(() => setJanaState('idle'), 1000);
        
        // Mark item as processed and remove it
        setProcessedItems(prev => new Set([...prev, activeItem.item.id]));
        setActiveItems(prev => prev.filter(ai => ai.id !== itemId));
        
        setTimeout(() => {
          setShowSuccess(false);
          // Check if all items processed
          if (processedItems.size + 1 >= WASTE_ITEMS.length) {
            setIsComplete(true);
            setTimeout(() => {
              onComplete();
            }, 2000);
          } else {
            // Spawn new item
            spawnNewItem();
          }
        }, 1000);
      } else {
        // Wrong bin - shake and return to origin
        setShowError(true);
        setJanaState('sad');
        setShowErrorMessage(true);
        setErrorText(messages.recyclingGame?.tryAgain || 'Try again!');
        playSound('wrong');
        setTimeout(() => setJanaState('idle'), 1500);
        setTimeout(() => setShowErrorMessage(false), 1500);
        
        // Animate back to origin
        const initialPos = initialPositionRef.current[itemId] || { x: 0, y: 0 };
        setTimeout(() => {
          setActiveItems(prev => prev.map(ai => 
            ai.id === itemId ? { ...ai, position: initialPos } : ai
          ));
          setShowError(false);
        }, 500);
      }
    } else {
      // Dropped outside - animate back to origin
      const initialPos = initialPositionRef.current[itemId] || { x: 0, y: 0 };
      setActiveItems(prev => prev.map(ai => 
        ai.id === itemId ? { ...ai, position: initialPos } : ai
      ));
    }
  };

  // Intro screen
  if (showIntro) {
    return (
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden"
        style={{
          backgroundImage: "url('/assets/recycling-game/background.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        onClick={initAudioContext}
      >
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Animated background elements */}
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

        <div className="relative z-10 flex flex-col items-center justify-center max-w-lg w-full">
          {/* Speech bubble - Premium chat bubble style */}
          <div className="bg-gradient-to-br from-emerald-800/80 to-emerald-900/85 backdrop-blur-lg rounded-3xl p-6 sm:p-8 mb-8 shadow-2xl max-w-md border border-emerald-400/40" style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(74, 222, 128, 0.1)' }}>
            <div className="text-center space-y-3">
              <p className="text-xl sm:text-2xl font-bold text-white">
                {messages.recyclingGame?.introHi || 'Hi!'}
              </p>
              <p className="text-base sm:text-lg text-emerald-100 font-medium">
                {messages.recyclingGame?.introImJana || "I'm Jana 🌱"}
              </p>
              <p className="text-sm sm:text-base text-emerald-200">
                {messages.recyclingGame?.introHelp || "I'll help you learn how to sort waste correctly."}
              </p>
              <p className="text-sm sm:text-base text-emerald-200">
                {messages.recyclingGame?.introHealEarth || "Let's heal the Earth together!"}
              </p>
            </div>
          </div>

          {/* Jana waving */}
          <div className="relative mb-8">
            {/* Shadow under Jana */}
            <div 
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 sm:w-40 lg:w-48 h-4 bg-black/20 rounded-full blur-md"
              style={{
                animation: 'shadowPulse 2.5s ease-in-out infinite',
              }}
            />
            <img 
              src="/assets/recycling-game/jana-wave.png" 
              alt="Jana"
              className="h-64 sm:h-72 lg:h-80 object-contain drop-shadow-lg relative z-10"
              style={{
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                animation: 'janaWave 1.5s ease-in-out infinite',
              }}
            />
          </div>

          {/* Start button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              initAudioContext();
              setShowIntro(false);
            }}
            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold text-lg sm:text-xl py-4 px-8 sm:px-12 rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
          >
            {messages.recyclingGame?.letsStart || "Let's Start"}
          </button>
        </div>

        <style>{`
          @keyframes janaWave {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            25% { transform: translateY(-5px) rotate(2deg); }
            50% { transform: translateY(-8px) rotate(0deg); }
            75% { transform: translateY(-5px) rotate(-2deg); }
          }
        `}</style>
      </div>
    );
  }

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
          <h1 className="text-4xl font-bold text-white drop-shadow-lg">{messages.recyclingGame?.greatJob || 'Great job!'}</h1>
          <p className="text-xl text-emerald-100 drop-shadow-md">
            {messages.recyclingGame?.helpedRecycle || 'You helped recycle the waste correctly.'}
          </p>
          <div className="text-6xl">♻️</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex flex-col overflow-hidden"
      style={{
        backgroundImage: "url('/assets/recycling-game/background.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      onClick={initAudioContext}
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

      {/* Jana Character - Bottom left corner */}
      <div 
        className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 z-10"
        style={{ height: '150px', width: 'auto' maintainAspectRatio: true }}
      >
        {/* Shadow under Jana */}
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 sm:w-28 lg:w-32 h-3 sm:h-4 bg-black/20 rounded-full blur-sm"
          style={{
            animation: 'shadowPulse 2.5s ease-in-out infinite',
          }}
        />
        
        {/* Tiny leaves around Jana */}
        <div className="absolute -left-6 top-1/2 opacity-40" style={{ animation: 'leafFloat 4s ease-in-out infinite' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#4ade80">
            <path d="M12 2C12 2 8 6 8 10C8 14 12 18 12 22C12 18 16 14 16 10C16 6 12 2 12 2Z" />
          </svg>
        </div>
        <div className="absolute -right-4 top-1/3 opacity-30" style={{ animation: 'leafFloat 5s ease-in-out infinite 1s' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#4ade80">
            <path d="M12 2C12 2 8 6 8 10C8 14 12 18 12 22C12 18 16 14 16 10C16 6 12 2 12 2Z" />
          </svg>
        </div>

        <div 
          className="relative"
          style={{
            animation: janaState === 'happy' ? 'janaHappyBounce 0.8s ease-out' :
                       janaState === 'sad' ? 'janaSadShake 0.5s ease-in-out' :
                       'janaFloat 3s ease-in-out infinite',
          }}
        >
          <div className="relative" style={{ 
            animation: janaState === 'happy' ? 'janaClap 0.6s ease-in-out infinite' :
                     janaState === 'sad' ? 'janaLower 1s ease-in-out' :
                     'janaBreathe 2.5s ease-in-out infinite',
          }}>
            <img 
              src={janaState === 'happy' ? '/assets/recycling-game/jana-happy.png' :
                   janaState === 'sad' ? '/assets/recycling-game/jana-sad.png' :
                   '/assets/recycling-game/jana-idle.png'}
              alt="Jana"
              className="h-full w-auto object-contain drop-shadow-lg transition-opacity duration-300"
              style={{
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                maxHeight: '150px',
              }}
              onError={(e) => {
                console.error('Jana image failed to load:', (e.target as HTMLImageElement).src);
                console.error('Jana state:', janaState);
              }}
              onLoad={() => {
                console.log('Jana image loaded successfully:', janaState);
              }}
            />
            {/* Blink overlay - slower for sad state */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                animation: janaState === 'sad' ? 'janaBlinkSlow 6s ease-in-out infinite' : 'janaBlink 4s ease-in-out infinite',
              }}
            />
          </div>
        </div>

      </div>

      {/* Error message - Floating overlay in center */}
      {showErrorMessage && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="bg-red-500/80 backdrop-blur-md rounded-2xl px-6 py-3 shadow-xl border border-red-400/50 text-center" style={{ animation: 'fadeInOut 1s ease-in-out forwards' }}>
            <p className="text-white font-semibold text-base sm:text-lg">{errorText}</p>
          </div>
        </div>
      )}

      {/* Progress Bar - Top */}
      <div className="w-full max-w-3xl mb-2 sm:mb-3 z-20 px-4 sm:px-6">
        <div className="h-2 sm:h-3 bg-emerald-900/50 rounded-full overflow-hidden">
          <div=            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Title - Premium glass eco card */}
      <div className="text-center mb-3 sm:mb-4 px-4 z-20">
        <div className="bg-gradient-to-br from-emerald-800/75 to-emerald-900/80 backdrop-blur-lg rounded-2xl p-2 sm:p-3 shadow-xl max-w-xl mx-auto border border-emerald-400/30" style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(74, 222, 128, 0.1)' }}>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-1 tracking-tight">
            {messages.recyclingGame?.helpHealPlanet || '🌍 Help Heal the Planet'}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 font-medium">
            {messages.recyclingGame?.sortWaste || 'Sort the waste into the correct recycling bins.'}
          </p>
        </div>
      </div>

      {/* Waste Items - Centered with responsive positioning */}
      <div className="relative flex-1 flex items-center justify-center z-20 px-4">
        <div className="flex justify-center items-center gap-4 sm:gap-6 lg:gap-8" style={{ maxWidth: '90vw' }}>
          {activeItems.map((activeItem) => {
            const itemName = getItemName(activeItem.item);
            const isDraggingThis = draggingItemId === activeItem.id;
            
            return (
              <div key={activeItem.id} className="relative flex flex-col items-center">
                <div
                  ref={(el) => { itemRef.current[activeItem.id] = el; }}
                  className={`rounded-3xl flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none ${
                    isDraggingThis ? "scale-110 shadow-2xl z-50" : "shadow-xl"
                  } ${
                    showSuccess ? "animate-pulse bg-emerald-500/30" : ""
                  } ${
                    showError ? "animate-shake bg-red-500/30" : ""
                  }`}
                  style={{
                    width: 'min(25vw, 120px)',
                    height: 'min(25vw, 120px)',
                    minWidth: '80px',
                    minHeight: '80px',
                    background: "rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(10px)",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                    transform: isDraggingThis 
                      ? `translate3d(${activeItem.position.x * (window.innerWidth / 100)}px, ${activeItem.position.y * (window.innerHeight / 100)}px, 0)`
                      : 'translate3d(0, 0, 0)',
                    transition: isDraggingThis ? 'none' : 'transform 0.3s ease-out',
                    willChange: 'transform',
                    touchAction: 'none',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    WebkitTouchCallout: 'none',
                  }}
                  onPointerDown={(e) => handleDragStart(activeItem.id, e)}
                  onPointerMove={(e) => handleDragMove(activeItem.id, e)}
                  onPointerUp={(e) => handleDragEnd(activeItem.id, e)}
                  onPointerCancel={(e) => handleDragEnd(activeItem.id, e)}
                >
                  <img 
                    src={activeItem.item.icon} 
                    alt={itemName} 
                    style={{
                      width: '70%',
                      height: '70%',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                      mixBlendMode: 'multiply',
                    }}
                  />
                </div>
                <p className="text-center mt-2 sm:mt-3 font-semibold text-xs sm:text-sm text-white bg-gradient-to-r from-emerald-800/70 to-emerald-900/80 backdrop-blur-md rounded-full px-3 py-1 sm:px-4 sm:py-2 border border-emerald-400/30 shadow-lg" style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)' }}>{itemName}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bins - Bottom area with larger icons */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4 w-full max-w-2xl px-4 sm:px-6 mb-4 z-20">
        {BINS.map((bin) => (
          <div
            key={bin.type}
            id={`bin-${bin.type}`}
            className="relative rounded-xl sm:rounded-2xl aspect-square flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${bin.color}25, ${bin.color}15)`,
              border: `2px solid ${bin.color}`,
              boxShadow: `0 4px 16px ${bin.color}40, 0 0 0 1px ${bin.color}20`,
              minHeight: 'min(18vw, 80px)',
              maxHeight: '120px',
            }}
          >
            {/* Bin Image - 70-80% of container */}
            <img 
              src={bin.icon} 
              alt={bin.type}
              style={{
                width: '75%',
                height: '75%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
              }}
            />
          </div>
        ))}
      </div>

      {/* Legend - Lower right corner */}
      <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-20 bg-gradient-to-br from-emerald-800/75 to-emerald-900/80 backdrop-blur-lg rounded-xl p-2 sm:p-3 shadow-xl border border-emerald-400/30" style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(74, 222, 128, 0.1)' }}>
        <div className="space-y-1 sm:space-y-1.5 text-xs sm:text-xs">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full" style={{ backgroundColor: '#FBBF24' }} />
            <span className="text-white font-medium text-xs sm:text-sm">{messages.recyclingGame?.plastic || 'Plastic'}</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full" style={{ backgroundColor: '#3B82F6' }} />
            <span className="text-white font-medium text-xs sm:text-sm">{messages.recyclingGame?.paper || 'Paper'}</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full" style={{ backgroundColor: '#10B981' }} />
            <span className="text-white font-medium text-xs sm:text-sm">{messages.recyclingGame?.glass || 'Glass'}</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full" style={{ backgroundColor: '#A16207' }} />
            <span className="text-white font-medium text-xs sm:text-sm">{messages.recyclingGame?.organic || 'Organic'}</span>
          </div>
        </div>
      </div>

      {/* Success Animation - Growing leaf with glow */}
      {showSuccess && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
          <div 
            className="relative"
            style={{
              animation: 'successLeaf 0.8s ease-out forwards',
            }}
          >
            <div className="absolute inset-0 bg-emerald-400/30 blur-xl rounded-full scale-150" />
            <svg 
              width="80" height="80" viewBox="0 0 24 24" 
              fill="#4ade80" 
              className="relative z-10 drop-shadow-lg"
            >
              <path d="M12 2C12 2 8 6 8 10C8 14 12 18 12 22C12 18 16 14 16 10C16 6 12 2 12 2Z" />
              <path d="M12 6C12 6 10 8 10 10C10 12 12 14 12 16C12 14 14 12 14 10C14 8 12 6 12 6Z" fill="#22c55e" />
            </svg>
            {/* Sparkles */}
            <div className="absolute -top-2 -right-2 w-3 h-3 bg-yellow-300 rounded-full animate-ping" />
            <div className="absolute -bottom-1 -left-3 w-2 h-2 bg-emerald-300 rounded-full animate-ping" style={{ animationDelay: '0.2s' }} />
            <div className="absolute top-1/2 -right-4 w-2 h-2 bg-white rounded-full animate-ping" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: scale(0.9); }
          15% { opacity: 1; transform: scale(1); }
          85% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.9); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
        
        @keyframes janaFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        
        @keyframes janaBreathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.015); }
        }
        
        @keyframes janaBlink {
          0%, 45%, 55%, 100% { opacity: 0; }
          50% { opacity: 0.15; }
        }
        
        @keyframes janaBlinkSlow {
          0%, 48%, 52%, 100% { opacity: 0; }
          50% { opacity: 0.12; }
        }
        
        @keyframes janaClap {
          0%, 100% { transform: scaleX(1); }
          25% { transform: scaleX(1.05) rotate(2deg); }
          50% { transform: scaleX(1) rotate(0deg); }
          75% { transform: scaleX(1.05) rotate(-2deg); }
        }
        
        @keyframes janaLower {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(8px); }
        }
        
        @keyframes janaHappyBounce {
          0%, 100% { transform: translateY(0) scale(1); }
          30% { transform: translateY(-12px) scale(1.08); }
          50% { transform: translateY(-18px) scale(1.12); }
          70% { transform: translateY(-8px) scale(1.04); }
        }
        
        @keyframes janaSadShake {
          0%, 100% { transform: translateX(0) rotate(0deg) translateY(0); }
          15% { transform: translateX(-4px) rotate(-3deg) translateY(-2px); }
          30% { transform: translateX(4px) rotate(3deg) translateY(0); }
          45% { transform: translateX(-3px) rotate(-2deg) translateY(-1px); }
          60% { transform: translateX(3px) rotate(2deg) translateY(0); }
          75% { transform: translateX(-2px) rotate(-1deg); }
          90% { transform: translateX(2px) rotate(1deg); }
        }
        
        @keyframes shadowPulse {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.05); opacity: 0.25; }
        }
        
        @keyframes leafFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-3px) rotate(5deg); }
          50% { transform: translateY(-5px) rotate(0deg); }
          75% { transform: translateY(-3px) rotate(-5deg); }
        }
        
        @keyframes successLeaf {
          0% { transform: scale(0) rotate(-180deg); opacity: 0; }
          50% { transform: scale(1.2) rotate(10deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        
        @keyframes bubblePop {
          0% { transform: scale(0.6) translateY(15px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
