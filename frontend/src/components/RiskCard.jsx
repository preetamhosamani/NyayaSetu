/**
 * RiskCard.jsx — NyaySetu Fraud Risk Score + Legal Classification Card
 * Rendered on the Draft Review screen whenever fraud parameters are present.
 */
import React, { useState } from 'react';
import {
  ShieldAlert, AlertTriangle, CheckCircle2, Scale,
  FileText, Phone, ChevronDown, ChevronUp, Gavel
} from 'lucide-react';

// ── Meter bar sub-component ────────────────────────────────────────────────
function RiskMeter({ score }) {
  const pct = Math.min(Math.max(score, 0), 100);
  const color =
    pct >= 71 ? '#dc2626'   // red-600
    : pct >= 31 ? '#d97706' // amber-600
    : '#059669';            // emerald-600

  return (
    <div className="mt-3 mb-1">
      <div className="flex justify-between text-xs font-semibold mb-1 opacity-70">
        <span>0 — Low</span>
        <span>Moderate</span>
        <span>Critical — 100</span>
      </div>
      <div className="relative h-3 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-3 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
        {/* tick marks */}
        <div className="absolute top-0 left-[30%] h-full w-px bg-white/60" />
        <div className="absolute top-0 left-[70%] h-full w-px bg-white/60" />
      </div>
      <div className="flex justify-between mt-0.5">
        <span className="text-[10px] text-gray-400">30</span>
        <span className="text-[10px] text-gray-400">70</span>
      </div>
    </div>
  );
}

// ── Badge sub-component ────────────────────────────────────────────────────
function SectionBadge({ label, variant }) {
  const cls =
    variant === 'bns'
      ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
      : 'bg-sky-50 text-sky-800 border-sky-200';
  return (
    <span className={`inline-block px-2 py-0.5 rounded-lg border text-[10px] font-semibold leading-tight ${cls}`}>
      {label}
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function RiskCard({ riskData, language = 'en' }) {
  const [legalOpen, setLegalOpen] = useState(false);

  if (!riskData) return null;

  const {
    risk_score,
    risk_tier,
    urgency_marker,
    actionable_recommendations = [],
    evidence_checklist = [],
    golden_hour_active = false,
    legal_guidance = {},
  } = riskData;

  const isCritical = risk_score >= 71;
  const isModerate = risk_score >= 31 && risk_score < 71;

  // Outer card border / bg
  const cardCls = isCritical
    ? 'border-red-300 bg-red-50'
    : isModerate
    ? 'border-amber-300 bg-amber-50'
    : 'border-emerald-300 bg-emerald-50';

  const headerIcon = isCritical
    ? <ShieldAlert className="w-6 h-6 text-red-600 animate-pulse" />
    : isModerate
    ? <AlertTriangle className="w-6 h-6 text-amber-600" />
    : <CheckCircle2 className="w-6 h-6 text-emerald-600" />;

  const badgeCls = isCritical
    ? 'bg-red-600 text-white'
    : isModerate
    ? 'bg-amber-500 text-white'
    : 'bg-emerald-600 text-white';

  return (
    <div className={`rounded-2xl border-2 ${cardCls} shadow-md my-4 overflow-hidden`}>
      {/* ── Header ── */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {headerIcon}
            <span className="font-bold text-base text-gray-900 tracking-tight">
              Fraud Risk Assessment
            </span>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-extrabold ${badgeCls} shadow`}>
            {risk_score}/100
          </span>
        </div>

        {/* Score meter */}
        <RiskMeter score={risk_score} />

        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2">
          {risk_tier}
        </p>
        <p className="text-sm font-bold text-gray-900 mt-0.5">{urgency_marker}</p>
      </div>

      {/* ── Golden Hour Banner ── */}
      {golden_hour_active && (
        <div className="mx-5 mb-3 flex items-center gap-2 bg-red-600 text-white rounded-xl px-3 py-2 text-xs font-semibold shadow">
          <span className="text-base">🕐</span>
          <span>
            You are still in the <strong>Golden 2-Hour Window</strong> — banks can freeze the
            fraudster's account right now. Call <strong>1930</strong> immediately.
          </span>
        </div>
      )}

      {/* ── Recommendations ── */}
      <div className="mx-5 mb-3 bg-white/80 rounded-xl border border-black/5 p-3">
        <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
          <FileText className="w-3.5 h-3.5" /> Immediate Action Steps
        </p>
        <ol className="text-xs space-y-1.5 text-gray-800 list-decimal list-inside">
          {actionable_recommendations.map((rec, idx) => (
            <li key={idx}>{rec}</li>
          ))}
        </ol>
      </div>

      {/* ── Evidence Checklist ── */}
      <div className="mx-5 mb-3 bg-white/80 rounded-xl border border-black/5 p-3">
        <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Gather This Evidence Now
        </p>
        <ul className="text-xs space-y-1 text-gray-800">
          {evidence_checklist.map((item, idx) => (
            <li key={idx} className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Legal Classification (collapsible) ── */}
      {legal_guidance?.applicable_sections?.length > 0 && (
        <div className="mx-5 mb-4">
          <button
            onClick={() => setLegalOpen(o => !o)}
            className="w-full flex items-center justify-between bg-white/80 rounded-xl border border-black/5 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-white transition"
          >
            <span className="flex items-center gap-1.5">
              <Gavel className="w-3.5 h-3.5 text-indigo-600" />
              Legal Classification &amp; Applicable Laws
            </span>
            {legalOpen
              ? <ChevronUp className="w-4 h-4 text-gray-400" />
              : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {legalOpen && (
            <div className="bg-white/90 rounded-b-xl border border-t-0 border-black/5 px-3 py-3 space-y-3">
              {/* BNS Sections */}
              {legal_guidance.bns_sections?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1">
                    Bharatiya Nyaya Sanhita (BNS) Sections
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {legal_guidance.bns_sections.map((s, i) => (
                      <SectionBadge key={i} label={s} variant="bns" />
                    ))}
                  </div>
                </div>
              )}

              {/* IT Act Sections */}
              {legal_guidance.it_act_sections?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-sky-700 uppercase tracking-wider mb-1">
                    IT Act 2000 Sections
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {legal_guidance.it_act_sections.map((s, i) => (
                      <SectionBadge key={i} label={s} variant="it" />
                    ))}
                  </div>
                </div>
              )}

              {/* Offence Classification */}
              <div className="bg-indigo-50 rounded-lg p-2 border border-indigo-100">
                <p className="text-[10px] font-bold text-indigo-700 uppercase mb-0.5">
                  Offence Classification
                </p>
                <p className="text-xs text-indigo-900">{legal_guidance.offence_classification}</p>
              </div>

              {/* Suggested Remedy */}
              <div>
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-0.5">
                  Suggested Remedy
                </p>
                <p className="text-xs text-gray-800">{legal_guidance.suggested_remedy}</p>
              </div>

              {/* Disclaimer */}
              <div className="bg-yellow-50 rounded-lg p-2 border border-yellow-200">
                <p className="text-[10px] text-yellow-800 italic flex items-start gap-1">
                  <Scale className="w-3 h-3 shrink-0 mt-0.5" />
                  {legal_guidance.legal_disclaimer}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Emergency Call 1930 CTA ── */}
      {isCritical && (
        <div className="mx-5 mb-5 flex items-center justify-between gap-3 pt-3 border-t border-red-200">
          <span className="text-xs font-bold text-red-700 leading-tight">
            Cyber Crime Helpline<br />
            <span className="text-lg font-black text-red-600">1930</span>
          </span>
          <a
            href="tel:1930"
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl text-sm font-bold shadow-md transition"
          >
            <Phone className="w-4 h-4" />
            Call 1930 Now
          </a>
        </div>
      )}
    </div>
  );
}

