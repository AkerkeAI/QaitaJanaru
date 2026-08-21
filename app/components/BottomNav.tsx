"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const path = usePathname();

  const items = [
    { href: "/", label: "Home", icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 11.5L12 4l9 7.5v7a1 1 0 0 1-1 1h-5v-5H9v5H4a1 1 0 0 1-1-1v-7z"/></svg>
    )},
    { href: "/leaderboard", label: "Rankings", icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18"/></svg>
    )},
    { href: "/rewards", label: "Rewards", icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 2l2.09 6.26L20 9.27l-4.91 3.57L16.18 20 12 16.77 7.82 20l1.09-7.16L4 9.27l5.91-1.01L12 2z"/></svg>
    )},
    { href: "/profile", label: "Profile", icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM3 21a9 9 0 0 1 18 0"/></svg>
    )},
    { href: "/more", label: "More", icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 6v.01M12 12v.01M12 18v.01"/></svg>
    )},
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[min(640px,94%)] bg-white app-card px-3 py-2 flex items-center justify-between shadow-md" style={{ borderRadius: 999 }}>
      {items.map((it) => {
        const active = path === it.href || (it.href === "/" && path === "/");
        return (
          <Link key={it.href} href={it.href} className={`flex-1 flex flex-col items-center justify-center text-sm gap-1 py-2 ${active ? 'text-[var(--qaita-green)] font-semibold' : 'app-muted'}`}>
            {it.icon}
            <span className="text-xs">{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
