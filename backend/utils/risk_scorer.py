"""
backend/utils/risk_scorer.py — NyaySetu Fraud & Grievance Risk Scoring Engine
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Deterministic composite risk scoring (0-100) covering:
  - Financial exposure (amount lost)
  - Reporting urgency (hours elapsed since incident)
  - Fraud type / modus operandi severity
  - Recurrence / multi-transaction pattern
  - Legal classification: BNS + IT Act sections per category
"""

from typing import Dict, Any, List, Optional
import re


# ── Legal Section Taxonomy ────────────────────────────────────────────────────
# Maps scam_type keywords → (BNS sections, IT Act sections, offence_class, remedy)

_LEGAL_TAXONOMY: Dict[str, Dict[str, Any]] = {
    "otp fraud / phishing": {
        "bns": [
            "Section 318(4) BNS (Cheating & Dishonestly Inducing Delivery of Property — amount > ₹5,000)",
            "Section 319 BNS (Cheating by Personation)",
        ],
        "it_act": [
            "Section 66C IT Act (Identity Theft using Electronic Means)",
            "Section 66D IT Act (Cheating by Personation using Computer Resource)",
        ],
        "offence_class": "Cognizable, Non-Bailable (IT Act S.66C/D) — Police may arrest without warrant.",
        "remedy": "File FIR at Cyber Crime Police Station + File on cybercrime.gov.in + Call 1930 immediately to freeze the destination account.",
    },
    "qr code / upi scam": {
        "bns": [
            "Section 318(4) BNS (Cheating & Dishonestly Inducing Delivery of Property)",
        ],
        "it_act": [
            "Section 66D IT Act (Cheating by Personation using Computer Resource)",
            "Section 43 IT Act (Unauthorized Access / Damage to Computer System)",
        ],
        "offence_class": "Cognizable, Non-Bailable (IT Act S.66D).",
        "remedy": "File FIR + Raise UPI dispute via your bank within 24 hours + Report the QR handle to NPCI.",
    },
    "malicious link / apk scam": {
        "bns": [
            "Section 318 BNS (Cheating)",
        ],
        "it_act": [
            "Section 43 IT Act (Unauthorized Access, Damage to Computer System)",
            "Section 66 IT Act (Computer-related Offences)",
            "Section 66D IT Act (Cheating by Personation using Computer Resource)",
        ],
        "offence_class": "Cognizable, Non-Bailable (IT Act S.66).",
        "remedy": "File FIR + Submit APK / URL as digital evidence + Call 1930 + Report link to CERT-In (incident@cert-in.org.in).",
    },
    "fraudulent scam call / impersonation": {
        "bns": [
            "Section 319 BNS (Cheating by Personation)",
            "Section 318(4) BNS (Cheating — if financial loss occurred)",
            "Section 351 BNS (Criminal Intimidation — if threats were made)",
        ],
        "it_act": [
            "Section 66D IT Act (Cheating by Personation using Computer Resource)",
            "Section 66C IT Act (Identity Theft — if personal credentials were misused)",
        ],
        "offence_class": "Cognizable, Non-Bailable (BNS S.319 + IT Act S.66D).",
        "remedy": "File FIR at local Cyber Crime PS + Save all call logs + File on cybercrime.gov.in + Report caller number to DoT/TRAI Sanchar Saathi portal.",
    },
    "fake investment / job task scam": {
        "bns": [
            "Section 318(4) BNS (Cheating — if financial loss > ₹5,000)",
            "Section 420 (old IPC equivalent) / Section 318 BNS (Cheating & Fraud)",
        ],
        "it_act": [
            "Section 66D IT Act (Cheating by Personation using Computer Resource)",
            "Section 66C IT Act (Identity Theft — if credentials were stolen)",
        ],
        "offence_class": "Cognizable, Non-Bailable (BNS S.318 + IT Act S.66D).",
        "remedy": "File FIR + Report Telegram / WhatsApp group links to cybercrime.gov.in + Preserve all payment receipts + Approach SEBI/RBI if investment scheme is involved.",
    },
    "fake loan app fraud / extortion": {
        "bns": [
            "Section 308 BNS (Extortion)",
            "Section 351 BNS (Criminal Intimidation)",
            "Section 318(4) BNS (Cheating)",
            "Section 384 BNS (Punishment for Extortion)",
        ],
        "it_act": [
            "Section 67A IT Act (Publishing Obscene/Sexual Material — if morphed images used)",
            "Section 66E IT Act (Violation of Privacy)",
            "Section 66D IT Act (Cheating by Personation)",
        ],
        "offence_class": "Cognizable, Non-Bailable (BNS S.308 / S.351).",
        "remedy": "File FIR immediately + DO NOT pay ransom + Report app to Play Store + File on cybercrime.gov.in + Contact RBI (sachet.rbi.org.in) if loan app is unregistered.",
    },
    "lottery / prize / delivery scam": {
        "bns": [
            "Section 318(4) BNS (Cheating — Dishonestly Inducing Delivery of Property)",
            "Section 319 BNS (Cheating by Personation — impersonating courier/govt officials)",
        ],
        "it_act": [
            "Section 66D IT Act (Cheating by Personation using Computer Resource)",
        ],
        "offence_class": "Cognizable, Non-Bailable (BNS S.318).",
        "remedy": "File FIR + File on cybercrime.gov.in + Report to Consumer Forum (consumerhelpline.gov.in) + Preserve all WhatsApp/SMS messages.",
    },
    "unauthorized cyber transaction / fraud": {
        "bns": [
            "Section 318(4) BNS (Cheating & Dishonestly Inducing Delivery of Property)",
            "Section 303 BNS (Theft — if account was accessed without consent)",
        ],
        "it_act": [
            "Section 43 IT Act (Unauthorized Access to Computer System)",
            "Section 66 IT Act (Computer-related Offences — dishonest / fraudulent acts)",
            "Section 66C IT Act (Identity Theft)",
        ],
        "offence_class": "Cognizable, Non-Bailable (IT Act S.66C).",
        "remedy": "File FIR + Raise chargeback/dispute with your bank within 3 working days + Call 1930 + File on cybercrime.gov.in.",
    },
}

_DEFAULT_LEGAL = {
    "bns": ["Section 318(4) BNS (Cheating — General)"],
    "it_act": ["Section 66D IT Act (Cheating by Personation using Computer Resource)"],
    "offence_class": "Cognizable (Cyber-related). Consult local Cyber Crime PS.",
    "remedy": "File on cybercrime.gov.in + Call 1930 + Preserve all digital evidence.",
}

LEGAL_DISCLAIMER = (
    "NyaySetu is an AI drafting assistant, NOT a law firm. "
    "The legal sections listed are indicative only. "
    "For formal legal representation, approach your District Legal Services Authority (DLSA) — "
    "free legal aid is available under the Legal Services Authorities Act, 1987."
)


def _normalize_scam_type(raw: str) -> str:
    """Lower-case and clean the scam_type string for taxonomy lookup."""
    return raw.strip().lower()


def _lookup_legal(scam_type: str) -> Dict[str, Any]:
    """Find the best matching legal taxonomy entry."""
    norm = _normalize_scam_type(scam_type)
    # Exact match first
    if norm in _LEGAL_TAXONOMY:
        return _LEGAL_TAXONOMY[norm]
    # Substring match
    for key, val in _LEGAL_TAXONOMY.items():
        if key in norm or norm in key:
            return val
    # Keyword match
    kw_map = {
        "otp": "otp fraud / phishing",
        "phishing": "otp fraud / phishing",
        "qr": "qr code / upi scam",
        "upi": "qr code / upi scam",
        "apk": "malicious link / apk scam",
        "link": "malicious link / apk scam",
        "call": "fraudulent scam call / impersonation",
        "impersonat": "fraudulent scam call / impersonation",
        "invest": "fake investment / job task scam",
        "task": "fake investment / job task scam",
        "job": "fake investment / job task scam",
        "loan": "fake loan app fraud / extortion",
        "extortion": "fake loan app fraud / extortion",
        "blackmail": "fake loan app fraud / extortion",
        "lottery": "lottery / prize / delivery scam",
        "prize": "lottery / prize / delivery scam",
        "unauthorized": "unauthorized cyber transaction / fraud",
        "transaction": "unauthorized cyber transaction / fraud",
    }
    for kw, mapped_key in kw_map.items():
        if kw in norm:
            return _LEGAL_TAXONOMY.get(mapped_key, _DEFAULT_LEGAL)
    return _DEFAULT_LEGAL


def _parse_amount(amount_raw: Any) -> float:
    """
    Parse amount from either float/int or a string like '₹50,000' / '50000'.
    Returns 0.0 on failure.
    """
    if isinstance(amount_raw, (int, float)):
        return float(amount_raw)
    if isinstance(amount_raw, str):
        # Strip currency symbols and commas
        cleaned = re.sub(r"[₹$€,\s]", "", amount_raw)
        try:
            return float(cleaned)
        except ValueError:
            return 0.0
    return 0.0


# ── Core Scoring Function ─────────────────────────────────────────────────────

def calculate_fraud_risk(incident_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculates a deterministic composite Fraud & Grievance Risk Score (0–100)
    and returns risk tier, urgency, recommendations, evidence checklist,
    and full legal classification (BNS + IT Act sections, offence class, remedy).

    Args:
        incident_data: dict with keys:
            amount_lost   (float | str, e.g. 50000 or '₹50,000')
            hours_elapsed (float, default 24.0)
            scam_type     (str, default 'general_fraud')
            is_recurring  (bool, default False)

    Returns:
        Full risk + legal assessment dict.
    """
    score = 0.0

    # ── 1. Amount Lost — Max 35 pts ───────────────────────────────────────────
    amount_lost = _parse_amount(incident_data.get("amount_lost", 0.0))
    if amount_lost > 100_000:
        score += 35
    elif amount_lost > 25_000:
        score += 25
    elif amount_lost > 5_000:
        score += 15
    elif amount_lost > 0:
        score += 5

    # ── 2. Golden Hour / Time Elapsed — Max 35 pts ────────────────────────────
    hours_elapsed = float(incident_data.get("hours_elapsed", 24.0))
    if hours_elapsed <= 2.0:
        score += 35   # Critical: bank freeze still possible
    elif hours_elapsed <= 6.0:
        score += 28
    elif hours_elapsed <= 24.0:
        score += 18
    elif hours_elapsed <= 72.0:
        score += 10
    else:
        score += 5

    # ── 3. Scam Type / Modus Operandi Severity — Max 20 pts ──────────────────
    scam_type_raw = str(incident_data.get("scam_type", "general_fraud"))
    norm_scam = _normalize_scam_type(scam_type_raw)
    high_severity = {
        "digital_arrest", "investment_scam", "impersonation",
        "loan_app_harassment", "extortion", "blackmail", "sextortion",
    }
    medium_severity = {
        "otp fraud / phishing", "fraudulent scam call / impersonation",
        "fake investment / job task scam", "fake loan app fraud / extortion",
        "malicious link / apk scam",
    }
    if any(h in norm_scam for h in high_severity):
        score += 20
    elif any(m in norm_scam for m in medium_severity):
        score += 15
    else:
        score += 10

    # ── 4. Recurring / Multi-Transaction Pattern — Max 10 pts ────────────────
    if incident_data.get("is_recurring", False):
        score += 10

    final_score = min(round(score, 1), 100.0)

    # ── Tier & Core Recommendations ───────────────────────────────────────────
    if final_score >= 71:
        risk_tier = "High / Critical Risk"
        urgency = "⚠️ IMMEDIATE ACTION REQUIRED"
        recommendations: List[str] = [
            "📞 Call the National Cyber Crime Helpline at 1930 immediately — banks can still freeze the funds.",
            "🏦 Contact your bank's fraud desk to freeze the destination account / block the UPI handle.",
            "🌐 File a preliminary report on cybercrime.gov.in right now — do not delay.",
            "📸 Take screenshots of all transaction SMS, app notifications, and chat messages as evidence.",
        ]
        evidence_checklist: List[str] = [
            "Transaction reference number (UTR / UPI Ref ID)",
            "Screenshot of bank debit SMS / notification",
            "Call logs or chat transcripts with the fraudster",
            "Any links, APKs, or QR codes received",
        ]
    elif final_score >= 31:
        risk_tier = "Moderate Risk"
        urgency = "⚡ PROMPT ACTION ADVISED"
        recommendations = [
            "📝 File your grievance on cybercrime.gov.in within 24 hours.",
            "🏦 Inform your bank branch in writing (email/letter) about the unauthorized transaction.",
            "📂 Preserve all digital artifacts — screenshots, phone numbers, links, app names.",
            "☎️ Call 1930 to log the case in the national register even if funds are not immediately recoverable.",
        ]
        evidence_checklist = [
            "Bank statement highlighting the transaction",
            "Details of the fraudulent merchant, UPI handle, or phone number",
            "Screenshots of any messages / notifications from the scammer",
        ]
    else:
        risk_tier = "Low Risk"
        urgency = "📋 STANDARD FILING"
        recommendations = [
            "📄 Compile all documentation and transaction details.",
            "🌐 Submit a standard cyber complaint on cybercrime.gov.in.",
            "🏦 Raise a formal dispute with your bank for unauthorized transactions.",
        ]
        evidence_checklist = [
            "Transaction receipt or bank statement",
            "Any communication record (SMS, email, or chat)",
        ]

    # ── Legal Classification ──────────────────────────────────────────────────
    legal_data = _lookup_legal(norm_scam)
    all_sections = legal_data["bns"] + legal_data["it_act"]

    legal_guidance = {
        "applicable_sections": all_sections,
        "bns_sections": legal_data["bns"],
        "it_act_sections": legal_data["it_act"],
        "offence_classification": legal_data["offence_class"],
        "suggested_remedy": legal_data["remedy"],
        "legal_disclaimer": LEGAL_DISCLAIMER,
    }

    return {
        "risk_score": final_score,
        "risk_tier": risk_tier,
        "urgency_marker": urgency,
        "scam_category": scam_type_raw,
        "golden_hour_active": hours_elapsed <= 2.0,
        "amount_lost_parsed": amount_lost,
        "actionable_recommendations": recommendations,
        "evidence_checklist": evidence_checklist,
        "legal_guidance": legal_guidance,
    }

