import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

type Role = "agent" | "buyer";

type NavItem = { href: string; label: string };

const AGENT_NAV: NavItem[] = [
  { href: "/dashboard", label: "Transactions" },
  { href: "/network", label: "Network" },
  { href: "/analytics", label: "Analytics" },
];

const BUYER_NAV: NavItem[] = [{ href: "/track", label: "My purchase" }];

/**
 * Role-aware application chrome. Agents get a desktop-primary top bar; buyers
 * get a minimal, mobile-first shell with a bottom nav when there is more than
 * one destination. Children render the page body.
 */
export function AppShell({
  role,
  userName,
  children,
}: {
  role: Role;
  userName?: string | null;
  children: React.ReactNode;
}) {
  const nav = role === "agent" ? AGENT_NAV : BUYER_NAV;

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-10 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href={role === "agent" ? "/dashboard" : "/track"}>
            <span className="text-lg font-semibold tracking-tight text-brand">
              {APP_NAME}
            </span>
          </Link>

          {role === "agent" && (
            <nav
              aria-label="Primary"
              className="hidden items-center gap-1 sm:flex"
            >
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-canvas hover:text-ink"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-3">
            {userName && (
              <span className="hidden text-sm text-muted sm:inline">
                {userName}
              </span>
            )}
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-canvas hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
        {role === "agent" && (
          <nav
            aria-label="Primary mobile"
            className="flex items-center gap-1 overflow-x-auto border-t border-line px-2 py-1 sm:hidden"
          >
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-canvas hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
