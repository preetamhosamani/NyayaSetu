"""
backend/utils/mock_fallbacks.py
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Synthetic fallback payloads for 100% crash-free demo recordings.
When Gnani APIs are unreachable (network failures, rate limits, key expiry),
every endpoint gracefully degrades to these deterministic mock responses.
"""

import struct
import math
import io
from datetime import datetime


# ─── MOCK STT TRANSCRIPTION ──────────────────────────────────────────────────

MOCK_TRANSCRIPT_HI = (
    "मेरा नाम राहुल शर्मा है। मुझे कल रात एक फर्जी फोन कॉल आया। "
    "कॉल करने वाले ने कहा कि वह SBI बैंक से बोल रहा है और मेरा अकाउंट ब्लॉक हो जाएगा। "
    "उसने मुझसे मेरा OTP और UPI PIN माँगा। मैंने गलती से OTP 483291 बता दिया। "
    "उसके बाद मेरे अकाउंट से ₹47,500 कट गए। "
    "मेरा फोन नंबर 9876543210 है और UPI ID rahul.sharma@oksbi है। "
    "यह घटना 15 अक्टूबर 2024 को रात 9:30 बजे हुई। "
    "कृपया मेरी शिकायत दर्ज करें।"
)

MOCK_TRANSCRIPT_EN = (
    "My name is Rahul Sharma. I received a fraudulent phone call last night. "
    "The caller claimed to be from SBI Bank and said my account would be blocked. "
    "He asked for my OTP and UPI PIN. I mistakenly shared my OTP 483291. "
    "After that, ₹47,500 was deducted from my account. "
    "My phone number is 9876543210 and UPI ID is rahul.sharma@oksbi. "
    "This incident occurred on 15th October 2024 at 9:30 PM. "
    "Please register my complaint."
)


def get_mock_stt_response(language_code: str = "hi") -> dict:
    """Return a mock Prisma STT response matching Gnani API schema."""
    transcript = MOCK_TRANSCRIPT_HI if language_code.startswith("hi") else MOCK_TRANSCRIPT_EN
    return {
        "status": "success",
        "transcript": transcript,
        "language": language_code,
        "confidence": 0.94,
        "_mock": True,
        "_note": "Fallback: Gnani Prisma STT was unreachable",
    }


# ─── MOCK ENTITY EXTRACTION ──────────────────────────────────────────────────

def get_mock_entities() -> dict:
    """Return deterministic extracted entities for demo purposes."""
    return {
        "complainant_name": "Rahul Sharma (राहुल शर्मा)",
        "phone_number": "9876543210",
        "incident_type": "Online Financial Fraud / Phishing",
        "fraud_method": "Fake Bank Call — OTP Theft",
        "amount_lost": "₹47,500",
        "upi_id": "rahul.sharma@oksbi",
        "bank_mentioned": "State Bank of India (SBI)",
        "incident_date": "15 October 2024",
        "incident_time": "21:30 IST",
        "otp_shared": "483291",
        "suspect_description": "Unknown caller impersonating SBI official",
        "_mock": True,
    }


# ─── MOCK LEGAL SIMPLIFICATION ───────────────────────────────────────────────

MOCK_LEGAL_INPUT = (
    "Under Section 66C of the Information Technology Act, 2000, whoever fraudulently "
    "or dishonestly makes use of the electronic signature, password or any other unique "
    "identification feature of any other person, shall be punished with imprisonment of "
    "either description for a term which may extend to three years and shall also be "
    "liable to fine which may extend to rupees one lakh."
)

MOCK_SIMPLIFIED_POINTS = [
    "📌 This law (IT Act Section 66C) protects you if someone misuses your digital identity.",
    "🔒 If someone steals and uses your password, OTP, UPI PIN, or digital signature — that is a punishable crime.",
    "⚖️ The guilty person can face up to 3 years in jail.",
    "💰 They can also be fined up to ₹1,00,000 (One Lakh Rupees).",
    "🛡️ This law applies to online banking fraud, UPI fraud, and identity theft cases.",
    "📞 You can file a complaint at your nearest Cyber Crime Police Station or on cybercrime.gov.in.",
]


def get_mock_simplification() -> dict:
    """Return mock legal simplification output."""
    return {
        "original_text": MOCK_LEGAL_INPUT,
        "simplified_points": MOCK_SIMPLIFIED_POINTS,
        "language": "en",
        "_mock": True,
        "_note": "Fallback: Simplified locally without LLM",
    }


# ─── MOCK TTS AUDIO GENERATION ───────────────────────────────────────────────

def generate_mock_tts_audio(text: str = "", duration_sec: float = 3.0) -> bytes:
    """
    Generate a valid WAV file containing a gentle notification tone.
    This ensures the audio player in the frontend always has playable content,
    even when the Gnani Timbre TTS API is unreachable.
    """
    sample_rate = 22050
    num_samples = int(sample_rate * duration_sec)
    amplitude = 8000

    # Generate a gentle two-tone chime (440Hz -> 554Hz)
    samples = []
    mid = num_samples // 2
    for i in range(num_samples):
        freq = 440.0 if i < mid else 554.37  # A4 -> C#5
        # Envelope: fade in/out
        env = 1.0
        if i < 1000:
            env = i / 1000.0
        elif i > num_samples - 1000:
            env = (num_samples - i) / 1000.0
        sample = int(amplitude * env * math.sin(2.0 * math.pi * freq * i / sample_rate))
        samples.append(sample)

    # Pack as 16-bit PCM WAV
    buf = io.BytesIO()
    num_channels = 1
    bits_per_sample = 16
    byte_rate = sample_rate * num_channels * bits_per_sample // 8
    block_align = num_channels * bits_per_sample // 8
    data_size = num_samples * block_align

    # WAV header
    buf.write(b'RIFF')
    buf.write(struct.pack('<I', 36 + data_size))
    buf.write(b'WAVE')
    buf.write(b'fmt ')
    buf.write(struct.pack('<I', 16))                    # chunk size
    buf.write(struct.pack('<H', 1))                     # PCM format
    buf.write(struct.pack('<H', num_channels))
    buf.write(struct.pack('<I', sample_rate))
    buf.write(struct.pack('<I', byte_rate))
    buf.write(struct.pack('<H', block_align))
    buf.write(struct.pack('<H', bits_per_sample))
    buf.write(b'data')
    buf.write(struct.pack('<I', data_size))

    for s in samples:
        buf.write(struct.pack('<h', max(-32768, min(32767, s))))

    return buf.getvalue()


# ─── MOCK COMPLAINT DATA (for PDF testing) ────────────────────────────────────

def get_mock_complaint_data() -> dict:
    """Full complaint payload for PDF generation testing."""
    return {
        "complainant_name": "Rahul Sharma",
        "phone_number": "9876543210",
        "email": "rahul.sharma@email.com",
        "address": "42, Lajpat Nagar, New Delhi - 110024",
        "incident_type": "Online Financial Fraud / Phishing",
        "fraud_method": "Fake Bank Call — OTP Theft",
        "amount_lost": "₹47,500",
        "upi_id": "rahul.sharma@oksbi",
        "bank_name": "State Bank of India (SBI)",
        "transaction_mode": "UPI / PhonePe",
        "incident_date": "15 October 2024",
        "incident_time": "21:30 IST",
        "description": MOCK_TRANSCRIPT_EN,
        "suspect_description": "Unknown caller impersonating SBI official",
        "evidence": "Call log records, SMS OTP notification, Bank statement",
        "generated_at": datetime.now().isoformat(),
    }
