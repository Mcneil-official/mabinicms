import Link from "next/link";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";

const chips = [
  "Resident-Centered Care",
  "Connected Barangay Workflows",
  "Secure Health Data",
];

const aboutParagraphs = [
  "MABINICARE is a community-focused health information system designed to modernize how local health services are delivered, tracked, and improved. It gives municipal and barangay teams a shared digital workspace for patient records, field activities, and program updates.",
  "By replacing disconnected files and manual logs, the platform creates a seamless workflow from data entry to reporting. Health workers spend less time searching for records and more time supporting residents, planning interventions, and responding to urgent needs.",
  "Beyond daily operations, MABINICARE supports stronger long-term public health governance through secure access controls, consistent data structure, and decision-ready reporting at both barangay and municipal levels.",
];

export default function Page() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-100 text-slate-900">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(37,99,235,0.075) 1px, transparent 1px), linear-gradient(to bottom, rgba(37,99,235,0.075) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-300/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl" />
      </div>

      <section className="relative mx-auto w-full max-w-7xl px-6 pb-12 pt-8 sm:px-10 lg:px-16">
        <header className="mb-10 rounded-2xl border border-blue-200/70 bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="/mabini-logo.png"
                alt="MabiniCare official logo"
                width={40}
                height={40}
                className="h-10 w-10 rounded-full border border-blue-200 bg-white object-cover"
                priority
              />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-700/80">
                  MUNICIPAL HEALTH PLATFORM
                </p>
                <h1 className="text-xl font-bold leading-tight">MabiniCare</h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/auth/login"
                className="rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                Barangay Staff Login
              </Link>
              <Link
                href="/auth/workers"
                className="rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                City Worker Login
              </Link>
              <Link
                href="/auth/admin"
                className="rounded-full bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-800"
              >
                Admin Login
              </Link>
            </div>
          </div>
        </header>

        <section className="mb-10">
          <p className="mb-4 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">
            OFFICIAL ACCESS PAGE
          </p>

          <h2 className="max-w-4xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Modern Health Operations for Every Barangay.
          </h2>

          <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg">
            MabiniCare centralizes profiling, monitoring, and reporting for barangay health services. Built for admins and field workers, it keeps records organized and actionable.
          </p>

          <div className="mt-7 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
              >
                {chip}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-blue-200/70 bg-white/95 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                ABOUT MABINICARE
              </p>
              <h3 className="mb-6 text-4xl font-black leading-tight tracking-tight text-slate-900">
                A digital public health platform for the Municipality of Mabini.
              </h3>

              <div className="space-y-6 text-sm leading-8 text-slate-600">
                {aboutParagraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>

            <aside className="rounded-3xl border border-blue-200/80 bg-blue-50/60 p-6">
              <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-700">
                <ShieldCheck className="h-4 w-4" />
                BUILT FOR PUBLIC SERVICE
              </p>

              <p className="mb-6 text-sm leading-7 text-slate-600">
                Purpose-built for local government health operations in Mabini, with a strong focus on coordination, continuity of care, and accountable data management.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-2xl font-black leading-none text-slate-900">24/7</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    SYSTEM ACCESS
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-2xl font-black leading-none text-slate-900">10+</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    CORE MODULES
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <footer className="mt-6 rounded-xl border border-blue-200/70 bg-white/90 px-4 py-3 text-sm text-slate-600">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p>MabiniCare | Barangay Health Operations</p>
            <p className="font-medium text-slate-700">Version 1.0</p>
          </div>
        </footer>
      </section>
    </main>
  );
}
