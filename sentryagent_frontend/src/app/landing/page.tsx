"use client"

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const BRAND = {
  purpleFrom: "#7C3AED",
  purpleTo: "#9333EA",
  indigo: "#4F46E5",
  cyan: "#06B6D4",
  neon: "#00FF85",
  darkA: "#0F0F1E",
  darkB: "#1A1A2E",
};

function IconCheck({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function usePrefersDark() {
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [isDark]);
  return [isDark, setIsDark] as const;
}

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`backdrop-blur-md bg-[rgba(255,255,255,0.03)] border border-white/10 rounded-2xl p-6 ${className}`}>{children}</div>
  );
}

export default function SentryAgentLanding() {
  const [isDark] = usePrefersDark();
  const [heroRef, heroInView] = useInView({ threshold: 0.6 });
  const navSolid = !heroInView;

  return (
    <div
      className="min-h-screen font-sans"
      style={{ background: `linear-gradient(180deg, ${BRAND.darkA} 0%, ${BRAND.darkB} 100%)`, color: "#E6E6F0" }}
    >
      <header
        className={`fixed top-4 left-0 right-0 mx-auto z-50 max-w-7xl px-6 transition-all duration-450 ${
          navSolid ? "bg-[rgba(15,15,30,0.7)] backdrop-blur-md border border-white/10 shadow-lg" : "bg-transparent"
        } rounded-2xl`}
      >
        <nav className="flex items-center justify-between py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 cursor-pointer" style={{ color: BRAND.neon }}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#072A20] to-[#00321A] flex items-center justify-center ring-1 ring-white/10">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="8" stroke={BRAND.neon} strokeWidth="1.6" />
                  <path d="M8 12c1.5-3 6-3 7 0" stroke={BRAND.neon} strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </div>
              <span className="font-semibold tracking-tight">SentryAgent</span>
            </div>
            <div className="hidden md:flex items-center gap-6 ml-6 text-sm text-zinc-300">
              <a className="hover:text-white transition">Product</a>
              <a className="hover:text-white transition">Docs</a>
              <a className="hover:text-white transition">Integrations</a>
              <a className="hover:text-white transition">Pricing</a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgba(255,255,255,0.02)] border border-white/10 text-sm">
              GitHub
            </a>
            <button className="px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-[rgba(255,255,255,0.03)] to-[rgba(255,255,255,0.01)] border border-white/10 hover:scale-105 transition">
              Sign up
            </button>
          </div>
        </nav>
      </header>

      <main className="pt-28">
        <section ref={heroRef} className="relative overflow-hidden">
          <motion.div className="absolute inset-0 -z-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} aria-hidden>
            <svg className="absolute top-10 left-[-10%] w-[40vw] opacity-30" viewBox="0 0 600 600" fill="none">
              <defs>
                <linearGradient id="g1" x1="0" x2="1">
                  <stop offset="0%" stopColor={BRAND.purpleFrom} stopOpacity="0.7" />
                  <stop offset="100%" stopColor={BRAND.indigo} stopOpacity="0.7" />
                </linearGradient>
              </defs>
              <path d="M421.2,68.4C458,106,457,190.6,430.3,238.1C403.7,285.7,342.5,295.1,287.4,311.6C232.3,328.1,183.3,351.7,141.1,334.6C98.9,317.4,63.6,259.6,68.8,206.7C74,153.9,119.8,106.9,173.8,78.2C227.8,49.5,384.5,31.1,421.2,68.4Z" fill="url(#g1)" />
            </svg>
            <motion.div className="absolute right-[-8%] top-32 w-[28vw] opacity-25 pointer-events-none" animate={{ rotate: [0, 8, -6, 0] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}>
              <div className="w-full h-72 rounded-3xl" style={{ background: `linear-gradient(135deg, ${BRAND.cyan}, ${BRAND.purpleTo})`, filter: "blur(40px)" }} />
            </motion.div>
            <motion.div className="absolute left-1/2 transform -translate-x-1/2 bottom-[-10%] w-[80vw] h-40 rounded-full opacity-10" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 8, repeat: Infinity }} style={{ background: `radial-gradient(circle at 20% 20%, ${BRAND.neon}, transparent 20%), radial-gradient(circle at 80% 80%, ${BRAND.purpleFrom}, transparent 25%)` }} />
          </motion.div>

          <div className="max-w-7xl mx-auto px-6 py-28">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-3 mb-6">
                  <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: `linear-gradient(90deg, ${BRAND.neon}, ${BRAND.cyan})`, color: "#05140d" }}>
                    Launching 2025 • Early access
                  </span>
                  <span className="text-sm text-zinc-400">Secure your smart contracts before they ship</span>
                </div>

                <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight text-white">
                  SentryAgent — <span style={{ color: BRAND.neon }}>Agentic</span> smart contract security.
                </h1>

                <p className="mt-6 text-zinc-300 max-w-2xl">
                  Multi-agent specialized scanner that blends symbolic analysis, fuzzing, and vulnerability patch suggestions. Designed for modern DevSecOps pipelines and Web3 teams.
                </p>

                <div className="flex gap-4 mt-8 items-center">
                  <a className="inline-flex items-center gap-3 px-5 py-3 rounded-xl font-medium shadow-lg" style={{ background: `linear-gradient(90deg, ${BRAND.neon} 0%, ${BRAND.cyan} 100%)`, color: "#03160f" }}>
                    Get Early Access
                  </a>
                  <a className="inline-flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 text-sm hover:scale-105 transition">Live demo</a>
                </div>

                <div className="mt-8 flex flex-wrap gap-4 text-sm text-zinc-400">
                  <div className="flex items-center gap-2"><IconCheck /> Real-time vulnerability scoring</div>
                  <div className="flex items-center gap-2">CI-friendly annotations</div>
                  <div className="flex items-center gap-2">Auto-fix proposals</div>
                </div>
              </div>

              <div>
                <GlassCard>
                  <div className="flex items-start gap-4">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                  </div>

                  <div className="mt-4 bg-gradient-to-b from-[rgba(0,0,0,0.12)] to-transparent p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs text-zinc-400">sentryagent scan • v0.9</div>
                      <div className="text-xs text-zinc-400">connected</div>
                    </div>

                    <pre className="rounded-lg p-4 text-sm text-[rgba(255,255,255,0.9)] bg-[linear-gradient(180deg,rgba(0,0,0,0.2),rgba(0,0,0,0.08))] overflow-auto">{`> scanning contract: PaymentSplitter.sol
> running agents: Symbolic, Fuzzer, GasAudit

[✓] Reentrancy - HIGH (agent: Symbolic)
  -> trace: transfer -> call -> state change
  -> suggestion: apply reentrancy guard

[!] Gas spike - MEDIUM (agent: GasAudit)
  -> suggestion: optimize loop

[✓] Access control - LOW

Summary: 2 warnings, 1 critical
`}</pre>

                    <div className="mt-4 flex gap-3">
                      <button className="px-4 py-2 rounded-md text-sm" style={{ border: "1px solid rgba(255,255,255,0.04)" }}>
                        Export report
                      </button>
                      <button className="px-4 py-2 rounded-md text-sm" style={{ background: `linear-gradient(90deg, ${BRAND.purpleFrom}, ${BRAND.purpleTo})` }}>
                        Open in workspace
                      </button>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
