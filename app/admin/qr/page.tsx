"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [query, setQuery] = useState("");

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

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return items;
    }

    return items.filter((item) => {
      return [item.city, item.name, item.address].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      );
    });
  }, [items, query]);

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
          <div className="mb-6 max-w-md">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by city, name, or address"
              className="w-full px-4 py-3 rounded-2xl border outline-none"
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.border,
                color: colors.text,
              }}
            />
          </div>

          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
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
                    <button
                      onClick={() => {
                        // Generate an A4 SVG poster with embedded QR and download it
                        try {
                          const svgWidth = 2480; // A4 300dpi width
                          const svgHeight = 3508; // A4 300dpi height
                          const qrSize = 900; // size of QR to fit into yellow area
                          const qrX = Math.round((svgWidth - qrSize) / 2);
                          const qrY = Math.round((svgHeight - qrSize) / 2 + 40);

                          const posterSvg = `<?xml version="1.0" encoding="utf-8"?>\n` +
                            `<svg xmlns='http://www.w3.org/2000/svg' width='${svgWidth}' height='${svgHeight}' viewBox='0 0 ${svgWidth} ${svgHeight}'>` +
                            `<defs><style>text{font-family:Arial, Helvetica, sans-serif;}</style></defs>` +
                            // Background poster image — place your provided poster at public/poster_base.png
                            `<image href='/poster_base.png' x='0' y='0' width='${svgWidth}' height='${svgHeight}' preserveAspectRatio='xMidYMid slice'/>` +
                            `<g transform='translate(${qrX}, ${qrY})'>` +
                            `${item.qr_svg}` +
                            `</g>` +
                            `</svg>`;

                          const blob = new Blob([posterSvg], { type: "image/svg+xml" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `${item.name.replace(/\s+/g, "_")}_poster.svg`;
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                          URL.revokeObjectURL(url);
                        } catch (e) {
                          // fallback: open new tab with QR svg
                          window.open(getQrSvgDownloadUrl(item.id), "_blank");
                        }
                      }}
                      className="flex-1 px-4 py-2 rounded-xl text-center font-semibold"
                      style={{
                        backgroundColor: `${colors.primary}15`,
                        color: colors.primary,
                      }}
                    >
                      Poster (A4 SVG)
                    </button>
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
