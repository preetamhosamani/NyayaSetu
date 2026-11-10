"""
backend/utils/pdf_generator.py
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Government-compliant Cybercrime Complaint PDF generator using ReportLab.
Produces a structured single-page form with official headings, grid tables,
and a mandatory draft watermark.
"""

import io
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.pdfgen import canvas


# ─── WATERMARK CANVAS ────────────────────────────────────────────────────────

class WatermarkCanvas(canvas.Canvas):
    """Custom canvas that draws a diagonal draft watermark on every page."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._watermark_text = "Draft Generated via NyaySetu - For Review Purposes Only"

    def showPage(self):
        self._draw_watermark()
        super().showPage()

    def save(self):
        self._draw_watermark()
        super().save()

    def _draw_watermark(self):
        self.saveState()
        self.setFont("Helvetica-Bold", 38)
        self.setFillColor(colors.Color(0.85, 0.85, 0.85, alpha=0.35))
        self.translate(A4[0] / 2, A4[1] / 2)
        self.rotate(45)
        self.drawCentredString(0, 0, self._watermark_text)
        self.restoreState()


# ─── STYLES ───────────────────────────────────────────────────────────────────

def _build_styles():
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        name='DocTitle',
        parent=styles['Title'],
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#000080'),
        spaceAfter=4 * mm,
        alignment=TA_CENTER,
    ))

    styles.add(ParagraphStyle(
        name='DocSubTitle',
        parent=styles['Normal'],
        fontSize=10,
        leading=13,
        textColor=colors.HexColor('#333333'),
        spaceAfter=6 * mm,
        alignment=TA_CENTER,
    ))

    styles.add(ParagraphStyle(
        name='SectionHead',
        parent=styles['Heading2'],
        fontSize=11,
        leading=14,
        textColor=colors.white,
        backColor=colors.HexColor('#000080'),
        borderPadding=(4, 6, 4, 6),
        spaceAfter=2 * mm,
        spaceBefore=4 * mm,
    ))

    styles.add(ParagraphStyle(
        name='CellLabel',
        parent=styles['Normal'],
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#555555'),
    ))

    styles.add(ParagraphStyle(
        name='CellValue',
        parent=styles['Normal'],
        fontSize=10,
        leading=13,
        textColor=colors.HexColor('#111111'),
        fontName='Helvetica-Bold',
    ))

    styles.add(ParagraphStyle(
        name='NarrativeText',
        parent=styles['Normal'],
        fontSize=9.5,
        leading=13,
        alignment=TA_JUSTIFY,
        textColor=colors.HexColor('#222222'),
    ))

    styles.add(ParagraphStyle(
        name='Footer',
        parent=styles['Normal'],
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor('#888888'),
        alignment=TA_CENTER,
    ))

    return styles


# ─── TABLE HELPERS ────────────────────────────────────────────────────────────

GRID_STYLE = TableStyle([
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CCCCCC')),
    ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F5F5F5')),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
])


def _kv_row(label: str, value: str, styles) -> list:
    return [
        Paragraph(label, styles['CellLabel']),
        Paragraph(value or "—", styles['CellValue']),
    ]


# ─── MAIN PDF BUILDER ────────────────────────────────────────────────────────

def generate_complaint_pdf(data: dict) -> bytes:
    """
    Generate a single-page government-style Cybercrime Complaint PDF.

    Args:
        data: Dict with keys like complainant_name, phone_number, incident_type,
              amount_lost, description, etc.

    Returns:
        PDF file as bytes.
    """
    buf = io.BytesIO()
    styles = _build_styles()

    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
        title="Cybercrime Complaint - NyaySetu",
        author="NyaySetu Automated System",
    )

    elements = []

    # ── Header ──
    elements.append(Paragraph(
        "CYBERCRIME COMPLAINT FORM",
        styles['DocTitle']
    ))
    elements.append(Paragraph(
        "National Cyber Crime Reporting Portal — Auto-Generated Draft<br/>"
        f"Reference: NYAY-{datetime.now().strftime('%Y%m%d-%H%M%S')} | "
        f"Generated: {datetime.now().strftime('%d %B %Y, %I:%M %p IST')}",
        styles['DocSubTitle']
    ))

    elements.append(HRFlowable(
        width="100%", thickness=1.5,
        color=colors.HexColor('#FF9933'),
        spaceAfter=3 * mm
    ))

    # ── Section 1: Complainant Details ──
    elements.append(Paragraph("SECTION A — COMPLAINANT DETAILS", styles['SectionHead']))

    tbl_a = Table(
        [
            _kv_row("Full Name", data.get("complainant_name", ""), styles),
            _kv_row("Mobile Number", data.get("phone_number", ""), styles),
            _kv_row("Email Address", data.get("email", ""), styles),
            _kv_row("Residential Address", data.get("address", ""), styles),
        ],
        colWidths=[42 * mm, None],
        hAlign='LEFT',
    )
    tbl_a.setStyle(GRID_STYLE)
    elements.append(tbl_a)

    # ── Section 2: Incident Details ──
    elements.append(Paragraph("SECTION B — INCIDENT DETAILS", styles['SectionHead']))

    tbl_b = Table(
        [
            _kv_row("Category of Cybercrime", data.get("incident_type", ""), styles),
            _kv_row("Fraud Method / Modus Operandi", data.get("fraud_method", ""), styles),
            _kv_row("Date of Incident", data.get("incident_date", ""), styles),
            _kv_row("Time of Incident", data.get("incident_time", ""), styles),
            _kv_row("Financial Loss", data.get("amount_lost", ""), styles),
        ],
        colWidths=[42 * mm, None],
        hAlign='LEFT',
    )
    tbl_b.setStyle(GRID_STYLE)
    elements.append(tbl_b)

    # ── Section 3: Financial Information ──
    elements.append(Paragraph("SECTION C — FINANCIAL & DIGITAL TRAIL", styles['SectionHead']))

    tbl_c = Table(
        [
            _kv_row("Bank Name", data.get("bank_name", ""), styles),
            _kv_row("Transaction Mode", data.get("transaction_mode", ""), styles),
            _kv_row("UPI ID / Wallet", data.get("upi_id", ""), styles),
            _kv_row("Suspect Description", data.get("suspect_description", ""), styles),
            _kv_row("Evidence Attached", data.get("evidence", ""), styles),
        ],
        colWidths=[42 * mm, None],
        hAlign='LEFT',
    )
    tbl_c.setStyle(GRID_STYLE)
    elements.append(tbl_c)

    # ── Section 4: Detailed Narrative ──
    elements.append(Paragraph("SECTION D — DETAILED COMPLAINT NARRATIVE", styles['SectionHead']))

    raw_desc = data.get("description", "No description provided.")
    description = raw_desc.replace("\n", "<br/>")
    elements.append(Spacer(1, 2 * mm))
    elements.append(Paragraph(description, styles['NarrativeText']))

    # ── Footer ──
    elements.append(Spacer(1, 8 * mm))
    elements.append(HRFlowable(
        width="100%", thickness=0.75,
        color=colors.HexColor('#CCCCCC'),
        spaceAfter=2 * mm
    ))
    elements.append(Paragraph(
        "⚠ DRAFT DOCUMENT — This form was auto-generated by NyaySetu (न्यायसेतु) from voice input. "
        "It must be reviewed, corrected if necessary, and submitted through official channels at "
        "<b>cybercrime.gov.in</b> or your nearest Cyber Crime Police Station.<br/>"
        "NyaySetu is a technology demonstration and does not constitute legal filing.",
        styles['Footer']
    ))

    # Build with watermark
    doc.build(elements, canvasmaker=WatermarkCanvas)
    return buf.getvalue()
