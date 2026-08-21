"use client";

import Link from "next/link";
import { useLanguage } from "./contexts/LanguageContext";
import { UserStatusHeader } from "./components/UserStatusHeader";

export default function Home() {
  const { messages } = useLanguage();

  return (
    <main className="min-h-screen pb-28">
      <div className="max-w-md mx-auto px-4 pt-6">
        {/* Top bar: branding + small Jana */}
        <header className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold text-[var(--foreground)]">♻️ {messages.common?.appName || 'QaitaJanaru'}</h1>
            <p className="text-sm app-muted">{messages.home?.greeting || 'Welcome back'}</p>
          </div>
          <img src="/assets/recycling-game/jana-idle.png" alt="Jana" className="h-12 w-12 object-contain" />
        </header>

        {/* Status + Scan button */}
        <section className="space-y-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 app-card p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs app-muted">{messages.home?.ecoPointsLabel || 'Eco-points'}</div>
                  <div className="text-2xl font-bold">🌱 1,240</div>
                </div>
                <div className="text-right app-muted text-xs">Level 6</div>
              </div>
            </div>

            <button className="ml-2 px-4 py-3 app-btn-primary font-semibold shadow-sm">Scan Waste</button>
          </div>

          <div className="app-card p-3">
            <h3 className="text-sm font-semibold mb-2">{messages.home?.featuredRewardsTitle || 'Rewards'}</h3>
            <div className="flex gap-3 overflow-x-auto py-1">
              <div className="min-w-[160px] p-3 bg-white rounded-xl shadow-sm border">
                <div className="text-sm font-semibold">Reusable Bottle</div>
                <div className="text-xs app-muted">250 pts</div>
              </div>
              <div className="min-w-[160px] p-3 bg-white rounded-xl shadow-sm border">
                <div className="text-sm font-semibold">Eco Bag</div>
                <div className="text-xs app-muted">120 pts</div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission / Challenge */}
        <section className="mb-4">
          <div className="app-card p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">{messages.home?.currentChallengeTitle || 'Current Challenge'}</div>
                <div className="text-xs app-muted">{messages.home?.currentChallengeDesc || 'Recycle 5 items this week'}</div>
              </div>
              <div className="text-green-600 font-semibold">Progress: 2/5</div>
            </div>
          </div>
        </section>

        {/* Recent activity */}
        <section>
          <h4 className="text-sm font-semibold mb-2">{messages.home?.recentActivity || 'Recent activity'}</h4>
          <div className="space-y-2">
            <div className="app-card p-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">+15 pts</div>
                <div className="text-xs app-muted">Recycled plastic bottle</div>
              </div>
              <div className="text-xs app-muted">2h ago</div>
            </div>
            <div className="app-card p-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">+30 pts</div>
                <div className="text-xs app-muted">Participated in challenge</div>
              </div>
              <div className="text-xs app-muted">1d ago</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}