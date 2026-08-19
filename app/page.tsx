import Link from "next/link";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
      <span className="mb-4 inline-flex items-center rounded-full bg-brand-soft px-3 py-1 text-sm font-medium text-brand">
        {APP_NAME}
      </span>
      <h1 className="text-balance text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
        Buying a home, as clear as tracking a delivery.
      </h1>
      <p className="mt-5 text-balance text-lg text-muted">{APP_TAGLINE}</p>

      <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Link
          href="/signup"
          className="inline-flex items-center justify-center rounded-xl bg-brand px-6 py-3 text-base font-semibold text-white transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Get started as an agent
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-xl border border-line bg-surface px-6 py-3 text-base font-semibold text-ink transition hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Sign in
        </Link>
      </div>

      <p className="mt-8 text-sm text-muted">
        Invited by your agent? Open the link in your email to get started.
      </p>
    </main>
  );
}
