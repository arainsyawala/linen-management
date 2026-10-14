"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowRightLeft,
  FileWarning,
  ShoppingCart,
  FileText,
  LogOut,
  History,
  CheckCircle2,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "./ui/button";

const navItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    roles: ["ADMIN_EXECUTIVE_HOUSEKEEPER", "STAF_HOUSEKEEPING", "STAF_LAUNDRY"],
  },
  {
    name: "Transaksi Sirkulasi",
    href: "/transactions",
    icon: ArrowRightLeft,
    roles: ["ADMIN_EXECUTIVE_HOUSEKEEPER", "STAF_HOUSEKEEPING", "STAF_LAUNDRY"],
  },
  {
    name: "Serah Terima",
    href: "/handover",
    icon: CheckCircle2,
    roles: ["ADMIN_EXECUTIVE_HOUSEKEEPER", "STAF_HOUSEKEEPING", "STAF_LAUNDRY"],
  },
  {
    name: "Pencatatan Kondisi",
    href: "/condition",
    icon: FileWarning,
    roles: ["ADMIN_EXECUTIVE_HOUSEKEEPER", "STAF_HOUSEKEEPING", "STAF_LAUNDRY"],
  },
  {
    name: "Pengadaan Baru",
    href: "/procurement",
    icon: ShoppingCart,
    roles: ["ADMIN_EXECUTIVE_HOUSEKEEPER"],
  },
  {
    name: "Laporan Bulanan",
    href: "/reports",
    icon: FileText,
    roles: ["ADMIN_EXECUTIVE_HOUSEKEEPER"],
  },
  {
    name: "Histori Transaksi",
    href: "/history",
    icon: History,
    roles: ["ADMIN_EXECUTIVE_HOUSEKEEPER"],
  },
  {
    name: "Kelola Pengguna",
    href: "/users",
    icon: FileText,
    roles: ["ADMIN_EXECUTIVE_HOUSEKEEPER"],
  },
];

const roleLabels: Record<string, string> = {
  ADMIN_EXECUTIVE_HOUSEKEEPER: "Admin / Executive",
  STAF_HOUSEKEEPING: "Staf Housekeeping",
  STAF_LAUNDRY: "Staf Laundry",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const role = session?.user?.role || "";
  const userName = session?.user?.name || "";

  const visibleNavItems = navItems.filter((item) => item.roles.includes(role));

  // Close mobile menu on route change
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-white dark:bg-slate-900 shrink-0">
        <div className="h-16 flex items-center px-6 border-b">
          <h1 className="font-bold text-lg text-emerald-800 dark:text-emerald-400">
            Green Star Park
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-100 font-medium" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"}`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-16 border-b bg-white dark:bg-slate-900 flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center md:hidden gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 -ml-2 text-slate-600 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
            </button>
            <h1 className="font-bold text-lg text-emerald-800 dark:text-emerald-400">
              Green Star
            </h1>
          </div>

          <div className="flex items-center justify-end flex-1 md:w-auto space-x-4">
            <span className="text-sm text-slate-500 hidden sm:inline-block truncate max-w-[200px]">
              Logged in as:{" "}
              <strong className="text-slate-700 dark:text-slate-200">
                {userName}
              </strong>
            </span>

            <ThemeToggle />

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                signOut({ callbackUrl: window.location.origin + "/login" })
              }
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 hidden sm:flex"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Keluar
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                signOut({ callbackUrl: window.location.origin + "/login" })
              }
              className="text-red-600 sm:hidden"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            {/* Drawer */}
            <aside className="relative w-72 max-w-[80%] h-full bg-white dark:bg-slate-900 shadow-xl flex flex-col transform transition-transform duration-300">
              <div className="h-16 flex items-center px-6 border-b shrink-0">
                <h1 className="font-bold text-lg text-emerald-800 dark:text-emerald-400">
                  Green Star Park
                </h1>
              </div>
              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {visibleNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-3 rounded-md transition-colors ${isActive ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-100 font-medium" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"}`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
              <div className="p-4 border-t">
                <button
                  onClick={() =>
                    signOut({ callbackUrl: window.location.origin + "/login" })
                  }
                  className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 font-medium transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Keluar
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-10">
          {children}
        </main>
      </div>
    </div>
  );
}
