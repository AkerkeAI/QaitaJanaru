"use client";

import { RecyclingMiniGame } from "../components/RecyclingMiniGame";

export default function DemoPage() {
  return (
    <div className="min-h-screen">
      <RecyclingMiniGame isDemo={true} />
    </div>
  );
}
