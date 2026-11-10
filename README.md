# NyaySetu (न्यायसेतु)
### Sovereign Voice-First Legal & Administrative Bridge

> **Great Indian AI Internship Challenge — Gnani.ai**

NyaySetu bridges systemic legal access gaps by providing two core capabilities:

1. **File Grievance (Voice-to-PDF):** Record your complaint by voice → Automatic transcription via Gnani Prisma STT → Entity extraction → Government-ready Cybercrime PDF generation.

2. **Understand Notice (Legal Simplifier):** Paste complex legal text → Plain-language distillation → Regional audio playback via Gnani Timbre TTS.

---

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Tech Stack
- **Backend:** FastAPI, ReportLab, Gnani Prisma STT v2.5, Gnani Timbre TTS v2.5
- **Frontend:** React 18, Vite, Tailwind CSS, lucide-react
- **Architecture:** Defensive mock-fallback system for 100% crash-free demos

---

*Built for the Great Indian AI Internship Challenge by Gnani.ai*

