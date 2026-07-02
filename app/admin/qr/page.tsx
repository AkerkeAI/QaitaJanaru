"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "../../components/Sidebar";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  getQrPngDownloadUrl,
  getQrPoints,
  getQrPosterDownloadUrl,
  getQrSvgDownloadUrl,
  getQrZipDownloadUrl,
  QrPointItem,
} from "../../lib/qrApi";
import {
  getPartnerQrCodes,
  getPartnerQrPngDownloadUrl,
  getPartnerQrPosterDownloadUrl,
  getPartnerQrSvgDownloadUrl,
  getPartnerQrZipDownloadUrl,
  PartnerQrAdminItem,
} from "../../lib/partnerQrApi";
import { QrHeaderAction } from "../../components/qr/QrHeaderAction";

export default function AdminQrPage() {
  const { colors } = useTheme();
  const { messages } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab] = useState<"recycling" | "partner">("recycling");
  const [recyclingItems, setRecyclingItems] = useState<QrPointItem[]>([]);
  const [partnerItems, setPartnerItems] = useState<PartnerQrAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        const [recyclingData, partnerData] = await Promise.all([
          getQrPoints(),
          getPartnerQrCodes(),
        ]);
        setRecyclingItems(recyclingData.items);
        setPartnerItems(partnerData.items);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, []);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (tab === "recycling") {
      if (!normalizedQuery) {
        return recyclingItems;
      }

      return recyclingItems.filter((item) => {
        return [item.city, item.name, item.address].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        );
      });
    }

    if (!normalizedQuery) {
      return partnerItems;
    }

    return partnerItems.filter((item) =>
      [
        item.city || "",
        item.address || "",
        item.partner_name || "",
        item.branch_name || "",
        item.qr_identifier,
      ].some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [partnerItems, query, recyclingItems, tab]);

  const currentZipUrl =
    tab === "recycling" ? getQrZipDownloadUrl() : getPartnerQrZipDownloadUrl();

  const downloadPoster = async (url: string, fallbackName: string) => {
    try {
      const response = await fetch(url, {
        method: "GET",
      });
      if (!response.ok) {
        throw new Error("Failed to download poster");
      }
      const filenameHeader =
        response.headers.get("content-disposition") ||
        `attachment; filename=${fallbackName}`;
      const match =
        /filename\*=UTF-8''(.+)|filename="?([^";]+)"?/.exec(filenameHeader);
      const filename = match
        ? decodeURIComponent(match[1] || match[2] || fallbackName)
        : fallbackName;
      const blob = await response.blob();
      const urlObject = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = urlObject;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(urlObject);
    } catch (error) {
      console.error(error);
      window.open(url, "_blank");
    }
  };

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
              {messages.adminQr.title}
            </h1>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <a
              href={currentZipUrl}
              className="px-4 py-2 rounded-2xl font-semibold"
              style={{
                background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
                color: colors.buttonText,
              }}
            >
              {messages.adminQr.downloadAllZip}
            </a>
            <QrHeaderAction />
          </div>
        </header>

        <div className="px-4 pb-8 md:px-6 lg:px-8">
          <div className="mb-6 flex gap-3">
            {[
              {
                id: "recycling" as const,
                label: messages.adminQr.recyclingTab,
              },
              {
                id: "partner" as const,
                label: messages.adminQr.partnerTab,
              },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className="px-5 py-3 rounded-2xl font-semibold border transition-all duration-300"
                style={{
                  backgroundColor:
                    tab === item.id ? `${colors.primary}18` : colors.cardBg,
                  borderColor:
                    tab === item.id ? colors.primary : colors.border,
                  color: tab === item.id ? colors.primary : colors.text,
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mb-6 max-w-md">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={messages.adminQr.searchPlaceholder}
              className="w-full px-4 py-3 rounded-2xl border outline-none"
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.border,
                color: colors.text,
              }}
            />
          </div>

          {loading ? (
            <div>{messages.adminQr.loading}</div>
          ) : (
            <>
              {filteredItems.length === 0 ? (
                <div>{messages.adminQr.noItems}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {tab === "recycling"
                    ? (filteredItems as QrPointItem[]).map((item) => (
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
                              type="button"
                              onClick={() =>
                                void downloadPoster(
                                  getQrPosterDownloadUrl(item.id),
                                  "poster.png",
                                )
                              }
                              className="flex-1 px-4 py-2 rounded-xl text-center font-semibold"
                              style={{
                                backgroundColor: `${colors.primary}15`,
                                color: colors.primary,
                              }}
                            >
                              {messages.adminQr.downloadPoster}
                            </button>
                          </div>
                        </div>
                      ))
                    : (filteredItems as PartnerQrAdminItem[]).map((item) => (
                        <div
                          key={item.id}
                          className="rounded-3xl p-6 border shadow-xl"
                          style={{
                            backgroundColor: colors.cardBg,
                            borderColor: colors.border,
                          }}
                        >
                          <div className="mb-4 space-y-1">
                            <div className="font-bold text-lg">
                              {item.partner_name || messages.adminQr.availablePool}
                            </div>
                            <div
                              className="text-sm"
                              style={{ color: colors.textSecondary }}
                            >
                              {item.branch_name ||
                                `${messages.adminQr.reserved} #${item.id}`}
                            </div>
                            <div
                              className="text-sm"
                              style={{ color: colors.textSecondary }}
                            >
                              {item.city || messages.adminQr.availablePool}
                            </div>
                            <div
                              className="text-sm"
                              style={{ color: colors.textSecondary }}
                            >
                              {item.address || messages.adminQr.availablePool}
                            </div>
                            <div
                              className="inline-flex px-3 py-1 rounded-full text-xs font-semibold"
                              style={{
                                backgroundColor: item.is_assigned
                                  ? `${colors.primary}18`
                                  : `${colors.accent}18`,
                                color: item.is_assigned
                                  ? colors.primary
                                  : colors.accent,
                              }}
                            >
                              {item.is_assigned
                                ? messages.adminQr.assigned
                                : messages.adminQr.reserved}
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
                              href={getPartnerQrPngDownloadUrl(item.id)}
                              className="flex-1 px-4 py-2 rounded-xl text-center font-semibold"
                              style={{
                                backgroundColor: `${colors.primary}15`,
                                color: colors.primary,
                              }}
                            >
                              PNG
                            </a>
                            <a
                              href={getPartnerQrSvgDownloadUrl(item.id)}
                              className="flex-1 px-4 py-2 rounded-xl text-center font-semibold"
                              style={{
                                backgroundColor: `${colors.accent}15`,
                                color: colors.accent,
                              }}
                            >
                              SVG
                            </a>
                            <button
                              type="button"
                              onClick={() =>
                                void downloadPoster(
                                  getPartnerQrPosterDownloadUrl(item.id),
                                  "partner-poster.png",
                                )
                              }
                              className="flex-1 px-4 py-2 rounded-xl text-center font-semibold"
                              style={{
                                backgroundColor: `${colors.primary}15`,
                                color: colors.primary,
                              }}
                            >
                              {messages.adminQr.downloadPoster}
                            </button>
                          </div>
                        </div>
                      ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
