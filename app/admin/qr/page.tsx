"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "../../components/Sidebar";
import { useTheme } from "../../contexts/ThemeContext";
import {
  getQrPngDownloadUrl,
  getQrPoints,
  getQrSvgDownloadUrl,
  getQrZipDownloadUrl,
  QrPointItem,
} from "../../lib/qrApi";
import { QrHeaderAction } from "../../components/qr/QrHeaderAction";

export default function AdminQrPage() {
  const { colors } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [items, setItems] = useState<QrPointItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const data = await getQrPoints();
        setItems(data.items);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, []);

  return (
    <main
      className="min-h-screen relative overflow-hidden"
      style={{ background: colors.bg, color: colors.text }}
    >
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="flex items-center justify-between p-4 md:p-6 lg:p-8 gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-3 rounded-2xl backdrop-blur-xl border hover:scale-105 transition-all duration-300 shadow-lg group"
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.border,
            }}
            aria-label="Open menu"
          >
            <svg
              className="w-6 h-6 group-hover:text-white transition-colors"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
              stroke={colors.textSecondary}
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-2xl md:text-3xl">🧾</span>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              Admin QR
            </h1>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <a
              href={getQrZipDownloadUrl()}
              className="px-4 py-2 rounded-2xl font-semibold"
              style={{
                background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
                color: colors.buttonText,
              }}
            >
              Download all ZIP
            </a>
            <QrHeaderAction />
          </div>
        </header>

        <div className="px-4 pb-8 md:px-6 lg:px-8">
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl p-6 border shadow-xl"
                  style={{
                    backgroundColor: colors.cardBg,
                    borderColor: colors.border,
                  }}
                >
                  <div className="mb-4">
                    <div className="font-bold text-lg">{item.name}</div>
                    <div
                      className="text-sm"
                      style={{ color: colors.textSecondary }}
                    >
                      {item.city}
                    </div>
                    <div
                      className="text-sm"
                      style={{ color: colors.textSecondary }}
                    >
                      {item.address}
                    </div>
                  </div>

                  <div
                    className="rounded-2xl bg-white p-4 mb-4"
                    dangerouslySetInnerHTML={{ __html: item.qr_svg }}
                  />

                  <div
                    className="text-xs break-all mb-4"
                    style={{ color: colors.textSecondary }}
                  >
                    {item.qr_value}
                  </div>

                  <div className="flex gap-3">
                    <a
                      href={getQrPngDownloadUrl(item.id)}
                      className="flex-1 px-4 py-2 rounded-xl text-center font-semibold"
                      style={{
                        backgroundColor: `${colors.primary}15`,
                        color: colors.primary,
                      }}
                    >
                      PNG
                    </a>
                    <a
                      href={getQrSvgDownloadUrl(item.id)}
                      className="flex-1 px-4 py-2 rounded-xl text-center font-semibold"
                      style={{
                        backgroundColor: `${colors.accent}15`,
                        color: colors.accent,
                      }}
                    >
                      SVG
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
