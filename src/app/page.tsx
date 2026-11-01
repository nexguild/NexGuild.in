"use client";

import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  AudioLines,
  BadgeCheck,
  Check,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Globe2,
  Layers3,
  Smartphone,
  Sparkles,
  Wallet,
} from "lucide-react";
import { NexGuildLogo } from "@/components/ui/nexguild-logo";

const earningWays = [
  {
    icon: ClipboardCheck,
    title: "Flexible tasks",
    description: "Put your skills to work on research, content, and project-based tasks.",
    href: "/earn/tasks",
    label: "Explore tasks",
    tone: "mint",
  },
  {
    icon: Sparkles,
    title: "Surveys & offers",
    description: "Discover partner surveys, app offers, and other activities in one place.",
    href: "/earn/tasks",
    label: "See opportunities",
    tone: "blue",
  },
  {
    icon: Smartphone,
    title: "Remote jobs",
    description: "Find flexible remote roles and work-from-home opportunities.",
    href: "/earn/jobs",
    label: "Browse jobs",
    tone: "amber",
  },
];

const steps = [
  { number: "01", title: "Create your account", description: "Join for free and set up your contributor profile." },
  { number: "02", title: "Find your next opportunity", description: "Explore work that matches your interests and availability." },
  { number: "03", title: "Earn and redeem", description: "Get NexCoins for approved activity and explore available rewards." },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7faf9] text-slate-900">
      <header className="relative z-20 border-b border-[#0f3d36]/10 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <NexGuildLogo theme="light" href="/" />
          <nav aria-label="Main navigation" className="hidden items-center gap-8 md:flex">
            <Link href="#opportunities" className="text-sm text-slate-600 transition hover:text-[#0f766e]">Ways to earn</Link>
            <Link href="#how-it-works" className="text-sm text-slate-600 transition hover:text-[#0f766e]">How it works</Link>
            <Link href="/client" className="text-sm text-slate-600 transition hover:text-[#0f766e]">For organizations</Link>
          </nav>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/login" className="rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900">
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[#14b8a6] px-4 text-sm font-semibold text-[#041b1b] shadow-[0_8px_28px_rgba(20,184,166,0.2)] transition hover:-translate-y-0.5 hover:bg-[#5eead4] sm:px-5"
            >
              Join free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_55%_at_78%_22%,rgba(20,184,166,0.17),transparent_72%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-16 sm:px-8 sm:pb-24 sm:pt-24 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10 lg:pt-28">
          <div className="max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#14b8a6]/25 bg-[#14b8a6]/[0.08] px-3.5 py-2 text-xs font-semibold tracking-wide text-[#0f766e]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5eead4] shadow-[0_0_12px_rgba(94,234,212,0.8)]" />
              A better way to put your time to work
            </div>
            <h1 className="max-w-[720px] text-balance text-5xl font-semibold leading-[1.04] tracking-[-0.055em] sm:text-6xl lg:text-[4.35rem]">
              Make your time
              <span className="mt-1 block bg-gradient-to-r from-[#0f766e] via-[#0d9488] to-[#b7791f] bg-clip-text text-transparent">
                count for more.
              </span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Find tasks, surveys, and remote opportunities in one simple workspace.
              Build momentum at your pace and track your NexCoins in one place.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#14b8a6] px-7 text-sm font-bold text-[#041b1b] shadow-[0_12px_34px_rgba(20,184,166,0.24)] transition hover:-translate-y-0.5 hover:bg-[#5eead4]"
              >
                Get started for free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/opportunities"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#0f3d36]/15 bg-white px-7 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#0f766e]/40 hover:bg-[#eff9f6]"
              >
                Explore opportunities <ArrowDownRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#0f766e]" /> Free to join</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#0f766e]" /> Work at your pace</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#0f766e]" /> Clear reward tracking</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[560px] lg:ml-auto">
            <div aria-hidden className="absolute -inset-8 rounded-[3rem] bg-[#14b8a6]/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-[#0f3d36]/10 bg-white p-4 shadow-[0_28px_75px_rgba(15,61,54,0.12)] sm:p-6">
              <div className="flex items-center justify-between border-b border-[#0f3d36]/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#14b8a6]/10 text-[#0f766e]">
                    <Layers3 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Your contributor space</p>
                    <p className="mt-0.5 text-xs text-slate-500">A quick look at NexGuild</p>
                  </div>
                </div>
                <span className="rounded-full border border-[#14b8a6]/20 bg-[#14b8a6]/[0.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#0f766e]">
                  Preview
                </span>
              </div>

              <div className="mt-5 rounded-2xl border border-[#14b8a6]/15 bg-gradient-to-br from-[#effaf7] to-[#fff8e9] p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500">One place for your progress</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Find your next win.</p>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#14b8a6]/15 text-[#0f766e]">
                    <CircleDollarSign className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-2">
                  {[
                    { icon: AudioLines, label: "Tasks" },
                    { icon: Sparkles, label: "Surveys" },
                    { icon: Smartphone, label: "Offers" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex flex-col items-center gap-2 rounded-xl border border-[#0f3d36]/10 bg-white px-2 py-3.5 shadow-sm">
                      <Icon className="h-4 w-4 text-[#0f766e]" />
                      <span className="text-[11px] font-medium text-slate-600">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 space-y-2.5">
                <div className="flex items-center gap-3 rounded-xl border border-[#0f3d36]/10 bg-white p-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#14b8a6]/10 text-[#0f766e]">
                    <BadgeCheck className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900">Choose what fits you</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">Availability can vary by location</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-[#0f3d36]/10 bg-white p-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900">See your activity clearly</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">Track NexCoins and reward history</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-3 hidden items-center gap-2.5 rounded-2xl border border-[#0f3d36]/10 bg-white px-4 py-3 shadow-xl sm:flex lg:-left-8">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#14b8a6]/10 text-[#5eead4]">
                <Globe2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900">A global community</p>
                <p className="text-[10px] text-slate-500">Opportunities for contributors worldwide</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#0f3d36]/10 bg-[#edf6f3]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-5 py-6 sm:grid-cols-3 sm:px-8 sm:py-7">
          {[
            { icon: Layers3, title: "One workspace", text: "Tasks, surveys, and offers together" },
            { icon: Wallet, title: "Clear tracking", text: "Follow your NexCoins and activity" },
            { icon: Globe2, title: "Flexible access", text: "Explore what is available to you" },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-3 sm:justify-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#0f3d36]/10 bg-white text-[#0f766e]">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="opportunities" className="mx-auto max-w-7xl scroll-mt-8 px-5 py-20 sm:px-8 sm:py-28">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0f766e]">Find your fit</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">More ways to make progress.</h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
              Explore different kinds of opportunities from a single account. Choose what works for your skills, schedule, and location.
            </p>
          </div>
          <Link href="/opportunities" className="inline-flex items-center gap-2 text-sm font-semibold text-[#5eead4] transition hover:gap-3">
            View opportunities <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {earningWays.map(({ icon: Icon, title, description, href, label, tone }) => (
            <Link
              key={title}
              href={href}
              className="group rounded-2xl border border-[#0f3d36]/10 bg-white p-6 shadow-[0_8px_28px_rgba(15,61,54,0.05)] transition duration-200 hover:-translate-y-1 hover:border-[#14b8a6]/35 hover:bg-[#f5fbf9] hover:shadow-[0_16px_38px_rgba(15,61,54,0.1)]"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                tone === "mint" ? "bg-[#14b8a6]/10 text-[#0f766e]" :
                tone === "blue" ? "bg-sky-100 text-sky-700" :
                "bg-amber-100 text-amber-800"
              }`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 min-h-[3rem] text-sm leading-6 text-slate-600">{description}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#0f766e]">
                {label} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="border-y border-[#0f3d36]/10 bg-[#edf6f3]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0f766e]">A straightforward start</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">From sign-up to your first task.</h2>
            <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">
              Get set up, explore what is available, and keep your progress together in one place.
            </p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.number} className="relative rounded-2xl border border-[#0f3d36]/10 bg-white p-6 shadow-[0_8px_28px_rgba(15,61,54,0.05)]">
                <span className="text-xs font-bold tracking-[0.18em] text-[#0f766e]">{step.number}</span>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
                {index < steps.length - 1 && <ArrowRight className="absolute right-5 top-6 hidden h-4 w-4 text-slate-600 md:block" />}
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-slate-600">
            Opportunity availability, eligibility, and rewards can vary by country and provider.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="flex flex-col items-start justify-between gap-6 rounded-[1.75rem] border border-[#0f766e]/15 bg-gradient-to-br from-[#e7f7f3] to-[#fff7e6] p-7 shadow-[0_12px_36px_rgba(15,61,54,0.08)] sm:flex-row sm:items-center sm:p-10">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0f766e]">Your next step</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Start with what works for you.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">Create an account to see your workspace and explore current opportunities.</p>
          </div>
          <Link href="/signup" className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-[#14b8a6] px-6 text-sm font-bold text-[#041b1b] transition hover:-translate-y-0.5 hover:bg-[#5eead4]">
            Create your free account <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#0f3d36]/10 bg-white/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© {new Date().getFullYear()} NexGuild. Earn by contributing. Grow by participating.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/earn/faq" className="transition hover:text-[#0f766e]">Help & FAQ</Link>
            <Link href="/privacy" className="transition hover:text-[#0f766e]">Privacy</Link>
            <Link href="/client" className="transition hover:text-[#0f766e]">For organizations</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
