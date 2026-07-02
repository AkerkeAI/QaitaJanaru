"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTheme } from "../../contexts/ThemeContext";

type QrDetectionResult = { rawValue?: string };
type BarcodeDetectorLike = {
  detect: (source: HTMLVideoElement) => Promise<QrDetectionResult[]>;
};
type BarcodeDetectorCtor = new (options: {
  formats: string[];
}) => BarcodeDetectorLike;

export function GlobalQrScanner() {
  const pathname = usePathname();
  const { messages } = useLanguage();
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [scannerReady, setScannerReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const hiddenRoutes = useMemo(() => ["/login", "/register"], []);
  const shouldShow = !hiddenRoutes.includes(pathname);

  const stopScanner = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const startScanner = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setPermissionError(messages.tasks.qrUnsupported);
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
          },
          audio: false,
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const BarcodeDetectorClass = (
          window as Window & { BarcodeDetector?: BarcodeDetectorCtor }
        ).BarcodeDetector;
        if (BarcodeDetectorClass) {
          detectorRef.current = new BarcodeDetectorClass({
            formats: ["qr_code"],
          });
        } else {
          detectorRef.current = null;
        }

        setScannerReady(true);

        const scanLoop = async () => {
          const video = videoRef.current;
          if (!video || video.readyState < 2) {
            animationFrameRef.current = requestAnimationFrame(() => {
              void scanLoop();
            });
            return;
          }

          try {
            if (detectorRef.current) {
              const barcodes = await detectorRef.current.detect(video);
              if (barcodes?.length) {
                const rawValue = barcodes[0]?.rawValue;
                if (rawValue) {
                  console.log("QR detected:", rawValue);
                  setOpen(false);
                  return;
                }
              }
            }
          } catch (error) {
            console.error("QR scan error:", error);
          }

          animationFrameRef.current = requestAnimationFrame(() => {
            void scanLoop();
          });
        };

        animationFrameRef.current = requestAnimationFrame(() => {
          void scanLoop();
        });
      } catch (error) {
        console.error("Failed to start QR scanner:", error);
        setPermissionError(messages.tasks.qrPermissionDenied);
      }
    };

    void startScanner();

    return () => {
      stopScanner();
      setPermissionError(null);
    };
  }, [
    open,
    messages.tasks.qrPermissionDenied,
    messages.tasks.qrUnsupported,
    stopScanner,
  ]);

  if (!shouldShow) {
    return null;
  }

  const userId =
    typeof window !== "undefined"
      ? window.localStorage.getItem("qaitaJanaru_user_id")
      : null;
  const authenticatedRoutes = shouldShow && Boolean(userId);

  return (
    <>
      {authenticatedRoutes && (
        <div className="fixed top-4 right-4 md:top-6 md:right-6 lg:top-8 lg:right-8 z-[70] pointer-events-none">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="w-14 h-14 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 pointer-events-auto"
            style={{
              background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.accent})`,
              color: colors.buttonText,
              border: `1px solid ${colors.primary}55`,
            }}
            aria-label={messages.tasks.openQrScanner}
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4h5v5H4z" />
              <path d="M15 4h5v5h-5z" />
              <path d="M4 15h5v5H4z" />
              <path d="M17 15h3" />
              <path d="M15 17h5" />
              <path d="M17 20h3" />
            </svg>
          </button>
        </div>
      )}

      {authenticatedRoutes && open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setOpen(false)} />

          <div className="relative w-full h-full flex items-center justify-center p-6">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
            />
            <div className="absolute inset-0 bg-black/55" />

            <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-5">
              <div className="w-72 h-72 rounded-3xl border-4 border-white/90 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 border-[24px] border-black/30 rounded-3xl" />
                <div
                  className="absolute top-0 left-0 right-0 h-1.5 animate-pulse"
                  style={{ background: colors.accent }}
                />
              </div>

              <div className="text-center text-white px-4">
                <h2 className="text-2xl font-bold mb-2">
                  {messages.tasks.qrScannerTitle}
                </h2>
                <p className="text-sm text-white/80">
                  {permissionError || messages.tasks.qrScannerDescription}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-6 py-3 rounded-2xl font-semibold backdrop-blur-xl border"
                style={{
                  backgroundColor: "rgba(255,255,255,0.12)",
                  borderColor: "rgba(255,255,255,0.25)",
                  color: "white",
                }}
              >
                {messages.common.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
