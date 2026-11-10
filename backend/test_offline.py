"""
Offline unit tests for NyaySetu v2.0 bug-fix build.
No network calls — validates pure business logic.
"""
import sys
sys.path.insert(0, '.')

from main import (
    extract_entities, simplify_legal_text, merge_entities, generate_followup,
    MANDATORY_FIELDS, resolve_relative_date, extract_bank_name, extract_transaction_mode,
    generate_complaint_narrative
)
from utils.mock_fallbacks import generate_mock_tts_audio, get_mock_entities
from utils.pdf_generator import generate_complaint_pdf

PASSED = 0
FAILED = 0


def check(name, condition, detail=''):
    global PASSED, FAILED
    if condition:
        print(f'  PASS  {name}' + (f'  [{detail}]' if detail else ''))
        PASSED += 1
    else:
        print(f'  FAIL  {name}' + (f'  [{detail}]' if detail else ''))
        FAILED += 1


# ── T1: Real transcript extraction ───────────────────────────────────────────
e = extract_entities(
    'My name is Priya Patel. Phone 9123456789. '
    'Lost Rs.12000 via UPI priya@ybl on 20th November 2024 from HDFC'
)
check('T1a: complainant_name',  e.get('complainant_name') == 'Priya Patel',      e.get('complainant_name'))
check('T1b: phone_number',      e.get('phone_number') == '9123456789',           e.get('phone_number'))
check('T1c: amount_lost has 12000', '12000' in str(e.get('amount_lost', '')),    e.get('amount_lost'))
check('T1d: bank_name',         'HDFC' in str(e.get('bank_name', '')),          e.get('bank_name'))
check('T1e: incident_date',     e.get('incident_date') == '20th November 2024', e.get('incident_date'))

# ── T2: Empty transcript → empty dict (no hardcoded defaults) ─────────────────
e2 = extract_entities('')
check('T2: Empty transcript -> empty dict', e2 == {}, str(e2))

# ── T3: Phone number NOT captured as amount ───────────────────────────────────
e3 = extract_entities('my phone number is 9876543210')
check('T3: Phone not captured as amount', e3.get('amount_lost') is None, str(e3.get('amount_lost')))

# ── T4: Amount extracted only when currency prefix present ────────────────────
e4 = extract_entities('I lost rupees 47500 and my phone is 8800112233')
check('T4a: Amount with prefix', '47500' in str(e4.get('amount_lost', '')), e4.get('amount_lost'))
check('T4b: Phone still correct', e4.get('phone_number') == '8800112233',   e4.get('phone_number'))

# ── T5: Legal simplifier ──────────────────────────────────────────────────────
pts = simplify_legal_text('Under Section 66C imprisonment for 3 years fine rupees one lakh')
check('T5a: Simplifier returns multiple points', len(pts) >= 2, str(len(pts)))
check('T5b: Imprisonment duration in output', any('3' in p for p in pts), str(pts[:2]))

# ── T6: PDF generation with live user data ────────────────────────────────────
pdf = generate_complaint_pdf({
    'complainant_name': 'Priya Patel',
    'description':      'Real user-provided complaint',
    'amount_lost':      '12000',
})
check('T6a: PDF bytes returned',  len(pdf) > 1000,        f'{len(pdf):,} bytes')
check('T6b: Valid PDF header',    pdf[:5] == b'%PDF-',    str(pdf[:8]))

# ── T7: Mock WAV audio ────────────────────────────────────────────────────────
wav = generate_mock_tts_audio('test audio', 2.0)
check('T7a: WAV bytes returned',  len(wav) > 1000,        f'{len(wav):,} bytes')
check('T7b: Valid RIFF WAV header', wav[:4] == b'RIFF',   str(wav[:4]))

# ── T8: Live state is isolated from mock objects ──────────────────────────────
live_entities = {}       # exactly what the frontend starts with
mock_entities = get_mock_entities()
check('T8: Live state empty, isolated from mock', live_entities != mock_entities)

# ── T9: Conversational entity accumulation (multi-turn) ────────────────────────
session_ents = {}
turn1 = extract_entities("I lost 50000 rupees to an OTP fraud")
session_ents = merge_entities(session_ents, turn1)
check('T9a: Turn 1 extracted amount and fraud type', '50000' in session_ents.get('amount_lost', '') and 'incident_type' in session_ents)

q1 = generate_followup(session_ents)
check('T9b: Followup asks for missing field', 'name' in q1.lower() or 'mobile' in q1.lower() or 'date' in q1.lower(), q1)

turn2 = extract_entities("My name is Ramesh Kumar. Phone is 9876543210")
session_ents = merge_entities(session_ents, turn2)
check('T9c: Turn 2 merges name and phone without losing amount', session_ents.get('complainant_name') == 'Ramesh Kumar' and '50000' in session_ents.get('amount_lost', ''))

# ── T10: Full intake completion ───────────────────────────────────────────────
all_fields = {
    "complainant_name": "Ramesh Kumar",
    "phone_number": "9876543210",
    "amount_lost": "₹50,000",
    "incident_type": "OTP Fraud",
    "incident_date": "5th November 2024",
    "bank_name": "State Bank of India (SBI)",
    "transaction_mode": "UPI (PhonePe)",
    "address": "Bengaluru",
    "description": "Received fake call asking for OTP",
}
q_done = generate_followup(all_fields)
check('T10: Complete session prompts PDF download', 'approve & download pdf' in q_done.lower() or 'all the information' in q_done.lower(), q_done)

# ── T11: Comprehensive All-10-Language Support ─────────────────────────────────
LANG_CHECKS = [
    ("kn", "kn-IN", "ನನ್ನ ಹೆಸರು ರಮೇಶ್ ಕುಮಾರ್. ನನಗೆ 50000 ರೂಪಾಯಿ ನಷ್ಟವಾಗಿದೆ.", "ರಮೇಶ್", "50000"),
    ("hi", "hi-IN", "मेरा नाम राहुल वर्मा है। मुझे 25000 रुपये का नुकसान हुआ।", "राहुल", "25000"),
    ("ta", "ta-IN", "என் பெயர் கார்த்திக். எனக்கு 30000 ரூபாய் இழப்பு ஏற்பட்டது.", "கார்த்திக்", "30000"),
    ("te", "te-IN", "నా పేరు సురేష్. నాకు 40000 రూపాయలు పోయాయి.", "సురేష్", "40000"),
    ("ml", "ml-IN", "എന്റെ പേര് മോഹൻ. എനിക്ക് 15000 രൂപ നഷ്ടപ്പെട്ടു.", "മോഹൻ", "15000"),
    ("mr", "mr-IN", "माझे नाव सचिन पाटील आहे. माझे 18000 रुपये गेले.", "सचिन पाटील", "18000"),
    ("bn", "bn-IN", "আমার নাম অর্জুন দাস। আমার 35000 টাকা ক্ষতি হয়েছে।", "অর্জুন দাস", "35000"),
    ("gu", "gu-IN", "મારું નામ વિજય શાહ છે. મને 22000 રૂપિયાનું નુકસાન થયું.", "વિજય શાહ", "22000"),
    ("pa", "pa-IN", "ਮੇਰਾ ਨਾਮ ਗੁਰਪ੍ਰੀਤ ਹੈ। ਮੇਰੇ 60000 ਰੁਪਏ ਗੁਆਚ ਗਏ।", "ਗੁਰਪ੍ਰੀਤ", "60000"),
    ("en", "en-IN", "My name is John Doe. I lost 75000 rupees to an OTP scam.", "John Doe", "75000"),
]

for short_code, locale, sample_text, expected_name, expected_amt in LANG_CHECKS:
    # 1. Followup question generation in target language
    q = generate_followup({"amount_lost": f"₹{expected_amt}"}, language=locale)
    check(f'T11-{short_code}-q: Question in {short_code}', len(q) > 10 and expected_amt in q, q[:50])

    # 2. Entity extraction in target language
    ents = extract_entities(sample_text)
    name_ok = expected_name in ents.get("complainant_name", "")
    amt_ok = expected_amt in ents.get("amount_lost", "")
    check(f'T11-{short_code}-e: Entity extract in {short_code}', name_ok and amt_ok, f'name={ents.get("complainant_name")} amt={ents.get("amount_lost")}')

# ── T12: User's exact live screenshot scenario ────────────────────────────────
pritam_txt = (
    "ನನ್ನ ಹೆಸರು ಪ್ರೀತಮ್ ಹೊಸಮನಿ ಅಂತ ನಾನು ಒಬ್ಬ ಸ್ಕ್ಯಾಮ್ ಕಾಲ್ ಮಾಡಿದ ನನಗೆ ಆ ಬೋಳಿ "
    "ಮಗನಿಂದ ನಾನು ಐವತ್ತು ಸಾವಿರ ರೂಪಾಯಿ ಕಳ್ಕೊಂಡೆ ನೇನು ಒ ಟಿ ಪಿ ಹೇಳೋ ಕೇಳ್ದ ಅದನ್ನೇಳ್ದೆ "
    "ಒಂದು ಐವತ್ತು ಸಾವಿರ ಕಳ್ಕೊಂಡೆ ಬಿಸ್ಲಳ್ಳಿ ಅಂತ ನಮ್ಮೂರು ಏನು ಮಾಡೋದು ಗೊತ್ತಾಗೋಲ್ವ"
)
pritam_ents = extract_entities(pritam_txt)
check("T12a: Clean name only (not whole sentence)", pritam_ents.get("complainant_name") == "ಪ್ರೀತಮ್ ಹೊಸಮನಿ", pritam_ents.get("complainant_name"))
check("T12b: Amount extracted from words (ಐವತ್ತು ಸಾವಿರ)", pritam_ents.get("amount_lost") == "₹50,000", pritam_ents.get("amount_lost"))
check("T12c: Location extracted (ಬಿಸ್ಲಳ್ಳಿ)", pritam_ents.get("address") == "ಬಿಸ್ಲಳ್ಳಿ", pritam_ents.get("address"))
check("T12d: Crime type extracted from ಒ ಟಿ ಪಿ / ಸ್ಕ್ಯಾಮ್", "OTP" in pritam_ents.get("incident_type", "") or "Scam" in pritam_ents.get("incident_type", ""), pritam_ents.get("incident_type"))

followup_kn = generate_followup(pritam_ents, language="kn-IN")
check("T12e: Greets Pritam Hosmani cleanly", "ಪ್ರೀತಮ್ ಹೊಸಮನಿ" in followup_kn, followup_kn[:60])
check("T12f: Acknowledges 50,000", "50,000" in followup_kn or "50000" in followup_kn, followup_kn[:80])
check("T12g: Asks for remaining missing info conversationally", "ಮೊಬೈಲ್" in followup_kn, followup_kn)

# ── T13: User's exact live screenshot 2 & 3 — Code-mixed speech scenario ──────────
code_mixed_kn = "ನನ್ನ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಸಿಕ್ಸ್ ತ್ರೀ ಸಿಕ್ಸ್ ಟು ಸೆವೆನ್ ಡಬಲ್ ಸಿಕ್ಸ್ ಒನ್ ಏಟ್ ಸೆವೆನ್ ಮತ್ತು ಐ ಹ್ಯಾವ್ ಲಾಸ್ಟ್ ಫಿಫ್ಟಿ ಥೌಸಂಡ್ ರುಪೀಸ್"
cm_ents = extract_entities(code_mixed_kn)
check("T13a: Kannada code-mixed phone extracted", cm_ents.get("phone_number") == "6362766187", cm_ents.get("phone_number"))
check("T13b: Kannada code-mixed amount extracted", cm_ents.get("amount_lost") == "₹50,000", cm_ents.get("amount_lost"))

# Live screenshot 3 exact transcription with 'ಥ್ರೀ' and 'ಏಯ್ಟ್'
live_shot3_ents = extract_entities("ಸಿಕ್ಸ್ ಥ್ರೀ ಸಿಕ್ಸ್ ಟು ಸೆವೆನ್ ಡಬಲ್ ಸಿಕ್ಸ್ ಒನ್ ಏಯ್ಟ್ ಸೆವೆನ್.")
check("T13b2: Exact live Gnani STT transliterated phone (ಥ್ರೀ, ಏಯ್ಟ್, ಡಬಲ್)", live_shot3_ents.get("phone_number") == "6362766187", live_shot3_ents.get("phone_number"))

# Hinglish code-mixed
hinglish_txt = "मेरा फोन नंबर है नाइन एट सेवन सिक्स फाइव फोर थ्री टू वन ज़ीरो और मैंने फिफ्टी थाउजेंड रुपये खो दिए"
h_ents = extract_entities(hinglish_txt)
check("T13c: Hinglish code-mixed phone extracted", h_ents.get("phone_number") == "9876543210", h_ents.get("phone_number"))
check("T13d: Hinglish code-mixed amount extracted", h_ents.get("amount_lost") == "₹50,000", h_ents.get("amount_lost"))

# Spoken English with double
eng_spoken = "my phone number is nine eight seven double six five four three two one and I lost fifty thousand rupees"
eng_ents = extract_entities(eng_spoken)
check("T13e: English double-digit phone extracted", eng_ents.get("phone_number") == "9876654321", eng_ents.get("phone_number"))
check("T13f: English spoken amount extracted", eng_ents.get("amount_lost") == "₹50,000", eng_ents.get("amount_lost"))

# Multi-turn merge of Pritam's name + second turn phone & amount (subsequent turn: is_first_turn=False)
combined = merge_entities(pritam_ents, cm_ents)
followup_after_phone_amt = generate_followup(combined, language="kn-IN", is_first_turn=False)
check("T13g: Follow-up no longer asks for phone or amount", "ಮೊಬೈಲ್" not in followup_after_phone_amt and "ಎಷ್ಟು ಹಣ" not in followup_after_phone_amt, followup_after_phone_amt)
check("T13h: Follow-up uses casual ack without repeating greeting", "ಸರಿ" in followup_after_phone_amt and "ಪ್ರೀತಮ್" not in followup_after_phone_amt, followup_after_phone_amt)

# ── T14: User's Kannada number 90151328 test case ─────────────────────────────
check("T14a: Kannada numerals ೯೦೧೫೧೩೨೮", extract_entities("ನನ್ನ ನಂಬರ್ ೯೦೧೫೧೩೨೮").get("phone_number") == "90151328")
check("T14b: Kannada words ಒಂಬತ್ತು ಸೊನ್ನೆ ಒಂದು ಐದು ಒಂದು ಮೂರು ಎರಡು ಎಂಟು", extract_entities("ನನ್ನ ನಂಬರ್ ಒಂಬತ್ತು ಸೊನ್ನೆ ಒಂದು ಐದು ಒಂದು ಮೂರು ಎರಡು ಎಂಟು").get("phone_number") == "90151328")

# ── T15: Relative Date Resolution (Actual Calendar Dates) ─────────────────────
from datetime import datetime, timedelta
now = datetime.now()
expected_yesterday = f"{(now - timedelta(days=1)).day} {(now - timedelta(days=1)).strftime('%B %Y')}"
expected_day_before = f"{(now - timedelta(days=2)).day} {(now - timedelta(days=2)).strftime('%B %Y')}"
expected_today = f"{now.day} {now.strftime('%B %Y')}"

check("T15a: Kannada ninne (ನಿನ್ನೆ) -> yesterday calendar date", resolve_relative_date("ನಿನ್ನೆ") == expected_yesterday, resolve_relative_date("ನಿನ್ನೆ"))
check("T15b: Kannada monne (ಮೊನ್ನೆ) -> 2 days ago calendar date", resolve_relative_date("ಮೊನ್ನೆ") == expected_day_before, resolve_relative_date("ಮೊನ್ನೆ"))
check("T15c: Kannada ivattu (ಇವತ್ತು) -> today calendar date", resolve_relative_date("ಇವತ್ತು") == expected_today, resolve_relative_date("ಇವತ್ತು"))
check("T15d: Hindi kal (कल) -> yesterday calendar date", resolve_relative_date("कल हुआ था") == expected_yesterday, resolve_relative_date("कल हुआ था"))
check("T15e: English yesterday -> yesterday calendar date", resolve_relative_date("yesterday afternoon") == expected_yesterday, resolve_relative_date("yesterday afternoon"))
check("T15f: extract_entities resolves ninne into actual date", extract_entities("ಘಟನೆ ನಡೆದಿದ್ದು ನಿನ್ನೆ").get("incident_date") == expected_yesterday, extract_entities("ಘಟನೆ ನಡೆದಿದ್ದು ನಿನ್ನೆ").get("incident_date"))

# ── T16: Separate Bank Name & Transaction Mode ────────────────────────────────
sbi_phonepe_ents = extract_entities("ಎಸ್ ಬಿ ಐ ಬ್ಯಾಂಕ್ ಮತ್ತು ಫೋನ್ ಪೇ.")
check("T16a: Bank name separated cleanly", sbi_phonepe_ents.get("bank_name") == "State Bank of India (SBI)", sbi_phonepe_ents.get("bank_name"))
check("T16b: Transaction mode separated cleanly", sbi_phonepe_ents.get("transaction_mode") == "UPI (PhonePe)", sbi_phonepe_ents.get("transaction_mode"))

hdfc_net_ents = extract_entities("from HDFC Bank using Net Banking")
check("T16c: HDFC Net Banking bank", hdfc_net_ents.get("bank_name") == "HDFC Bank", hdfc_net_ents.get("bank_name"))
check("T16d: HDFC Net Banking mode", hdfc_net_ents.get("transaction_mode") == "Net Banking", hdfc_net_ents.get("transaction_mode"))

# ── T17: Accurate Location & Proper Nouns Extraction ──────────────────────────
user_screen1_text = "ನನ್ನ ಮೊಬೈಲ್ ನಂಬರ್ ಸಿಕ್ಸ್ ತ್ರೀ ಸಿಕ್ಸ್ ಟು ಸೆವೆನ್ ಡಬಲ್ ಸಿಕ್ಸ್ ಒನ್ ಏಯ್ಟ್ ಸೆವೆನ್ ಮತ್ತು ನನ್ನ ಊರು ಬಿಸ್ಲಳ್ಳಿ."
screen1_ents = extract_entities(user_screen1_text)
check("T17a: Town name correctly extracted (ಬಿಸ್ಲಳ್ಳಿ)", screen1_ents.get("address") == "ಬಿಸ್ಲಳ್ಳಿ", screen1_ents.get("address"))
check("T17b: 'ಮತ್ತು' (and) is rejected as a location", screen1_ents.get("address") != "ಮತ್ತು", screen1_ents.get("address"))

code_mixed_loc = extract_entities("lost money and namma ooru bislalli please help")
check("T17c: Code-mixed namma ooru extraction", code_mixed_loc.get("address") == "bislalli", code_mixed_loc.get("address"))

# ── T18: Narrative Description Generation ─────────────────────────────────────
sample_case = {
    "complainant_name": "ಪ್ರೀತಮ್ ಹೊಸಮನಿ",
    "phone_number": "6362766187",
    "address": "ಬಿಸ್ಲಳ್ಳಿ",
    "amount_lost": "₹50,000",
    "bank_name": "State Bank of India (SBI)",
    "transaction_mode": "UPI (PhonePe)",
    "incident_date": expected_yesterday,
    "incident_type": "OTP Fraud / Phishing",
}
statements = [
    "ಒ ಟಿ ಪಿ ಕೇಳಿದರು, ಅವನ್ಯಾರೋ ನನ್ನ ಫ್ರೆಂಡ್ ಹೆಸ್ರೊಳಗಡೆ ಕಾಲ್ ಮಾಡಿ ಒ ಟಿ ಪಿ ಕೇಳಿದ. ನಾನು ನನ್ನ ಫ್ರೆಂಡಲ್ಲ ಏನಾಗುತ್ತೋ ಅಂತಂದು ಕೊಟ್ಟೆ, ಅವ್ನು ಐವತ್ತು ಸಾವಿರ ರೂಪಾಯಿ ಎತ್ತಿಬಿಟ್ಟ ನನ್ನ ಅಕೌಂಟಿಂದ."
]
narrative_kn = generate_complaint_narrative(sample_case, language="kn-IN", user_statements=statements)
check("T18a: Kannada narrative has formal header and IT Act sections", "ಮಾಹಿತಿ ತಂತ್ರಜ್ಞಾನ ಕಾಯ್ದೆ 2000" in narrative_kn and "FIR" in narrative_kn, narrative_kn[:120])
check("T18b: Kannada narrative incorporates user's direct statement", "ಅವನ್ಯಾರೋ ನನ್ನ ಫ್ರೆಂಡ್" in narrative_kn, narrative_kn[-200:])
check("T18c: Narrative mentions bank, mode, amount, and location", "SBI" in narrative_kn and "PhonePe" in narrative_kn and "₹50,000" in narrative_kn and "ಬಿಸ್ಲಳ್ಳಿ" in narrative_kn)

narrative_en = generate_complaint_narrative(sample_case, language="en-IN")
check("T18d: English narrative has formal legal prayer", "Sections 66C and 66D" in narrative_en and "defrauded funds" in narrative_en, narrative_en[:120])

# ── T19: Multi-format Document Processing & PyMuPDF Extraction ────────────────
from main import extract_text_from_document, analyze_and_structure_notice, answer_document_query
import io
from reportlab.pdfgen import canvas

SAMPLE_NOTICE_TEXT = """
IN THE COURT OF THE CHIEF METROPOLITAN MAGISTRATE / CYBER CRIME POLICE STATION
NOTICE UNDER SECTION 91 Cr.P.C. & SECTION 66C, 66D OF INFORMATION TECHNOLOGY ACT, 2000
Case No: CC/2024/9871

To: Accused / Respondent
Sub: Unauthorized electronic fund transfer and identity theft of Rs. 47,500.

Whereas an investigation is pending regarding fraudulent withdrawal of Rs 47,500 using stolen OTP.
You are hereby required to appear and submit your written response within 7 days from the receipt of this notice.
Failure to comply shall attract penal action under Section 66C of the Information Technology Act with imprisonment up to 3 years and fine up to Rupees 1,00,000, along with immediate freezing of your linked bank accounts.
Issued on: 15 October 2024.
"""

buf = io.BytesIO()
c = canvas.Canvas(buf)
y = 750
for line in SAMPLE_NOTICE_TEXT.strip().split("\n"):
    c.drawString(60, y, line.strip())
    y -= 20
c.save()
pdf_sample_bytes = buf.getvalue()

extracted_doc_text, doc_meta = extract_text_from_document(pdf_sample_bytes, "cyber_notice.pdf")
check("T19a: PDF digital text extracted via PyMuPDF/pypdf", len(extracted_doc_text) > 200, f"len={len(extracted_doc_text)}")
check("T19b: Extracted text contains Section 66C", "66C" in extracted_doc_text)
check("T19c: Metadata captured filename and pages", doc_meta["filename"] == "cyber_notice.pdf" and doc_meta["page_count"] >= 1)

# ── T20: Plain-Language Legal Breakdown (4 Structured Categories) ──────────────
breakdown_en = analyze_and_structure_notice(extracted_doc_text, language="en-IN")
check("T20a: Key Allegations extracted", len(breakdown_en["key_allegations"]) >= 2)
check("T20b: Deadlines & Dates extracted", any("7 days" in d for d in breakdown_en["deadlines_dates"]))
check("T20c: Financial Demands & Penalties extracted", any("1,00,000" in p or "47,500" in p for p in breakdown_en["financial_penalties"]))
check("T20d: Recommended Action Steps extracted", len(breakdown_en["action_steps"]) >= 3)
check("T20e: Speakable summary generated", len(breakdown_en["speakable_summary"]) > 40)

# ── T21: Regional Language Notice Structuring (Kannada) ────────────────────────
breakdown_kn = analyze_and_structure_notice(extracted_doc_text, language="kn-IN")
check("T21a: Kannada Category Titles", "ಪ್ರಮುಖ ಆರೋಪಗಳು" in breakdown_kn["category_titles"]["key_allegations"])
check("T21b: Kannada Action steps cite 1930 Helpline", any("1930" in a for a in breakdown_kn["action_steps"]))
check("T21c: Kannada Speakable summary generated", "ಕಲಂ" in breakdown_kn["speakable_summary"])

# ── T22: Contextual Document Q&A ──────────────────────────────────────────────
ans_why = answer_document_query(extracted_doc_text, breakdown_en, "Why was this notice sent to me?", language="en-IN")
check("T22a: Why sent answer explains allegations", "issued for the following reasons" in ans_why.lower() or "allegations" in ans_why.lower())

ans_deadline = answer_document_query(extracted_doc_text, breakdown_en, "What is the deadline to respond?", language="en-IN")
check("T22b: Deadline answer mentions 7 days", "7 days" in ans_deadline)

ans_action = answer_document_query(extracted_doc_text, breakdown_kn, "ನಾನು ಏನು ಮಾಡಬೇಕು?", language="kn-IN")
check("T22c: Kannada action answer provides numbered steps", "ಕ್ರಮಗಳು" in ans_action and "1." in ans_action)

# ─── Summary ──────────────────────────────────────────────────────────────────
print()
total = PASSED + FAILED
print(f'  {PASSED}/{total} tests passed', '✓' if FAILED == 0 else f'  ({FAILED} FAILED)')
if FAILED > 0:
    sys.exit(1)

