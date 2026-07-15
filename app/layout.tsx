import type { Metadata } from "next";
import "./globals.css";
import { IconMap } from "@/components/icons";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "ParcelClear — Land Title Examination",
  description:
    "AI-assisted title examination and Title Report drafting for land parcels in India.",
};

// Apply the saved theme before paint to avoid a flash of the wrong theme.
const themeInit = `try{var t=localStorage.getItem('parcelclear.theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <div className="flex h-screen flex-col overflow-hidden">
          <Topbar />
          <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

function Topbar() {
  const tabs = ["New Report", "Reports", "Guidance"];
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <IconMap className="h-5 w-5" />
          </div>
          <span className="text-[15px] font-bold tracking-tight text-slate-900 dark:text-white">
            Parcel<span className="text-brand-600">Clear</span>
          </span>
        </div>
        <nav className="hidden items-center gap-1 md:flex">
          {tabs.map((t, i) => (
            <span
              key={t}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                i === 0
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {t}
            </span>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-900 dark:text-brand-200">
            RH
          </div>
          <span className="hidden text-sm font-medium text-slate-700 dark:text-slate-200 sm:block">
            Title Desk
          </span>
        </div>
      </div>
    </header>
  );
}
