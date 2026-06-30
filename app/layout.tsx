import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { IconDashboard, IconMap, IconScale, IconShield } from "@/components/icons";

export const metadata: Metadata = {
  title: "ParcelClear — Land Due Diligence",
  description:
    "AI-assisted title and due-diligence review for land parcels in India.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar />
            <main className="scroll-thin flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}

function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
          <IconMap className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-slate-900">ParcelClear</div>
          <div className="text-[11px] text-slate-500">Land Diligence Suite</div>
        </div>
      </div>

      <nav className="mt-2 flex flex-col gap-0.5 px-3">
        <NavLink href="/" icon={<IconDashboard className="h-5 w-5" />}>
          Dashboard
        </NavLink>
        <NavLink href="/parcels/new" icon={<IconShield className="h-5 w-5" />}>
          New Diligence
        </NavLink>
      </nav>

      <div className="mt-auto px-4 py-4">
        <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <IconScale className="h-4 w-4 text-brand-600" />
            Jurisdiction
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            Configured for Karnataka revenue records. Multi-state support is on
            the roadmap.
          </p>
        </div>
      </div>
    </aside>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
    >
      <span className="text-slate-400">{icon}</span>
      {children}
    </Link>
  );
}

function Topbar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white/80 px-5 backdrop-blur">
      <div className="flex items-center gap-2 md:hidden">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-white">
          <IconMap className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold">ParcelClear</span>
      </div>
      <div className="hidden text-sm text-slate-400 md:block">
        Title &amp; Due-Diligence Workspace
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
          Demo · Mock AI
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
          RH
        </div>
      </div>
    </header>
  );
}
