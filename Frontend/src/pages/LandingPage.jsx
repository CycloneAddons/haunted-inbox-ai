import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {

  const capabilities = [
    {
      id: 'ephemeral-portals',
      icon: '🕯️',
      title: 'Instant Ephemeral Portals',
      description: 'Summon private, disposable webhook endpoints in milliseconds with zero DNS setup, tunneling, or reverse proxy configuration.',
    },
    {
      id: 'telemetry-stream',
      icon: '📡',
      title: 'Live Payload Telemetry',
      description: 'Stream HTTP headers, query parameters, raw JSON bodies, IP origin, and payload byte sizes with live updates.',
    },
    {
      id: 'ai-autopsy',
      icon: '🔮',
      title: 'Forensic AI Autopsy',
      description: 'Dissect payload anatomy automatically. Infer nested field types, uncover subtle schema regressions, and detect hidden anomalies.',
    },
    {
      id: 'code-synthesis',
      icon: '⚡',
      title: 'Typed Code Synthesis',
      description: 'Transform captured telemetry directly into production-ready Express.js route handlers and strict TypeScript interface definitions.',
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Summon a Catacombs Portal',
      description: 'Create an isolated endpoint in one click with an encrypted token ready to accept live HTTP dispatches.',
    },
    {
      step: '02',
      title: 'Route Your Webhooks',
      description: 'Point Stripe, GitHub, Discord, Shopify, or local cURL scripts directly to your summoned webhook URL.',
    },
    {
      step: '03',
      title: 'Autopsy & Inscribe Code',
      description: 'Inspect incoming payloads in real time, run AI forensics on payload structures, and export typed handlers.',
    },
  ];

  return (
    <div className="relative overflow-hidden pt-4 pb-16">
      <div className="shape-glow-small -top-12 -left-16" />
      <div className="shape-glow-big top-[28rem] -right-24" />
      <div className="shape-glow-small top-[65rem] -left-20" />

      <section className="relative z-10 text-center pt-6 pb-16">

        <div className="max-w-[780px] mx-auto px-4 mb-6">
          <div className="flex justify-center mb-6">
            <img
              src="/long-logo.png"
              alt="Haunted Inbox AI"
              className="h-16 sm:h-20 md:h-24 w-auto object-contain drop-shadow-[0_0_24px_rgba(232,89,12,0.4)]"
            />
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight">
            Intercept, Autopsy, and Synthesize Inbound Webhooks.
          </h1>
        </div>

        <p className="max-w-[660px] mx-auto text-zinc-300 text-sm sm:text-base leading-relaxed mb-8 px-4">
          Summon disposable webhook endpoints in seconds. Stream live HTTP requests, run forensic AI schema autopsies, and synthesize typed Express handlers and TypeScript interfaces.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap mb-12 px-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-7 py-3 text-sm sm:text-base font-bold rounded-full bg-orange-500 text-white hover:bg-orange-400 transition-all shadow-[0_4px_24px_rgba(232,89,12,0.5)] cursor-pointer"
          >
            <span>Launch Catacombs</span>
            <span>⚡</span>
          </Link>

          <a
            href="https://github.com/CycloneAddons/haunted-inbox-ai"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm sm:text-base font-bold rounded-full bg-[#161211] hover:bg-[#221a18] text-zinc-100 border border-white/15 hover:border-orange-500/50 transition-all cursor-pointer"
          >
            <span>GitHub Repository</span>
          </a>
        </div>
      </section>

      <section id="features" className="relative z-10 py-14 border-t border-white/10">
        <div className="text-center max-w-[680px] mx-auto px-4 mb-12">
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3">
            Architected for Developer Webhooks
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Eliminate tedious local tunneling setups and blind webhook debugging. Haunted Inbox AI captures, inspects, and analyzes every inbound byte.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-[1040px] mx-auto px-4">
          {capabilities.map((cap) => (
            <div
              key={cap.id}
              className="group rounded-2xl bg-[#120e0d] border border-white/10 hover:border-orange-500/40 p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(232,89,12,0.15)]"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">{cap.icon}</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">
                {cap.title}
              </h3>
              <p className="text-xs sm:text-[13px] text-zinc-400 leading-relaxed m-0">
                {cap.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="relative z-10 py-14 border-t border-white/10">
        <div className="text-center max-w-[680px] mx-auto px-4 mb-12">
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3">
            How It Works
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            From zero to fully-typed webhook handlers in under sixty seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1040px] mx-auto px-4">
          {steps.map((st) => (
            <div
              key={st.step}
              className="rounded-2xl bg-[#120e0d] border border-white/10 p-6 relative overflow-hidden"
            >
              <div className="text-3xl font-bold font-mono text-orange-500/30 mb-3">
                {st.step}
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                {st.title}
              </h3>
              <p className="text-xs sm:text-[13px] text-zinc-400 leading-relaxed m-0">
                {st.description}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-bold rounded-full bg-white text-orange-600 hover:bg-orange-500 hover:text-white transition-all shadow-[0_4px_20px_rgba(232,89,12,0.4)] cursor-pointer"
          >
            <span>Open Catacombs Workbench</span>
            <span>⚡</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
