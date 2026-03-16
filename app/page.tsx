import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Building2,
  ClipboardList,
  Database,
  ShieldCheck,
  Users,
} from "lucide-react";

const highlights = [
  {
    title: "Barangay Profiling",
    description:
      "Maintain complete resident and family profiling records in one structured system.",
    icon: Users,
  },
  {
    title: "Health Program Tracking",
    description:
      "Monitor consultations, medications, announcements, and outcomes through a unified dashboard.",
    icon: Activity,
  },
  {
    title: "YAKAP Services",
    description:
      "Support pregnancy and community care programs with organized data and workflow tools.",
    icon: ClipboardList,
  },
  {
    title: "Secure Data Operations",
    description:
      "Protect local government records with role-based access and accountable submissions.",
    icon: ShieldCheck,
  },
];

const quickStats = [
  { label: "Core Modules", value: "10+" },
  { label: "Data Workflows", value: "Centralized" },
  { label: "System Availability", value: "24/7" },
];

export default function Page() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-chart-2/15 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-72 w-72 rounded-full bg-chart-1/15 blur-3xl" />
      </div>

      <section className="relative mx-auto flex w-full max-w-7xl flex-col px-6 pb-16 pt-10 sm:px-10 lg:px-16">
        <header className="mb-14 flex items-center justify-between rounded-2xl border border-border/70 bg-card/80 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                City Health Platform
              </p>
              <h1 className="text-lg font-bold sm:text-xl">NAGA CMS</h1>
            </div>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <Link
              href="/auth/workers"
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
            >
              Worker Login
            </Link>
            <Link
              href="/auth/login"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Admin Login
            </Link>
          </div>
        </header>

        <div className="grid items-start gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-4 inline-flex items-center rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-secondary-foreground">
              Official Entry Page
            </p>
            <h2 className="max-w-2xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Community Health Data, Unified for Every Barangay.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              NAGA CMS is the centralized system for profiling, monitoring, and
              reporting barangay health services. Designed for administrators
              and field workers, it keeps health records organized, accessible,
              and ready for action.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Open Admin Portal
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/auth/workers"
                className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-6 py-3 text-sm font-semibold transition hover:bg-muted"
              >
                Open Worker Portal
              </Link>
            </div>

            <div className="mt-8 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
              {quickStats.map((stat) => (
                <article
                  key={stat.label}
                  className="rounded-2xl border border-border/70 bg-card/80 px-4 py-4"
                >
                  <p className="text-xl font-extrabold tracking-tight">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    {stat.label}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <aside className="relative rounded-3xl border border-border/80 bg-card/90 p-6 shadow-2xl shadow-primary/10 backdrop-blur">
            <div className="absolute -right-3 -top-3 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Live Modules
            </div>
            <div className="mb-6 flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">System Coverage</h3>
            </div>
            <div className="space-y-4">
              {highlights.map((item) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.title}
                    className="rounded-2xl border border-border/70 bg-background/70 p-4 transition hover:bg-muted/70"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                        <Icon className="h-4 w-4" />
                      </span>
                      <h4 className="font-semibold">{item.title}</h4>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </aside>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 rounded-2xl border border-border/70 bg-card/70 px-5 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center">
          <p>
            Naga City Community Management System • Barangay Health Operations
            Center
          </p>
          <p className="font-medium text-foreground">Version 1.0</p>
        </div>
      </section>
    </main>
  );
}
