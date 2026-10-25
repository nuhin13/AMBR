"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  BarChart3, Boxes, CreditCard, FileText, FolderTree, HelpCircle, History, Home, Image as ImageIcon, Layers, LayoutDashboard, LogOut,
  Mail, Megaphone, Menu, Package, Send, Settings, ShieldCheck, ShoppingBag, Star, Tags, TicketPercent, Truck, Users, ExternalLink,
} from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { AdminNavGroup } from "./nav";

const ICONS = {
  BarChart3, Boxes, CreditCard, FileText, FolderTree, HelpCircle, History, Home, Image: ImageIcon, Layers, LayoutDashboard,
  Mail, Megaphone, Package, Send, Settings, ShieldCheck, ShoppingBag, Star, Tags, TicketPercent, Truck, Users,
} as const;

function NavList({ groups, onNavigate }: { groups: AdminNavGroup[]; onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="space-y-6">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="eyebrow mb-2 px-3 text-[10px] text-gold/80">{g.title}</p>
          <ul className="space-y-0.5">
            {g.items.map((i) => {
              const Icon = ICONS[i.icon as keyof typeof ICONS] ?? LayoutDashboard;
              const active = i.href === "/admin" ? path === "/admin" : path.startsWith(i.href);
              return (
                <li key={i.href}>
                  <Link
                    href={i.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-[2px] px-3 py-2 text-[13.5px] transition-colors",
                      active ? "bg-cream/10 text-cream" : "text-cream/70 hover:bg-cream/5 hover:text-cream",
                    )}
                  >
                    <Icon className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
                    {i.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminShell({ groups, user, logout, children }: { groups: AdminNavGroup[]; user: { name: string; role: string }; logout: () => Promise<void>; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const footer = (
    <div className="space-y-1 border-t border-cream/10 pt-4 text-[13px]">
      <p className="px-3 text-cream">{user.name}</p>
      <p className="px-3 text-[11px] uppercase tracking-[0.14em] text-cream/50">{user.role.replace("_", " ")}</p>
      <Link href="/" className="flex items-center gap-3 rounded-[2px] px-3 py-2 text-cream/70 hover:text-cream" target="_blank">
        <ExternalLink className="size-4" aria-hidden /> View store
      </Link>
      <form action={logout}>
        <button className="flex w-full items-center gap-3 rounded-[2px] px-3 py-2 text-left text-cream/70 hover:text-cream">
          <LogOut className="size-4" aria-hidden /> Sign out
        </button>
      </form>
    </div>
  );
  return (
    <div className="min-h-dvh bg-cream lg:grid lg:grid-cols-[248px_1fr] print:block print:bg-white">
      <aside className="sticky top-0 hidden h-dvh flex-col overflow-y-auto bg-burgundy px-3 py-6 lg:flex print:hidden">
        <Link href="/admin" className="mb-8 px-3">
          <span className="font-serif text-2xl tracking-[0.12em] text-cream">AMBR</span>
          <span className="eyebrow ml-2 text-[10px] text-gold">Admin</span>
        </Link>
        <div className="flex-1"><NavList groups={groups} /></div>
        {footer}
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-burgundy px-4 text-cream lg:hidden print:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open admin menu" className="-ml-2 p-2"><Menu className="size-5" /></button>
          <span className="font-serif text-lg tracking-[0.12em]">AMBR <span className="eyebrow text-[10px] text-gold">Admin</span></span>
          <span className="w-9" />
        </header>
        <Sheet open={open} onOpenChange={setOpen} side="left" title="Admin menu" className="bg-burgundy text-cream">
          <div className="flex min-h-full flex-col gap-6 bg-burgundy px-3 py-5">
            <NavList groups={groups} onNavigate={() => setOpen(false)} />
            {footer}
          </div>
        </Sheet>
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-10 print:p-0">{children}</main>
      </div>
    </div>
  );
}
