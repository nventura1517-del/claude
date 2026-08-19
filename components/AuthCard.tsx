import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-6 text-center">
        <Link href="/">
          <span className="text-xl font-semibold tracking-tight text-brand">
            {APP_NAME}
          </span>
        </Link>
      </div>
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {title}
        </h1>
        {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && (
        <p className="mt-5 text-center text-sm text-muted">{footer}</p>
      )}
    </main>
  );
}
