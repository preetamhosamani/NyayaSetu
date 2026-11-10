/**
 * frontend/src/App.jsx  —  NyaySetu v4.1 (Warm Cream & Deep Navy Sovereign Legal Bridge)
 *
 * Gnani.ai Multilingual Code-Mixed Integration:
 *   Supports all 11 Indian languages with English integration:
 *   - Kannada + English   (kn-IN · Code-Mixed)
 *   - Hindi + English     (hi-IN · Hinglish)
 *   - Indian English      (en-IN)
 *   - Tamil + English     (ta-IN · Tanglish)
 *   - Telugu + English    (te-IN · Code-Mixed)
 *   - Marathi + English   (mr-IN · Code-Mixed)
 *   - Bengali + English   (bn-IN · Code-Mixed)
 *   - Gujarati + English  (gu-IN · Code-Mixed)
 *   - Malayalam + English (ml-IN · Code-Mixed)
 *   - Punjabi + English   (pa-IN · Code-Mixed)
 *   - Assamese + English  (as-IN · Code-Mixed)
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Mic, MicOff, Scale, Download, Play, Pause, Volume2,
  AlertCircle, CheckCircle2, Clock, Loader2, BookOpen,
  Phone, IndianRupee, User, MapPin, Building2, Calendar, CreditCard,
  Hash, Search, Globe, Activity, FileText, Shield, Sparkles,
  X, Upload, Send, MessageSquare, RefreshCw, Eye, ChevronDown, ChevronUp,
  FileCheck, HelpCircle, UploadCloud, Square, Pencil, ChevronRight,
  ArrowLeft, Lock, AlertTriangle, Share2, Printer, Check
} from 'lucide-react';

const API_BASE = '/api';

// ═══════════════════════════════════════════════════════════════════════════════
// ALL SUPPORTED GNANI API LANGUAGES (WITH ENGLISH INTEGRATION / CODE-MIXED)
// ═══════════════════════════════════════════════════════════════════════════════

const SUPPORTED_LANGUAGES = [
  { code: 'kn-IN', name: 'Kannada + English',   native: 'ಕನ್ನಡ + Eng',  sub: 'Kannada+Eng' },
  { code: 'hi-IN', name: 'Hindi + English',     native: 'हिन्दी + Eng',   sub: 'Hinglish' },
  { code: 'en-IN', name: 'English',             native: 'English',        sub: 'Indian Eng' },
  { code: 'ta-IN', name: 'Tamil + English',     native: 'தமிழ் + Eng',    sub: 'Tanglish' },
  { code: 'te-IN', name: 'Telugu + English',    native: 'తెలుగు + Eng',   sub: 'Telugu+Eng' },
  { code: 'mr-IN', name: 'Marathi + English',   native: 'मराठी + Eng',    sub: 'Marathi+Eng' },
  { code: 'bn-IN', name: 'Bengali + English',   native: 'বাংলা + Eng',    sub: 'Bengali+Eng' },
  { code: 'gu-IN', name: 'Gujarati + English',  native: 'ગુજરાતી + Eng',  sub: 'Gujarati+Eng' },
  { code: 'ml-IN', name: 'Malayalam + English', native: 'മലയാളം + Eng',  sub: 'Malayalam+Eng' },
  { code: 'pa-IN', name: 'Punjabi + English',   native: 'ਪੰਜਾਬੀ + Eng',   sub: 'Punjabi+Eng' },
  { code: 'as-IN', name: 'Assamese + English',  native: 'অসমীয়া + Eng',  sub: 'Assamese+Eng' },
];

const BASE_SPEED = 1.0;
const SPEED_OPTIONS = [
  { val: 0.5,  label: '0.5x' },
  { val: 0.75, label: '0.75x' },
  { val: 1.0,  label: '1.0x (Standard)' },
  { val: 1.5,  label: '1.5x' },
  { val: 2.0,  label: '2.0x' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// COMPLETE MULTILINGUAL UI STRINGS DICTIONARY FOR ALL 11 LANGUAGES
// ═══════════════════════════════════════════════════════════════════════════════

const UI_STRINGS = {
  'kn-IN': {
    appName: 'ನ್ಯಾಯಸೇತು',
    appSub: 'NYAYSETU',
    help: 'ಸಹಾಯ · Help',
    langLabel: 'ಭಾಷೆ · Language (Code-Mixed with English)',
    greeting: 'ನಮಸ್ಕಾರ, ಏನಾಯಿತು?',
    greetingSub: 'Tell us in your own language. We do the paperwork.',
    card1Title: 'ದೂರು ದಾಖಲಿಸಿ',
    card1Sub: 'Cheated online? Speak. We write the complaint.',
    card2Title: 'ನೋಟಿಸ್ ಅರ್ಥ ಮಾಡಿಕೊಳ್ಳಿ',
    card2Sub: 'Got a legal letter? We explain it and read it aloud.',
    emergencyTitle: 'Lost money just now? Call 1930 first.',
    emergencySub: 'Banks can still freeze the money if you are quick.',
    footerNote: 'Your words are deleted after 30 minutes. NyaySetu helps you write and understand. It is not a lawyer.',
    intakeTitle: 'ದೂರು ದಾಖಲಿಸಿ',
    intakePromptDefault: 'ಏನಾಯ್ತು ಅಂತ ಸ್ವಲ್ಪ ನಿಮ್ಮ ಮಾತಲ್ಲಿ ಹೇಳಿ.',
    tapToSpeak: 'ಮಾತನಾಡಲು ಒತ್ತಿ',
    tapAndSpeak: 'Tap and speak',
    typeInstead: 'Type instead',
    listening: 'ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದ್ದೇನೆ…',
    stopSpeaking: 'ನಿಲ್ಲಿಸಲು ಒತ್ತಿ',
    whatWeHeard: 'What we heard. Tap to fix a word.',
    detailsSoFar: 'YOUR DETAILS SO FAR',
    listenAgain: 'Listen again',
    draftReady: 'ನಿಮ್ಮ ದೂರು ಸಿದ್ಧ',
    draftSub: 'Please read it once. Tap anything that is wrong and fix it before you take it to the police.',
    cyberDraftBadge: 'CYBERCRIME COMPLAINT',
    draftTag: 'DRAFT',
    narrativeTitle: 'ದೂರು ವಿವರ',
    readFullText: 'Read the full text',
    hideFullText: 'Hide full text',
    disclaimer: 'This is a draft, not a filed case. Submit it at cybercrime.gov.in or your nearest cyber police station.',
    printPdf: 'Approve & Download PDF',
    shareWa: 'Share on WhatsApp',
    startOver: 'Start over',
    back: 'Back',
    stepOf: 'of 8',
    fields: {
      complainant_name: 'ಪೂರ್ಣ ಹೆಸರು',
      phone_number:     'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ',
      amount_lost:      'ನಷ್ಟವಾದ ಮೊತ್ತ',
      bank_name:        'ಬ್ಯಾಂಕ್ ಹೆಸರು',
      transaction_mode: 'ವಹಿವಾಟು ವಿಧಾನ',
      incident_date:    'ಘಟನೆ ನಡೆದ ದಿನಾಂಕ',
      incident_type:    'ವಂಚನೆಯ ವಿಧಾನ',
      address:          'ಊರು / ಸ್ಥಳ',
      description:      'ದೂರು ವಿವರ',
    }
  },
  'hi-IN': {
    appName: 'न्यायसेतु',
    appSub: 'NYAYSETU',
    help: 'मदद · Help',
    langLabel: 'भाषा · Language (Code-Mixed with English)',
    greeting: 'नमस्ते, क्या हुआ?',
    greetingSub: 'Tell us in your own language. We do the paperwork.',
    card1Title: 'शिकायत दर्ज करें',
    card1Sub: 'Cheated online? Speak. We write the complaint.',
    card2Title: 'नोटिस समझें',
    card2Sub: 'Got a legal letter? We explain it and read it aloud.',
    emergencyTitle: 'Lost money just now? Call 1930 first.',
    emergencySub: 'Banks can still freeze the money if you are quick.',
    footerNote: 'Your words are deleted after 30 minutes. NyaySetu helps you write and understand. It is not a lawyer.',
    intakeTitle: 'शिकायत दर्ज करें',
    intakePromptDefault: 'क्या हुआ, कृपया अपनी भाषा में बताएं।',
    tapToSpeak: 'बोलने के लिए दबाएं',
    tapAndSpeak: 'Tap and speak',
    typeInstead: 'Type instead',
    listening: 'सुन रहे हैं…',
    stopSpeaking: 'रोकने के लिए दबाएं',
    whatWeHeard: 'What we heard. Tap to fix a word.',
    detailsSoFar: 'YOUR DETAILS SO FAR',
    listenAgain: 'Listen again',
    draftReady: 'आपकी शिकायत तैयार है',
    draftSub: 'Please read it once. Tap anything that is wrong and fix it before you take it to the police.',
    cyberDraftBadge: 'CYBERCRIME COMPLAINT',
    draftTag: 'DRAFT',
    narrativeTitle: 'शिकायत विवरण',
    readFullText: 'Read the full text',
    hideFullText: 'Hide full text',
    disclaimer: 'This is a draft, not a filed case. Submit it at cybercrime.gov.in or your nearest cyber police station.',
    printPdf: 'Approve & Download PDF',
    shareWa: 'Share on WhatsApp',
    startOver: 'Start over',
    back: 'Back',
    stepOf: 'of 8',
    fields: {
      complainant_name: 'पूरा नाम',
      phone_number:     'मोबाइल नंबर',
      amount_lost:      'खोई गई राशि',
      bank_name:        'बैंक का नाम',
      transaction_mode: 'लेनदेन का माध्यम',
      incident_date:    'घटना की तारीख',
      incident_type:    'धोखाधड़ी का प्रकार',
      address:          'शहर / स्थान',
      description:      'विवरण',
    }
  },
  'ta-IN': {
    appName: 'நியாயசேது',
    appSub: 'NYAYSETU',
    help: 'உதவி · Help',
    langLabel: 'மொழி · Language (Code-Mixed with English)',
    greeting: 'வணக்கம், என்ன ஆயிற்று?',
    greetingSub: 'Tell us in your own language. We do the paperwork.',
    card1Title: 'புகார் பதிவு செய்யவும்',
    card1Sub: 'Cheated online? Speak. We write the complaint.',
    card2Title: 'நோட்டீசை புரிந்துகொள்ளுங்கள்',
    card2Sub: 'Got a legal letter? We explain it and read it aloud.',
    emergencyTitle: 'Lost money just now? Call 1930 first.',
    emergencySub: 'Banks can still freeze the money if you are quick.',
    footerNote: 'Your words are deleted after 30 minutes. NyaySetu helps you write and understand. It is not a lawyer.',
    intakeTitle: 'புகார் பதிவு',
    intakePromptDefault: 'என்ன நடந்தது என்று உங்கள் மொழியில் கூறுங்கள்.',
    tapToSpeak: 'பேச அழுத்தவும்',
    tapAndSpeak: 'Tap and speak',
    typeInstead: 'Type instead',
    listening: 'கேட்கிறது…',
    stopSpeaking: 'நிறுத்த அழுத்தவும்',
    whatWeHeard: 'What we heard. Tap to fix a word.',
    detailsSoFar: 'YOUR DETAILS SO FAR',
    listenAgain: 'Listen again',
    draftReady: 'உங்கள் புகார் தயார்',
    draftSub: 'Please read it once. Tap anything that is wrong and fix it before you take it to the police.',
    cyberDraftBadge: 'CYBERCRIME COMPLAINT',
    draftTag: 'DRAFT',
    narrativeTitle: 'புகார் விவரம்',
    readFullText: 'Read the full text',
    hideFullText: 'Hide full text',
    disclaimer: 'This is a draft, not a filed case. Submit it at cybercrime.gov.in or your nearest cyber police station.',
    printPdf: 'Approve & Download PDF',
    shareWa: 'Share on WhatsApp',
    startOver: 'Start over',
    back: 'Back',
    stepOf: 'of 8',
    fields: {
      complainant_name: 'முழு பெயர்',
      phone_number:     'கைபேசி எண்',
      amount_lost:      'இழந்த தொகை',
      bank_name:        'வங்கி பெயர்',
      transaction_mode: 'பரிவர்த்தனை முறை',
      incident_date:    'சம்பவ தேதி',
      incident_type:    'மோசடி வகை',
      address:          'ஊர் / இடம்',
      description:      'விவரம்',
    }
  },
  'te-IN': {
    appName: 'న్యాయసేతు',
    appSub: 'NYAYSETU',
    help: 'సహాయం · Help',
    langLabel: 'భాష · Language (Code-Mixed with English)',
    greeting: 'నమస్కారం, ఏమి జరిగింది?',
    greetingSub: 'Tell us in your own language. We do the paperwork.',
    card1Title: 'ఫిర్యాదు చేయండి',
    card1Sub: 'Cheated online? Speak. We write the complaint.',
    card2Title: 'నోటీస్ అర్థం చేసుకోండి',
    card2Sub: 'Got a legal letter? We explain it and read it aloud.',
    emergencyTitle: 'Lost money just now? Call 1930 first.',
    emergencySub: 'Banks can still freeze the money if you are quick.',
    footerNote: 'Your words are deleted after 30 minutes. NyaySetu helps you write and understand. It is not a lawyer.',
    intakeTitle: 'ఫిర్యాదు నమోదు',
    intakePromptDefault: 'ఏమి జరిగిందో మీ మాటల్లో క్లుప్తంగా చెప్పండి.',
    tapToSpeak: 'మాట్లాడటానికి నొక్కండి',
    tapAndSpeak: 'Tap and speak',
    typeInstead: 'Type instead',
    listening: 'వింటున్నాము…',
    stopSpeaking: 'ఆపడానికి నొక్కండి',
    whatWeHeard: 'What we heard. Tap to fix a word.',
    detailsSoFar: 'YOUR DETAILS SO FAR',
    listenAgain: 'Listen again',
    draftReady: 'మీ ఫిర్యాదు సిద్ధంగా ఉంది',
    draftSub: 'Please read it once. Tap anything that is wrong and fix it before you take it to the police.',
    cyberDraftBadge: 'CYBERCRIME COMPLAINT',
    draftTag: 'DRAFT',
    narrativeTitle: 'ఫిర్యాదు వివరాలు',
    readFullText: 'Read the full text',
    hideFullText: 'Hide full text',
    disclaimer: 'This is a draft, not a filed case. Submit it at cybercrime.gov.in or your nearest cyber police station.',
    printPdf: 'Approve & Download PDF',
    shareWa: 'Share on WhatsApp',
    startOver: 'Start over',
    back: 'Back',
    stepOf: 'of 8',
    fields: {
      complainant_name: 'పూర్తి పేరు',
      phone_number:     'మొబైల్ నంబర్',
      amount_lost:      'కోల్పోయిన మొత్తం',
      bank_name:        'బ్యాంకు పేరు',
      transaction_mode: 'లావాదేవీ విధానం',
      incident_date:    'ఘటన తేదీ',
      incident_type:    'మోసం రకం',
      address:          'ఊరు / ప్రాంతం',
      description:      'వివరాలు',
    }
  },
  'mr-IN': {
    appName: 'न्यायसेतू',
    appSub: 'NYAYSETU',
    help: 'मदत · Help',
    langLabel: 'भाषा · Language (Code-Mixed with English)',
    greeting: 'नमस्कार, काय घडले?',
    greetingSub: 'Tell us in your own language. We do the paperwork.',
    card1Title: 'तक्रार नोंदवा',
    card1Sub: 'Cheated online? Speak. We write the complaint.',
    card2Title: 'नोटीस समजावून घ्या',
    card2Sub: 'Got a legal letter? We explain it and read it aloud.',
    emergencyTitle: 'Lost money just now? Call 1930 first.',
    emergencySub: 'Banks can still freeze the money if you are quick.',
    footerNote: 'Your words are deleted after 30 minutes. NyaySetu helps you write and understand. It is not a lawyer.',
    intakeTitle: 'तक्रार नोंदणी',
    intakePromptDefault: 'नेमके काय घडले ते थोडक्यात सांगा.',
    tapToSpeak: 'बोलण्यासाठी टॅप करा',
    tapAndSpeak: 'Tap and speak',
    typeInstead: 'Type instead',
    listening: 'ऐकत आहोत…',
    stopSpeaking: 'थांबवण्यासाठी टॅप करा',
    whatWeHeard: 'What we heard. Tap to fix a word.',
    detailsSoFar: 'YOUR DETAILS SO FAR',
    listenAgain: 'Listen again',
    draftReady: 'आपली तक्रार तयार आहे',
    draftSub: 'Please read it once. Tap anything that is wrong and fix it before you take it to the police.',
    cyberDraftBadge: 'CYBERCRIME COMPLAINT',
    draftTag: 'DRAFT',
    narrativeTitle: 'तक्रारीचा तपशील',
    readFullText: 'Read the full text',
    hideFullText: 'Hide full text',
    disclaimer: 'This is a draft, not a filed case. Submit it at cybercrime.gov.in or your nearest cyber police station.',
    printPdf: 'Approve & Download PDF',
    shareWa: 'Share on WhatsApp',
    startOver: 'Start over',
    back: 'Back',
    stepOf: 'of 8',
    fields: {
      complainant_name: 'पूर्ण नाव',
      phone_number:     'मोबाईल नंबर',
      amount_lost:      'नुकसानीची रक्कम',
      bank_name:        'बँकेचे नाव',
      transaction_mode: 'व्यवहाराची पद्धत',
      incident_date:    'घटनेची तारीख',
      incident_type:    'फसवणुकीचा प्रकार',
      address:          'गाव / शहर',
      description:      'तपशील',
    }
  },
  'bn-IN': {
    appName: 'ন্যায়সেতু',
    appSub: 'NYAYSETU',
    help: 'সাহায্য · Help',
    langLabel: 'ভাষা · Language (Code-Mixed with English)',
    greeting: 'নমস্কার, কী ঘটেছে?',
    greetingSub: 'Tell us in your own language. We do the paperwork.',
    card1Title: 'অভিযোগ দায়ের করুন',
    card1Sub: 'Cheated online? Speak. We write the complaint.',
    card2Title: 'নোটিশ বুঝুন',
    card2Sub: 'Got a legal letter? We explain it and read it aloud.',
    emergencyTitle: 'Lost money just now? Call 1930 first.',
    emergencySub: 'Banks can still freeze the money if you are quick.',
    footerNote: 'Your words are deleted after 30 minutes. NyaySetu helps you write and understand. It is not a lawyer.',
    intakeTitle: 'অভিযোগ দায়ের',
    intakePromptDefault: 'কী হয়েছিল তা আপনার ভাষায় সংক্ষেপে বলুন।',
    tapToSpeak: 'বলতে ট্যাপ করুন',
    tapAndSpeak: 'Tap and speak',
    typeInstead: 'Type instead',
    listening: 'শুনছি…',
    stopSpeaking: 'থামাতে ট্যাপ করুন',
    whatWeHeard: 'What we heard. Tap to fix a word.',
    detailsSoFar: 'YOUR DETAILS SO FAR',
    listenAgain: 'Listen again',
    draftReady: 'আপনার অভিযোগ প্রস্তুত',
    draftSub: 'Please read it once. Tap anything that is wrong and fix it before you take it to the police.',
    cyberDraftBadge: 'CYBERCRIME COMPLAINT',
    draftTag: 'DRAFT',
    narrativeTitle: 'অভিযোগের বিবরণ',
    readFullText: 'Read the full text',
    hideFullText: 'Hide full text',
    disclaimer: 'This is a draft, not a filed case. Submit it at cybercrime.gov.in or your nearest cyber police station.',
    printPdf: 'Approve & Download PDF',
    shareWa: 'Share on WhatsApp',
    startOver: 'Start over',
    back: 'Back',
    stepOf: 'of 8',
    fields: {
      complainant_name: 'পুরো নাম',
      phone_number:     'মোবাইল নম্বর',
      amount_lost:      'ক্ষতির পরিমাণ',
      bank_name:        'ব্যাঙ্কের নাম',
      transaction_mode: 'লেনদেনের মাধ্যম',
      incident_date:    'ঘটনার তারিখ',
      incident_type:    'প্রতারণার ধরন',
      address:          'শহর / গ্রাম',
      description:      'বিবরণ',
    }
  },
  'gu-IN': {
    appName: 'ન્યાયસેતુ',
    appSub: 'NYAYSETU',
    help: 'મદદ · Help',
    langLabel: 'ભાષા · Language (Code-Mixed with English)',
    greeting: 'નમસ્તે, શું થયું?',
    greetingSub: 'Tell us in your own language. We do the paperwork.',
    card1Title: 'ફરિયાદ નોંધાવો',
    card1Sub: 'Cheated online? Speak. We write the complaint.',
    card2Title: 'નોટિસ સમજો',
    card2Sub: 'Got a legal letter? We explain it and read it aloud.',
    emergencyTitle: 'Lost money just now? Call 1930 first.',
    emergencySub: 'Banks can still freeze the money if you are quick.',
    footerNote: 'Your words are deleted after 30 minutes. NyaySetu helps you write and understand. It is not a lawyer.',
    intakeTitle: 'ફરિયાદ નોંધણી',
    intakePromptDefault: 'શું થયું હતું તે ટૂંકમાં તમારી ભાષામાં જણાવો.',
    tapToSpeak: 'બોલવા માટે દબાવો',
    tapAndSpeak: 'Tap and speak',
    typeInstead: 'Type instead',
    listening: 'સાંભળી રહ્યા છીએ…',
    stopSpeaking: 'રોકવા માટે દબાવો',
    whatWeHeard: 'What we heard. Tap to fix a word.',
    detailsSoFar: 'YOUR DETAILS SO FAR',
    listenAgain: 'Listen again',
    draftReady: 'તમારી ફરિયાદ તૈયાર છે',
    draftSub: 'Please read it once. Tap anything that is wrong and fix it before you take it to the police.',
    cyberDraftBadge: 'CYBERCRIME COMPLAINT',
    draftTag: 'DRAFT',
    narrativeTitle: 'ફરિયાદ વિગત',
    readFullText: 'Read the full text',
    hideFullText: 'Hide full text',
    disclaimer: 'This is a draft, not a filed case. Submit it at cybercrime.gov.in or your nearest cyber police station.',
    printPdf: 'Approve & Download PDF',
    shareWa: 'Share on WhatsApp',
    startOver: 'Start over',
    back: 'Back',
    stepOf: 'of 8',
    fields: {
      complainant_name: 'પૂરું નામ',
      phone_number:     'મોબાઇલ નંબર',
      amount_lost:      'ગુમાવેલ રકમ',
      bank_name:        'બેંકનું નામ',
      transaction_mode: 'ટ્રાન્ઝેક્શન મોડ',
      incident_date:    'ઘટનાની તારીખ',
      incident_type:    'છેતરપિંડીનો પ્રકાર',
      address:          'ગામ / શહેર',
      description:      'વિગત',
    }
  },
  'ml-IN': {
    appName: 'ന്യായസേതു',
    appSub: 'NYAYSETU',
    help: 'സഹായം · Help',
    langLabel: 'ഭാഷ · Language (Code-Mixed with English)',
    greeting: 'നമസ്കാരം, എന്താണ് സംഭവിച്ചത്?',
    greetingSub: 'Tell us in your own language. We do the paperwork.',
    card1Title: 'പരാതി നൽകുക',
    card1Sub: 'Cheated online? Speak. We write the complaint.',
    card2Title: 'നോട്ടീസ് മനസിലാക്കുക',
    card2Sub: 'Got a legal letter? We explain it and read it aloud.',
    emergencyTitle: 'Lost money just now? Call 1930 first.',
    emergencySub: 'Banks can still freeze the money if you are quick.',
    footerNote: 'Your words are deleted after 30 minutes. NyaySetu helps you write and understand. It is not a lawyer.',
    intakeTitle: 'പരാതി നൽകൽ',
    intakePromptDefault: 'എന്താണ് സംഭവിച്ചതെന്ന് നിങ്ങളുടെ വാക്കുകളിൽ പറയൂ.',
    tapToSpeak: 'സംസാരിക്കാൻ അമർത്തുക',
    tapAndSpeak: 'Tap and speak',
    typeInstead: 'Type instead',
    listening: 'കേൾക്കുന്നു…',
    stopSpeaking: 'നിർത്താൻ അമർത്തുക',
    whatWeHeard: 'What we heard. Tap to fix a word.',
    detailsSoFar: 'YOUR DETAILS SO FAR',
    listenAgain: 'Listen again',
    draftReady: 'നിങ്ങളുടെ പരാതി തയ്യാറാണ്',
    draftSub: 'Please read it once. Tap anything that is wrong and fix it before you take it to the police.',
    cyberDraftBadge: 'CYBERCRIME COMPLAINT',
    draftTag: 'DRAFT',
    narrativeTitle: 'പരാതി വിവരണം',
    readFullText: 'Read the full text',
    hideFullText: 'Hide full text',
    disclaimer: 'This is a draft, not a filed case. Submit it at cybercrime.gov.in or your nearest cyber police station.',
    printPdf: 'Approve & Download PDF',
    shareWa: 'Share on WhatsApp',
    startOver: 'Start over',
    back: 'Back',
    stepOf: 'of 8',
    fields: {
      complainant_name: 'പൂർണ്ണ നാമം',
      phone_number:     'മൊബൈൽ നമ്പർ',
      amount_lost:      'നഷ്ടപ്പെട്ട തുക',
      bank_name:        'ബാങ്കിന്റെ പേര്',
      transaction_mode: 'ഇടപാട് രീതി',
      incident_date:    'സംഭവം നടന്ന തീയതി',
      incident_type:    'തട്ടിപ്പ് രീതി',
      address:          'നാട് / സ്ഥലം',
      description:      'വിവരണം',
    }
  },
  'pa-IN': {
    appName: 'ਨਿਆਏਸੇਤੂ',
    appSub: 'NYAYSETU',
    help: 'ਮਦਦ · Help',
    langLabel: 'ਭਾਸ਼ਾ · Language (Code-Mixed with English)',
    greeting: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਕੀ ਹੋਇਆ?',
    greetingSub: 'Tell us in your own language. We do the paperwork.',
    card1Title: 'ਸ਼ਿਕਾਇਤ ਦਰਜ ਕਰੋ',
    card1Sub: 'Cheated online? Speak. We write the complaint.',
    card2Title: 'ਨੋਟਿਸ ਸਮਝੋ',
    card2Sub: 'Got a legal letter? We explain it and read it aloud.',
    emergencyTitle: 'Lost money just now? Call 1930 first.',
    emergencySub: 'Banks can still freeze the money if you are quick.',
    footerNote: 'Your words are deleted after 30 minutes. NyaySetu helps you write and understand. It is not a lawyer.',
    intakeTitle: 'ਸ਼ਿਕਾਇਤ ਦਰਜ',
    intakePromptDefault: 'ਕੀ ਹੋਇਆ ਸੀ, ਸੰਖੇਪ ਵਿੱਚ ਦੱਸੋ।',
    tapToSpeak: 'ਬੋਲਣ ਲਈ ਟੈਪ ਕਰੋ',
    tapAndSpeak: 'Tap and speak',
    typeInstead: 'Type instead',
    listening: 'ਸੁਣ ਰਹੇ ਹਾਂ…',
    stopSpeaking: 'ਰੋਕਣ ਲਈ ਟੈਪ ਕਰੋ',
    whatWeHeard: 'What we heard. Tap to fix a word.',
    detailsSoFar: 'YOUR DETAILS SO FAR',
    listenAgain: 'Listen again',
    draftReady: 'ਤੁਹਾਡੀ ਸ਼ਿਕਾਇਤ ਤਿਆਰ ਹੈ',
    draftSub: 'Please read it once. Tap anything that is wrong and fix it before you take it to the police.',
    cyberDraftBadge: 'CYBERCRIME COMPLAINT',
    draftTag: 'DRAFT',
    narrativeTitle: 'ਸ਼ਿਕਾਇਤ ਵੇਰਵਾ',
    readFullText: 'Read the full text',
    hideFullText: 'Hide full text',
    disclaimer: 'This is a draft, not a filed case. Submit it at cybercrime.gov.in or your nearest cyber police station.',
    printPdf: 'Approve & Download PDF',
    shareWa: 'Share on WhatsApp',
    startOver: 'Start over',
    back: 'Back',
    stepOf: 'of 8',
    fields: {
      complainant_name: 'ਪੂਰਾ ਨਾਮ',
      phone_number:     'ਮੋਬਾਈਲ ਨੰਬਰ',
      amount_lost:      'ਗੁਆਚੀ ਰਕਮ',
      bank_name:        'ਬੈਂਕ ਦਾ ਨਾਮ',
      transaction_mode: 'ਲੈਣ-ਦੇਣ ਦਾ ਤਰੀਕਾ',
      incident_date:    'ਘਟਨਾ ਦੀ ਮਿਤੀ',
      incident_type:    'ਧੋਖਾਧੜੀ ਦੀ ਕਿਸਮ',
      address:          'ਸ਼ਹਿਰ / ਪਿੰਡ',
      description:      'ਵੇਰਵਾ',
    }
  },
  'as-IN': {
    appName: 'ন্যায়সেতু',
    appSub: 'NYAYSETU',
    help: 'সহায় · Help',
    langLabel: 'ভাষা · Language (Code-Mixed with English)',
    greeting: 'নমস্কাৰ, কি হ’ল?',
    greetingSub: 'Tell us in your own language. We do the paperwork.',
    card1Title: 'অভিযোগ দাখিল কৰক',
    card1Sub: 'Cheated online? Speak. We write the complaint.',
    card2Title: 'জাননী বুজি লওক',
    card2Sub: 'Got a legal letter? We explain it and read it aloud.',
    emergencyTitle: 'Lost money just now? Call 1930 first.',
    emergencySub: 'Banks can still freeze the money if you are quick.',
    footerNote: 'Your words are deleted after 30 minutes. NyaySetu helps you write and understand. It is not a lawyer.',
    intakeTitle: 'অভিযোগ দাখিল',
    intakePromptDefault: 'কি হৈছিল, আপোনাৰ নিজৰ ভাষাত চমুকৈ কওক।',
    tapToSpeak: 'ক’বলৈ টিপক',
    tapAndSpeak: 'Tap and speak',
    typeInstead: 'Type instead',
    listening: 'শুনি আছোঁ…',
    stopSpeaking: 'ৰখাবলৈ টিপক',
    whatWeHeard: 'What we heard. Tap to fix a word.',
    detailsSoFar: 'YOUR DETAILS SO FAR',
    listenAgain: 'Listen again',
    draftReady: 'আপোনাৰ অভিযোগ প্ৰস্তুত',
    draftSub: 'Please read it once. Tap anything that is wrong and fix it before you take it to the police.',
    cyberDraftBadge: 'CYBERCRIME COMPLAINT',
    draftTag: 'DRAFT',
    narrativeTitle: 'অভিযোগৰ বিৱৰণ',
    readFullText: 'Read the full text',
    hideFullText: 'Hide full text',
    disclaimer: 'This is a draft, not a filed case. Submit it at cybercrime.gov.in or your nearest cyber police station.',
    printPdf: 'Approve & Download PDF',
    shareWa: 'Share on WhatsApp',
    startOver: 'Start over',
    back: 'Back',
    stepOf: 'of 8',
    fields: {
      complainant_name: 'সম্পূৰ্ণ নাম',
      phone_number:     'মোবাইল নম্বৰ',
      amount_lost:      'লোকচানৰ পৰিমাণ',
      bank_name:        'বেংকৰ নাম',
      transaction_mode: 'লেনদেনৰ মাধ্যম',
      incident_date:    'ঘটনাৰ তাৰিখ',
      incident_type:    'প্ৰতাৰণাৰ প্ৰকাৰ',
      address:          'চহৰ / গাঁও',
      description:      'বিৱৰণ',
    }
  },
  'en-IN': {
    appName: 'NyaySetu',
    appSub: 'NYAYSETU',
    help: 'Help',
    langLabel: 'Language (Code-Mixed with English)',
    greeting: 'Hello, what happened?',
    greetingSub: 'Tell us in your own language. We do the paperwork.',
    card1Title: 'File a complaint',
    card1Sub: 'Cheated online? Speak. We write the complaint.',
    card2Title: 'Understand notice',
    card2Sub: 'Got a legal letter? We explain it and read it aloud.',
    emergencyTitle: 'Lost money just now? Call 1930 first.',
    emergencySub: 'Banks can still freeze the money if you are quick.',
    footerNote: 'Your words are deleted after 30 minutes. NyaySetu helps you write and understand. It is not a lawyer.',
    intakeTitle: 'File a Complaint',
    intakePromptDefault: 'Tell us briefly what happened in your own words.',
    tapToSpeak: 'Tap to speak',
    tapAndSpeak: 'Tap and speak',
    typeInstead: 'Type instead',
    listening: 'Listening…',
    stopSpeaking: 'Tap to stop',
    whatWeHeard: 'What we heard. Tap to fix a word.',
    detailsSoFar: 'YOUR DETAILS SO FAR',
    listenAgain: 'Listen again',
    draftReady: 'Your draft is ready',
    draftSub: 'Please read it once. Tap anything that is wrong and fix it before you take it to the police.',
    cyberDraftBadge: 'CYBERCRIME COMPLAINT',
    draftTag: 'DRAFT',
    narrativeTitle: 'Complaint Details',
    readFullText: 'Read the full text',
    hideFullText: 'Hide full text',
    disclaimer: 'This is a draft, not a filed case. Submit it at cybercrime.gov.in or your nearest cyber police station.',
    printPdf: 'Approve & Download PDF',
    shareWa: 'Share on WhatsApp',
    startOver: 'Start over',
    back: 'Back',
    stepOf: 'of 8',
    fields: {
      complainant_name: 'Full Name',
      phone_number:     'Mobile Number',
      amount_lost:      'Amount Lost',
      bank_name:        'Bank Name',
      transaction_mode: 'Transaction Mode',
      incident_date:    'Incident Date',
      incident_type:    'Crime Category',
      address:          'Location / Town',
      description:      'Description',
    }
  }
};

function getStrings(langCode) {
  const selected = UI_STRINGS[langCode] || {};
  const fallback = UI_STRINGS['kn-IN'];
  return {
    ...fallback,
    ...selected,
    fields: {
      ...fallback.fields,
      ...(selected.fields || {}),
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 16kHz PCM WAV ENCODER
// ═══════════════════════════════════════════════════════════════════════════════

function encodeWAV(samples, sampleRate = 16000) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);             // SubChunk1Size (16 for PCM)
  view.setUint16(20, 1, true);              // AudioFormat (1 = PCM)
  view.setUint16(22, 1, true);              // NumChannels (1 = Mono)
  view.setUint32(24, sampleRate, true);     // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true);              // BlockAlign
  view.setUint16(34, 16, true);             // BitsPerSample
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  // Write 16-bit PCM samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  return new Blob([view], { type: 'audio/wav' });
}

const INTAKE_FIELDS = [
  { key: 'complainant_name', icon: User        },
  { key: 'phone_number',     icon: Phone       },
  { key: 'amount_lost',      icon: IndianRupee },
  { key: 'bank_name',        icon: Building2   },
  { key: 'transaction_mode', icon: CreditCard  },
  { key: 'incident_date',    icon: Calendar    },
  { key: 'incident_type',    icon: AlertCircle },
  { key: 'address',          icon: MapPin      },
  { key: 'description',      icon: FileText    },
];

const GREETINGS = {
  'kn-IN': 'ನಮಸ್ಕಾರ! ನಾನು ನ್ಯಾಯಸೇತು ಕಾನೂನು ಸಹಾಯಕ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ದೂರನ್ನು ವಿವರಿಸಿ, ಅದನ್ನು ದಾಖಲಿಸಲು ನಾನು ನಿಮಗೆ ಹಂತ-ಹಂತವಾಗಿ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.',
  'hi-IN': 'नमस्ते! मैं न्यायसेतु कानूनी सहायक हूँ। कृपया अपनी शिकायत बताएं, मैं इसे दर्ज करने में आपकी मदद करूँगा।',
  'en-IN': 'Namaste! I am NyaySetu Legal Assistant. Please describe your complaint and I will guide you step-by-step to file it.',
  'ta-IN': 'வணக்கம்! நான் நியாயசேது சட்ட உதவியாளர். உங்கள் புகாரை விவரிக்கவும், அதை பதிவு செய்ய நான் உங்களுக்கு படிப்படியாக உதவுவேன்.',
  'te-IN': 'నమస్కారం! నేను న్యాయసేతు న్యాయ సహాయకుడిని. దయచేసి మీ ఫిర్యాదును వివరించండి, దాన్ని నమోదు చేయడంలో నేను మీకు దశలవారీగా సహాయం చేస్తాను.',
  'mr-IN': 'नमस्कार! मी न्यायसेतू कायदेशीर सहाय्यक आहे. कृपया आपली तक्रार सांगा, मी ती नोंदवण्यासाठी आपल्याला मदत करेन.',
  'bn-IN': 'নমস্কার! আমি ন্যায়সেতু আইনি সহকারী। অনুগ্রহ করে আপনার অভিযোগটি বলুন, আমি এটি নথিভুক্ত করতে আপনাকে সাহায্য করব।',
  'gu-IN': 'નમસ્તે! હું ન્યાયસેતુ કાનૂની સહાયક છું. કૃપા કરીને તમારી ફરિયાદ જણાવો, હું તેને નોંધવામાં તમારી મદદ કરીશ.',
  'ml-IN': 'നമസ്കാരം! ഞാൻ ന്യായസേതു നിയമ സഹായിയാണ്. ദയവായി നിങ്ങളുടെ പരാതി വ്യക്തമാക്കുക, ഞാൻ സഹായിക്കാം.',
  'pa-IN': 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਨਿਆਏਸੇਤੂ ਕਾਨੂੰਨੀ ਸਹਾਇਕ ਹਾਂ। ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੀ ਸ਼ਿਕਾਇਤ ਦੱਸੋ, ਮੈਂ ਇਸਨੂੰ ਦਰਜ ਕਰਨ ਵਿੱਚ ਤੁਹਾਡੀ ਮਦਦ ਕਰਾਂਗਾ।',
  'as-IN': 'নমস্কাৰ! মই ন্যায়সেতু আইনী সহায়ক। অনুগ্ৰহ কৰি আপোনাৰ অভিযোগ কওক, মই সহায় কৰিম।',
};

// ═══════════════════════════════════════════════════════════════════════════════
// TOAST SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  const remove = useCallback(id => setToasts(prev => prev.filter(t => t.id !== id)), []);
  return { toasts, push, remove };
}

function ToastContainer({ toasts, remove }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {toasts.map(t => (
        <div
          key={t.id}
          className={[
            'animate-slide-in flex items-start gap-3 px-4 py-3 rounded-2xl shadow-lg border backdrop-blur-md pointer-events-auto text-xs sm:text-sm font-medium',
            t.type === 'success'
              ? 'bg-[#EAF4EC] border-[#2D6A4F]/30 text-[#2D6A4F]'
              : t.type === 'error'
              ? 'bg-[#FEE2E2] border-[#E63946]/30 text-[#991B1B]'
              : 'bg-white border-[#1D3557]/15 text-[#1D3557]',
          ].join(' ')}
        >
          {t.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          ) : t.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
          ) : (
            <Activity className="w-4 h-4 text-[#1D3557] mt-0.5 shrink-0" />
          )}
          <span className="flex-1 leading-snug">{t.msg}</span>
          <button
            onClick={() => remove(t.id)}
            className="text-current/40 hover:text-current transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WAVEFORM VISUALIZER
// ═══════════════════════════════════════════════════════════════════════════════

const BAR_DELAYS = [0, 0.08, 0.16, 0.05, 0.13, 0.21, 0.03, 0.11, 0.19, 0.07,
                   0.15, 0.23, 0.01, 0.09, 0.17, 0.06, 0.14, 0.22, 0.04, 0.12,
                   0.20, 0.02, 0.10, 0.18];
const BAR_DURATIONS = [0.6, 0.75, 0.9, 0.65, 0.8, 0.7, 0.85, 0.6, 0.78, 0.68,
                       0.92, 0.72, 0.63, 0.88, 0.75, 0.6, 0.83, 0.70, 0.95, 0.65,
                       0.78, 0.60, 0.88, 0.73];

function WaveformVisualizer({ active }) {
  return (
    <div className="flex items-center justify-center gap-1 h-12 w-full">
      {BAR_DELAYS.map((delay, i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-colors duration-300 ${
            active ? 'bg-[#1D3557]' : 'bg-[#1D3557]/20'
          }`}
          style={{
            height: '4px',
            animationName:            active ? 'waveBar' : 'none',
            animationDuration:        `${BAR_DURATIONS[i]}s`,
            animationDelay:           `${delay}s`,
            animationTimingFunction:  'ease-in-out',
            animationIterationCount:  'infinite',
            animationDirection:       'alternate',
          }}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CARD WRAPPER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function Card({ children, className = '', onClick }) {
  return (
    <div
      onClick={onClick}
      className={[
        'bg-white rounded-2xl shadow-sm border border-[#1D3557]/10 p-5 transition-all',
        onClick ? 'cursor-pointer hover:shadow-md hover:border-[#1D3557]/25' : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT APP COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function App() {
  const [screen, setScreen] = useState('home'); // 'home' | 'grievance' | 'simplifier'
  const [language, setLanguage] = useState('kn-IN');
  const { toasts, push: toast, remove } = useToast();

  const handleLanguageChange = (code) => {
    setLanguage(code);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1D3557] font-sans antialiased selection:bg-[#1D3557]/15">
      <ToastContainer toasts={toasts} remove={remove} />

      {screen === 'home' && (
        <HomeScreen
          language={language}
          onLanguageChange={handleLanguageChange}
          onNavigate={setScreen}
          toast={toast}
        />
      )}

      {screen === 'grievance' && (
        <GrievanceScreen
          language={language}
          onLanguageChange={handleLanguageChange}
          onBack={() => setScreen('home')}
          toast={toast}
        />
      )}

      {screen === 'simplifier' && (
        <SimplifierScreen
          language={language}
          onLanguageChange={handleLanguageChange}
          onBack={() => setScreen('home')}
          toast={toast}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. LANDING / HOME SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

function HomeScreen({ language, onLanguageChange, onNavigate, toast }) {
  const strings = getStrings(language);

  return (
    <div className="min-h-screen flex flex-col justify-between max-w-xl mx-auto px-5 py-6">
      <div className="space-y-6">

        {/* Top Header: Logo & Help */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h1 className="text-3xl font-black text-[#1D3557] tracking-tight">
              {strings.appName}
            </h1>
            <p className="text-xs font-bold text-[#1D3557]/60 tracking-widest uppercase mt-0.5">
              {strings.appSub}
            </p>
          </div>

          <button
            onClick={() => toast('Call 1930 for cyber fraud emergencies or speak your complaint below.', 'info')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#1D3557]/70 hover:text-[#1D3557] hover:bg-black/5 transition-all"
          >
            <HelpCircle className="w-4 h-4 text-[#1D3557]" />
            <span>{strings.help}</span>
          </button>
        </div>

        {/* Language Selector Pills — All Gnani API Supported Languages with English integration */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-[#1D3557]/70 uppercase tracking-wider">
              {strings.langLabel}
            </p>
            <span className="text-[10px] font-bold text-[#1D3557]/60 bg-black/5 px-2 py-0.5 rounded-full">
              Gnani.ai Code-Mixed STT/TTS
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {SUPPORTED_LANGUAGES.map(l => {
              const active = language === l.code;
              return (
                <button
                  key={l.code}
                  onClick={() => onLanguageChange(l.code)}
                  className={[
                    'py-1.5 px-3 rounded-full text-xs font-bold transition-all text-center flex items-center gap-1',
                    active
                      ? 'bg-[#1D3557] text-white shadow-sm ring-2 ring-[#1D3557]/20'
                      : 'bg-white border border-[#1D3557]/20 text-[#1D3557] hover:border-[#1D3557]/50 hover:bg-[#1D3557]/5',
                  ].join(' ')}
                >
                  <span>{l.native}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Welcoming Greeting */}
        <div className="pt-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1D3557] tracking-tight">
            {strings.greeting}
          </h2>
          <p className="text-sm text-[#1D3557]/70 mt-1.5 leading-relaxed font-medium">
            {strings.greetingSub}
          </p>
        </div>

        {/* Core Action Cards */}
        <div className="space-y-3.5 pt-1">
          {/* Card 1: File Complaint */}
          <div
            onClick={() => onNavigate('grievance')}
            className="bg-white rounded-2xl p-5 shadow-sm border border-[#1D3557]/15 flex items-center justify-between gap-4 cursor-pointer hover:shadow-md hover:border-[#1D3557]/40 transition-all group"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-[#EAF2F8] text-[#1D3557] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Mic className="w-6 h-6 text-[#1D3557]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-[#1D3557] leading-snug">
                  {strings.card1Title}
                </h3>
                <p className="text-xs text-[#1D3557]/65 mt-0.5 leading-normal">
                  {strings.card1Sub}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#1D3557]/40 group-hover:text-[#1D3557] group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>

          {/* Card 2: Understand Legal Notice */}
          <div
            onClick={() => onNavigate('simplifier')}
            className="bg-white rounded-2xl p-5 shadow-sm border border-[#1D3557]/15 flex items-center justify-between gap-4 cursor-pointer hover:shadow-md hover:border-[#1D3557]/40 transition-all group"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-[#EAF2F8] text-[#1D3557] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileText className="w-6 h-6 text-[#1D3557]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-[#1D3557] leading-snug">
                  {strings.card2Title}
                </h3>
                <p className="text-xs text-[#1D3557]/65 mt-0.5 leading-normal">
                  {strings.card2Sub}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#1D3557]/40 group-hover:text-[#1D3557] group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>
        </div>

        {/* Emergency Banner (1930 Hotline) */}
        <div className="bg-[#FEF9E7] border border-[#F6E05E] rounded-2xl p-4 flex items-start gap-3 text-[#1D3557] shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-[#FDE68A] text-[#B45309] flex items-center justify-center shrink-0 mt-0.5">
            <Phone className="w-4 h-4 text-[#B45309]" />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-bold text-[#92400E] text-sm">
              {strings.emergencyTitle}
            </p>
            <p className="text-[#92400E]/80 mt-0.5 font-medium leading-relaxed">
              {strings.emergencySub}
            </p>
          </div>
          <a
            href="tel:1930"
            className="px-3 py-1.5 rounded-xl bg-[#92400E] text-white font-bold text-xs shrink-0 hover:bg-[#78350F] shadow transition-all"
          >
            Call 1930
          </a>
        </div>

      </div>

      {/* Footer Disclaimer */}
      <div className="pt-8 pb-4 text-center">
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#1D3557]/60 font-medium">
          <Lock className="w-3.5 h-3.5 text-[#1D3557]/60" />
          <p className="max-w-md leading-relaxed">
            {strings.footerNote}
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. GRIEVANCE FLOW (Voice Intake + Stepped Progress + Draft Review)
// ═══════════════════════════════════════════════════════════════════════════════

function GrievanceScreen({ language, onLanguageChange, onBack, toast }) {
  const strings = getStrings(language);
  const sessionId = useRef(`session_${Date.now()}_${Math.random().toString(36).slice(2)}`);

  // Screen substate: 'intake' | 'draft'
  const [subscreen, setSubscreen] = useState('intake');

  // Intake State
  const [messages, setMessages] = useState([
    { role: 'assistant', text: GREETINGS[language] || GREETINGS['kn-IN'] }
  ]);
  const [lastUserTranscript, setLastUserTranscript] = useState('');
  const [speechMultiplier, setSpeechMultiplier] = useState(1.0);
  const [entities, setEntities] = useState({});
  const [missingFields, setMissingFields] = useState(INTAKE_FIELDS.map(f => f.key));
  const [isComplete, setIsComplete] = useState(false);
  const [inputText, setInputText] = useState('');
  const [showTypeInput, setShowTypeInput] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  // Audio Playback Controls
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [lastAssistantAudioB64, setLastAssistantAudioB64] = useState(null);

  // Voice recording state
  const [recording, setRecording] = useState(false);
  const [recPaused, setRecPaused] = useState(false);
  const [recTimer, setRecTimer] = useState(0);

  // PDF & Editing State
  const [pdfLoading, setPdfLoading] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showFullNarrative, setShowFullNarrative] = useState(false);

  // Refs
  const audioCtxRef = useRef(null);
  const streamRef = useRef(null);
  const processorRef = useRef(null);
  const pcmChunksRef = useRef([]);
  const timerRef = useRef(null);
  const activeSourceRef = useRef(null);
  const playerCtxRef = useRef(null);
  const fallbackAudioRef = useRef(null);
  const recPausedRef = useRef(false);

  // Recording timer
  useEffect(() => {
    if (recording && !recPaused) {
      timerRef.current = setInterval(() => setRecTimer(n => n + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [recording, recPaused]);

  // Audio Stop
  const stopAudio = useCallback(() => {
    try {
      if (activeSourceRef.current) {
        try { activeSourceRef.current.stop(); } catch (_) {}
        activeSourceRef.current = null;
      }
      if (playerCtxRef.current && playerCtxRef.current.state === 'suspended') {
        playerCtxRef.current.resume().catch(() => {});
      }
      if (fallbackAudioRef.current) {
        fallbackAudioRef.current.pause();
        fallbackAudioRef.current = null;
      }
    } catch (_) {}
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  const pauseAudio = useCallback(async () => {
    try {
      if (playerCtxRef.current && playerCtxRef.current.state === 'running') {
        await playerCtxRef.current.suspend();
        setIsPaused(true);
      } else if (fallbackAudioRef.current && !fallbackAudioRef.current.paused) {
        fallbackAudioRef.current.pause();
        setIsPaused(true);
      }
    } catch (_) {}
  }, []);

  const resumeAudio = useCallback(async () => {
    try {
      if (playerCtxRef.current && playerCtxRef.current.state === 'suspended') {
        await playerCtxRef.current.resume();
        setIsPaused(false);
      } else if (fallbackAudioRef.current && fallbackAudioRef.current.paused) {
        fallbackAudioRef.current.play().catch(() => {});
        setIsPaused(false);
      }
    } catch (_) {}
  }, []);

  // Web Audio API Playback with baseline speed
  const playAudioB64 = useCallback(async (b64, customMultiplier) => {
    if (!b64) return;
    const mult = customMultiplier ?? speechMultiplier;
    const effectiveRate = mult * BASE_SPEED;
    stopAudio();

    try {
      const raw = atob(b64);
      const arr = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!playerCtxRef.current || playerCtxRef.current.state === 'closed') {
        playerCtxRef.current = new AudioCtx();
      }
      const ctx = playerCtxRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const audioBuffer = await ctx.decodeAudioData(arr.buffer.slice(0));
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = effectiveRate;
      source.connect(ctx.destination);
      source.onended = () => {
        if (activeSourceRef.current === source) {
          activeSourceRef.current = null;
          setIsSpeaking(false);
          setIsPaused(false);
        }
      };
      source.start(0);
      activeSourceRef.current = source;
      setIsSpeaking(true);
      setIsPaused(false);
    } catch (err) {
      try {
        const raw = atob(b64);
        const arr = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
        const blob = new Blob([arr], { type: 'audio/wav' });
        const url  = URL.createObjectURL(blob);
        const audio = new Audio(url);
        fallbackAudioRef.current = audio;
        audio.defaultPlaybackRate = effectiveRate;
        audio.playbackRate = effectiveRate;
        audio.onloadedmetadata = () => { audio.playbackRate = effectiveRate; };
        audio.onplay = () => { audio.playbackRate = effectiveRate; };
        audio.play().catch(() => {});
        audio.onended = () => {
          URL.revokeObjectURL(url);
          setIsSpeaking(false);
          setIsPaused(false);
        };
        setIsSpeaking(true);
        setIsPaused(false);
      } catch (_) {}
    }
  }, [speechMultiplier, stopAudio]);

  // Send message to backend
  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || chatLoading) return;
    stopAudio();
    setLastUserTranscript(text);
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInputText('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/chat-intake', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          session_id: sessionId.current,
          message:    text,
          language,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      setEntities(data.entities ?? {});
      setMissingFields(data.missing_fields ?? []);
      setIsComplete(data.is_complete ?? false);

      setMessages(prev => [...prev, {
        role:     'assistant',
        text:     data.assistant_response,
        audioB64: data.audio_base64,
        source:   data.tts_source,
      }]);

      if (data.audio_base64) {
        setLastAssistantAudioB64(data.audio_base64);
        playAudioB64(data.audio_base64);
      }

      if (data.is_complete) {
        toast('All details collected! Reviewing your draft…', 'success');
        setSubscreen('draft');
      }
    } catch (err) {
      toast(`Chat error: ${err.message}`, 'error');
    } finally {
      setChatLoading(false);
    }
  }, [chatLoading, language, playAudioB64, stopAudio, toast]);

  // Recording handlers
  const startRecording = useCallback(async () => {
    stopAudio();
    pcmChunksRef.current = [];
    recPausedRef.current = false;
    setRecPaused(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx({ sampleRate: 16000 });
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const proc = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = proc;
      proc.onaudioprocess = e => {
        if (!recPausedRef.current) {
          pcmChunksRef.current.push(new Float32Array(e.inputBuffer.getChannelData(0)));
        }
      };
      src.connect(proc);
      proc.connect(ctx.destination);
      setRecording(true);
      setRecTimer(0);
    } catch (err) {
      toast('Microphone access denied: ' + (err.message || 'grant permission'), 'error');
    }
  }, [stopAudio, toast]);

  const stopRecording = useCallback(async () => {
    if (!recording) return;
    setRecording(false);
    toast('Processing speech with Gnani Prisma STT…', 'info');

    try {
      processorRef.current?.disconnect();
      if (processorRef.current) processorRef.current.onaudioprocess = null;
      streamRef.current?.getTracks().forEach(t => t.stop());
      const sr = audioCtxRef.current?.sampleRate || 16000;
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }

      let total = 0;
      for (const c of pcmChunksRef.current) total += c.length;
      const merged = new Float32Array(total);
      let off = 0;
      for (const c of pcmChunksRef.current) { merged.set(c, off); off += c.length; }

      const wavBlob = encodeWAV(merged, sr);
      const form = new FormData();
      form.append('audio_file',    wavBlob, 'recording.wav');
      form.append('language_code', language);
      form.append('model',         'prisma-v3.0');

      setChatLoading(true);
      const sttRes = await fetch('/api/transcribe', { method: 'POST', body: form });
      if (!sttRes.ok) throw new Error(`STT HTTP ${sttRes.status}`);
      const sttData = await sttRes.json();
      const transcript = sttData.transcript || '';
      setChatLoading(false);

      if (!transcript.trim()) {
        toast('No speech detected — please tap and speak again.', 'error');
        return;
      }
      await sendMessage(transcript);
    } catch (err) {
      setChatLoading(false);
      toast(`Voice error: ${err.message}`, 'error');
    }
  }, [recording, language, sendMessage, toast]);

  // PDF Generation
  const downloadPdf = async () => {
    setPdfLoading(true);
    try {
      const res = await fetch('/api/generate-pdf', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(entities),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `NyaySetu_Complaint_${Date.now()}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast('Government-ready PDF downloaded!', 'success');
    } catch (err) {
      toast(`PDF download failed: ${err.message}`, 'error');
    } finally {
      setPdfLoading(false);
    }
  };

  // Reset
  const resetSession = async () => {
    stopAudio();
    try {
      await fetch(`/api/chat-intake/${sessionId.current}`, { method: 'DELETE' });
    } catch (_) {}
    sessionId.current = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    setMessages([{ role: 'assistant', text: GREETINGS[language] || GREETINGS['kn-IN'] }]);
    setEntities({});
    setMissingFields(INTAKE_FIELDS.map(f => f.key));
    setIsComplete(false);
    setInputText('');
    setLastUserTranscript('');
    setLastAssistantAudioB64(null);
    setSubscreen('intake');
    toast('Session reset — ready for a new complaint.', 'info');
  };

  // Inline Field Edit
  const saveInlineEdit = (key) => {
    setEntities(prev => ({ ...prev, [key]: editValue }));
    setEditingKey(null);
    setEditValue('');
    toast('Field updated ✓', 'success');
  };

  // WhatsApp Share
  const shareOnWhatsApp = () => {
    const text = `*NyaySetu Cybercrime Complaint Summary*\n\n` +
      `*Name:* ${entities.complainant_name || '—'}\n` +
      `*Mobile:* ${entities.phone_number || '—'}\n` +
      `*Amount Lost:* ${entities.amount_lost || '—'}\n` +
      `*Bank:* ${entities.bank_name || '—'}\n` +
      `*Date:* ${entities.incident_date || '—'}\n` +
      `*Incident:* ${entities.incident_type || '—'}\n\n` +
      `*Description:*\n${entities.description || '—'}\n\n` +
      `Generated securely via NyaySetu. Submit at cybercrime.gov.in or helpline 1930.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const filledCount = Math.min(8, INTAKE_FIELDS.filter(f => f.key !== 'description' && entities[f.key]).length);
  const currentStep = Math.min(8, Math.max(1, filledCount + 1));
  const latestAssistantMsg = messages.filter(m => m.role === 'assistant').slice(-1)[0]?.text;

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER DRAFT REVIEW SCREEN (Page 3)
  // ─────────────────────────────────────────────────────────────────────────────
  if (subscreen === 'draft') {
    return (
      <div className="max-w-xl mx-auto px-5 py-6 space-y-5 animate-float-up">

        {/* Top Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSubscreen('intake')}
            className="flex items-center gap-1.5 text-sm font-bold text-[#1D3557] hover:opacity-75 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{strings.back}</span>
          </button>
          <button
            onClick={resetSession}
            className="text-xs font-semibold text-[#1D3557]/60 hover:text-rose-600 transition-colors"
          >
            {strings.startOver}
          </button>
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-[#1D3557]">
            {strings.draftReady}
          </h2>
          <p className="text-xs text-[#1D3557]/70 mt-1 leading-relaxed">
            {strings.draftSub}
          </p>
        </div>

        {/* The Formal Complaint Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#1D3557]/15 overflow-hidden draft-watermark">
          <div className="h-1 bg-gradient-to-r from-[#FF9933] via-white to-[#046A38]" />

          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1D3557]/10 pb-3">
              <span className="text-[11px] font-black tracking-widest text-[#1D3557]/70 uppercase">
                {strings.cyberDraftBadge}
              </span>
              <span className="text-[10px] font-black tracking-wider text-[#E63946] bg-[#FEE2E2] px-2.5 py-0.5 rounded-full border border-[#E63946]/30 uppercase">
                {strings.draftTag}
              </span>
            </div>

            <div className="divide-y divide-[#1D3557]/10 text-xs sm:text-sm">
              {[
                { key: 'complainant_name', label: strings.fields.complainant_name },
                { key: 'phone_number',     label: strings.fields.phone_number },
                { key: 'address',          label: strings.fields.address },
                { key: 'amount_lost',      label: strings.fields.amount_lost },
                { key: 'bank_name',        label: strings.fields.bank_name },
                { key: 'incident_date',    label: strings.fields.incident_date },
              ].map(({ key, label }) => {
                const val = entities[key];
                const isEditing = editingKey === key;

                return (
                  <div key={key} className="py-2.5 flex items-center justify-between gap-3">
                    <span className="text-[#1D3557]/60 font-medium shrink-0 w-28">
                      {label}
                    </span>
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 flex-1 justify-end">
                        <input
                          type="text"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          className="px-2 py-1 text-xs border border-[#1D3557]/30 rounded-lg text-[#1D3557] focus:outline-none focus:ring-1 focus:ring-[#1D3557]"
                          autoFocus
                        />
                        <button
                          onClick={() => saveInlineEdit(key)}
                          className="p-1 bg-[#1D3557] text-white rounded-md hover:bg-[#2A4A73]"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setEditingKey(null)}
                          className="p-1 bg-slate-100 text-[#1D3557] rounded-md hover:bg-slate-200"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 justify-end text-right min-w-0 flex-1">
                        <span className="font-bold text-[#1D3557] truncate">
                          {val || '—'}
                        </span>
                        <button
                          onClick={() => { setEditingKey(key); setEditValue(val || ''); }}
                          className="p-1 text-[#1D3557]/40 hover:text-[#1D3557] rounded transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#1D3557]/10 space-y-1.5">
              <span className="text-xs font-bold text-[#1D3557]/70 block">
                {strings.narrativeTitle}
              </span>
              <p className={`text-xs text-[#1D3557] leading-relaxed whitespace-pre-line ${
                showFullNarrative ? '' : 'line-clamp-3'
              }`}>
                {entities.description || 'ವಂಚನೆಯ ಪೂರ್ಣ ವಿವರಗಳನ್ನು ದಾಖಲಿಸಲಾಗಿದೆ.'}
              </p>
              {entities.description && entities.description.length > 120 && (
                <button
                  onClick={() => setShowFullNarrative(prev => !prev)}
                  className="text-xs font-bold text-[#1D3557] underline hover:opacity-80"
                >
                  {showFullNarrative ? strings.hideFullText : strings.readFullText}
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="bg-[#FEF9E7] border border-[#F6E05E] rounded-2xl p-4 flex items-start gap-2.5 text-xs text-[#92400E]">
          <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
          <p className="leading-relaxed font-medium">
            {strings.disclaimer}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <button
            onClick={downloadPdf}
            disabled={pdfLoading}
            className="w-full bg-[#1D3557] hover:bg-[#2A4A73] text-white py-3.5 px-6 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {pdfLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating PDF…</>
            ) : (
              <><Download className="w-4 h-4" /> {strings.printPdf} <span className="text-xs font-normal opacity-80">(Print / Save)</span></>
            )}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={shareOnWhatsApp}
              className="py-3 px-4 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>{strings.shareWa}</span>
            </button>

            <button
              onClick={resetSession}
              className="py-3 px-4 rounded-xl bg-white border border-[#1D3557]/20 text-[#1D3557] hover:border-[#1D3557]/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#1D3557]/70" />
              <span>{strings.startOver}</span>
            </button>
          </div>
        </div>

      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER INTAKE / VOICE RECORDING SCREEN (Page 2)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-xl mx-auto px-5 py-6 flex flex-col justify-between min-h-screen">
      <div className="space-y-4">

        {/* Top Navigation & Step Indicator */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-bold text-[#1D3557] hover:opacity-75 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{strings.intakeTitle}</span>
          </button>

          <span className="text-xs font-black text-[#1D3557]/60 tracking-wider">
            {currentStep} {strings.stepOf}
          </span>
        </div>

        {/* Stepped Progress Bar (8 Segments) */}
        <div className="flex items-center gap-1">
          {[1,2,3,4,5,6,7,8].map(step => (
            <div
              key={step}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                step <= currentStep ? 'bg-[#1D3557]' : 'bg-[#1D3557]/15'
              }`}
            />
          ))}
        </div>

        {/* Language Selector Bar (All Gnani Languages with English Integration) */}
        <div className="space-y-1.5 bg-white p-3 rounded-2xl border border-[#1D3557]/15 shadow-sm">
          <div className="flex items-center justify-between px-0.5">
            <p className="text-[10px] font-bold text-[#1D3557]/70 uppercase tracking-wider">
              {strings.langLabel}:
            </p>
            <span className="text-[9px] font-bold text-[#1D3557]/50 bg-black/5 px-2 py-0.5 rounded-full">
              Prisma STT Code-Mixed
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SUPPORTED_LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => {
                  onLanguageChange(l.code);
                  if (messages.length <= 1) {
                    setMessages([{ role: 'assistant', text: GREETINGS[l.code] || GREETINGS['kn-IN'] }]);
                  }
                }}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                  language === l.code
                    ? 'bg-[#1D3557] text-white shadow-sm ring-1 ring-[#1D3557]'
                    : 'bg-[#FDFBF7] border border-[#1D3557]/20 text-[#1D3557] hover:border-[#1D3557]/40'
                }`}
              >
                {l.native}
              </button>
            ))}
          </div>
        </div>

        {/* Primary Assistant Question Card */}
        <Card className="p-4 bg-white border border-[#1D3557]/15">
          <p className="text-sm sm:text-base font-bold text-[#1D3557] leading-relaxed">
            {latestAssistantMsg || strings.intakePromptDefault}
          </p>
        </Card>

        {/* What We Heard (User Speech Preview) */}
        {lastUserTranscript && (
          <div className="bg-[#EAF2F8] border border-[#1D3557]/15 rounded-2xl p-4 space-y-1 animate-float-up">
            <p className="text-xs sm:text-sm text-[#1D3557] font-medium leading-relaxed">
              {lastUserTranscript}
            </p>
            <p className="text-[11px] text-[#1D3557]/60 font-semibold pt-1">
              {strings.whatWeHeard}
            </p>
          </div>
        )}

        {/* Details So Far Summary Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#1D3557]/15 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1D3557]/10 pb-2">
            <span className="text-[11px] font-black tracking-widest text-[#1D3557]/70 uppercase">
              {strings.detailsSoFar}
            </span>
            {lastAssistantAudioB64 && (
              <button
                onClick={() => playAudioB64(lastAssistantAudioB64)}
                className="flex items-center gap-1 text-[11px] font-bold text-[#1D3557] hover:underline"
              >
                <Volume2 className="w-3 h-3" />
                <span>{strings.listenAgain}</span>
              </button>
            )}
          </div>

          <div className="divide-y divide-[#1D3557]/10 text-xs">
            {[
              { key: 'complainant_name', label: strings.fields.complainant_name },
              { key: 'phone_number',     label: strings.fields.phone_number },
              { key: 'amount_lost',      label: strings.fields.amount_lost },
              { key: 'bank_name',        label: strings.fields.bank_name },
              { key: 'transaction_mode', label: strings.fields.transaction_mode },
              { key: 'incident_date',    label: strings.fields.incident_date },
              { key: 'incident_type',    label: strings.fields.incident_type },
              { key: 'address',          label: strings.fields.address },
            ].map(({ key, label }) => {
              const val = entities[key];
              return (
                <div key={key} className="py-1.5 flex items-center justify-between">
                  <span className="text-[#1D3557]/60 font-medium">{label}</span>
                  <span className={`font-semibold ${val ? 'text-[#1D3557]' : 'text-[#1D3557]/30'}`}>
                    {val || '—'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Quick jump to draft button if fields exist */}
          {filledCount >= 3 && (
            <div className="pt-2 border-t border-[#1D3557]/10 text-center">
              <button
                onClick={() => setSubscreen('draft')}
                className="text-xs font-bold text-[#1D3557] underline hover:opacity-80"
              >
                View Draft Form ({filledCount}/8 details collected) →
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Bottom Sticky Voice Controller Area */}
      <div className="pt-6 pb-4 space-y-3">

        {recording && (
          <div className="bg-white rounded-2xl p-3 border border-[#E63946]/30 shadow-sm animate-record-ring">
            <WaveformVisualizer active={!recPaused} />
            <p className="text-center text-xs font-bold text-[#E63946] mt-1">
              Recording audio ({recTimer}s)… tap stop to transcribe
            </p>
          </div>
        )}

        {/* Big Navy Mic Button */}
        <div className="flex flex-col items-center justify-center gap-2">
          <button
            onClick={recording ? stopRecording : startRecording}
            disabled={chatLoading}
            className={[
              'w-16 h-16 rounded-full flex items-center justify-center text-white shadow-xl transition-all active:scale-95',
              recording
                ? 'bg-[#E63946] ring-4 ring-[#E63946]/30 animate-pulse'
                : 'bg-[#1D3557] hover:bg-[#2A4A73]',
              chatLoading ? 'opacity-50 cursor-not-allowed' : '',
            ].join(' ')}
          >
            {chatLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            ) : recording ? (
              <Square className="w-6 h-6 fill-current text-white" />
            ) : (
              <Mic className="w-7 h-7 text-white" />
            )}
          </button>

          <p className="text-base font-bold text-[#1D3557] mt-1">
            {recording ? strings.listening : strings.tapToSpeak}
          </p>

          <div className="flex items-center gap-2 text-xs text-[#1D3557]/70 font-semibold">
            <span>{strings.tapAndSpeak}</span>
            <span>•</span>
            <button
              onClick={() => setShowTypeInput(prev => !prev)}
              className="underline text-[#1D3557] hover:opacity-80 font-bold"
            >
              {strings.typeInstead}
            </button>
          </div>
        </div>

        {/* Text Input Drawer */}
        {showTypeInput && (
          <div className="flex items-center gap-2 pt-2 animate-float-up">
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(inputText);
                }
              }}
              placeholder="Type your reply here…"
              className="flex-1 bg-white border border-[#1D3557]/20 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#1D3557] placeholder:text-[#1D3557]/40 focus:outline-none focus:ring-2 focus:ring-[#1D3557]/30"
            />
            <button
              onClick={() => sendMessage(inputText)}
              disabled={!inputText.trim() || chatLoading}
              className="w-10 h-10 rounded-xl bg-[#1D3557] hover:bg-[#2A4A73] text-white flex items-center justify-center shrink-0 disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. LEGAL SIMPLIFIER SCREEN ("ನೋಟಿಸ್ ಅರ್ಥ ಮಾಡಿಕೊಳ್ಳಿ")
// ═══════════════════════════════════════════════════════════════════════════════

function SimplifierScreen({ language, onLanguageChange, onBack, toast }) {
  const strings = getStrings(language);

  // Upload & Document Processing State
  const [selectedFile,       setSelectedFile]       = useState(null);
  const [isDragging,         setIsDragging]         = useState(false);
  const [uploading,          setUploading]          = useState(false);
  const [docResult,          setDocResult]          = useState(null);
  const [showExtractedText,  setShowExtractedText]  = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({
    key_allegations:     true,
    deadlines_dates:     true,
    financial_penalties: true,
    action_steps:        true,
  });

  // Chat State
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Audio Playback Controls
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const [speechMultiplier, setSpeechMultiplier] = useState(1.0);
  const playerCtxRef = useRef(null);
  const activeSourceRef = useRef(null);
  const fallbackAudioRef = useRef(null);

  // Recording State
  const [recording, setRecording] = useState(false);
  const [recTimer, setRecTimer] = useState(0);
  const audioCtxRef = useRef(null);
  const streamRef = useRef(null);
  const processorRef = useRef(null);
  const pcmChunksRef = useRef([]);
  const fileInputRef = useRef(null);
  const chatBottomRef = useRef(null);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  useEffect(() => {
    if (recording) {
      setRecTimer(0);
      timerIntervalRef.current = setInterval(() => setRecTimer(n => n + 1), 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [recording]);

  const stopAudio = useCallback(() => {
    try {
      if (activeSourceRef.current) {
        try { activeSourceRef.current.stop(); } catch (_) {}
        activeSourceRef.current = null;
      }
      if (playerCtxRef.current && playerCtxRef.current.state === 'suspended') {
        playerCtxRef.current.resume().catch(() => {});
      }
      if (fallbackAudioRef.current) {
        fallbackAudioRef.current.pause();
        fallbackAudioRef.current = null;
      }
    } catch (_) {}
    setPlayingAudioId(null);
    setIsAudioPaused(false);
  }, []);

  const pauseAudio = useCallback(async () => {
    try {
      if (playerCtxRef.current && playerCtxRef.current.state === 'running') {
        await playerCtxRef.current.suspend();
        setIsAudioPaused(true);
      } else if (fallbackAudioRef.current && !fallbackAudioRef.current.paused) {
        fallbackAudioRef.current.pause();
        setIsAudioPaused(true);
      }
    } catch (_) {}
  }, []);

  const resumeAudio = useCallback(async () => {
    try {
      if (playerCtxRef.current && playerCtxRef.current.state === 'suspended') {
        await playerCtxRef.current.resume();
        setIsAudioPaused(false);
      } else if (fallbackAudioRef.current && fallbackAudioRef.current.paused) {
        fallbackAudioRef.current.play().catch(() => {});
        setIsAudioPaused(false);
      }
    } catch (_) {}
  }, []);

  const playAudioB64 = useCallback(async (b64, audioId) => {
    if (!b64) return;
    const effectiveRate = speechMultiplier * BASE_SPEED;
    stopAudio();

    try {
      const raw = atob(b64);
      const arr = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!playerCtxRef.current || playerCtxRef.current.state === 'closed') {
        playerCtxRef.current = new AudioCtx();
      }
      const ctx = playerCtxRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const audioBuffer = await ctx.decodeAudioData(arr.buffer.slice(0));
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = effectiveRate;
      source.connect(ctx.destination);
      source.onended = () => {
        if (activeSourceRef.current === source) {
          activeSourceRef.current = null;
          setPlayingAudioId(null);
          setIsAudioPaused(false);
        }
      };
      source.start(0);
      activeSourceRef.current = source;
      setPlayingAudioId(audioId);
      setIsAudioPaused(false);
    } catch (err) {
      try {
        const raw = atob(b64);
        const arr = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
        const blob = new Blob([arr], { type: 'audio/wav' });
        const url  = URL.createObjectURL(blob);
        const audio = new Audio(url);
        fallbackAudioRef.current = audio;
        audio.defaultPlaybackRate = effectiveRate;
        audio.playbackRate = effectiveRate;
        audio.onloadedmetadata = () => { audio.playbackRate = effectiveRate; };
        audio.onplay = () => { audio.playbackRate = effectiveRate; };
        audio.play().catch(() => {});
        audio.onended = () => {
          URL.revokeObjectURL(url);
          setPlayingAudioId(null);
          setIsAudioPaused(false);
        };
        setPlayingAudioId(audioId);
        setIsAudioPaused(false);
      } catch (_) {}
    }
  }, [speechMultiplier, stopAudio]);

  const toggleAudio = (b64, audioId) => {
    if (playingAudioId === audioId) {
      if (isAudioPaused) resumeAudio();
      else pauseAudio();
    } else {
      playAudioB64(b64, audioId);
    }
  };

  const handleUploadFile = async (file, targetLang) => {
    if (!file) return;
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const validExts = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'txt'];
    if (!validExts.includes(ext)) {
      toast('Unsupported file format. Please upload a PDF, PNG, or JPG.', 'error');
      return;
    }

    stopAudio();
    setSelectedFile(file);
    setUploading(true);
    setDocResult(null);
    setChatMessages([]);
    toast(`Analyzing ${file.name} with PyMuPDF & RapidOCR…`, 'info');

    const form = new FormData();
    form.append('file', file);
    form.append('language', targetLang || language);

    try {
      const res = await fetch('/api/upload-legal-document', {
        method: 'POST',
        body: form,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setDocResult(data);

      setChatMessages([{
        id: 'msg_welcome',
        role: 'assistant',
        text: language.startsWith('kn')
          ? `ನಾನು ನಿಮ್ಮ ಕಾನೂನು ನೋಟಿಸ್ (${file.name}) ಅನ್ನು ವಿಶ್ಲೇಷಿಸಿದ್ದೇನೆ. ನೀವು ಯಾವುದೇ ಪ್ರಶ್ನೆ ಕೇಳಬಹುದು.`
          : `I have analyzed your legal notice (${file.name}). You can ask any question about it.`,
        audio_base64: null,
      }]);

      if (data.audio_base64) {
        playAudioB64(data.audio_base64, 'summary');
      }
      toast('Notice analyzed & structured successfully ✓', 'success');
    } catch (err) {
      toast(`Upload error: ${err.message}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  const sendChatMessage = async (queryText) => {
    const textToSend = (queryText || chatInput).trim();
    if (!textToSend || chatLoading) return;

    stopAudio();
    const userMsgId = `user_${Date.now()}`;
    setChatMessages(prev => [...prev, { id: userMsgId, role: 'user', text: textToSend }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const docId = docResult?.document_id || 'doc_current';
      const res = await fetch('/api/chat-document', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id:   docId,
          user_message:  textToSend,
          language_code: language,
          history:       chatMessages.slice(-6).map(m => ({ role: m.role, content: m.text })),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const asstMsgId = `asst_${Date.now()}`;
      setChatMessages(prev => [...prev, {
        id:           asstMsgId,
        role:         'assistant',
        text:         data.response_text,
        audio_base64: data.audio_base64,
        tts_source:   data.tts_source,
      }]);

      if (data.audio_base64) {
        playAudioB64(data.audio_base64, asstMsgId);
      }
    } catch (err) {
      toast(`Chat error: ${err.message}`, 'error');
    } finally {
      setChatLoading(false);
    }
  };

  const startVoiceQuestion = async () => {
    stopAudio();
    pcmChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx({ sampleRate: 16000 });
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const proc = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = proc;
      proc.onaudioprocess = e => {
        pcmChunksRef.current.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      };
      src.connect(proc);
      proc.connect(ctx.destination);
      setRecording(true);
      toast('Recording… ask your question about the notice', 'info');
    } catch (err) {
      toast('Microphone error: ' + err.message, 'error');
    }
  };

  const stopVoiceQuestion = async () => {
    if (!recording) return;
    setRecording(false);
    toast('Transcribing voice question…', 'info');

    try {
      processorRef.current?.disconnect();
      streamRef.current?.getTracks().forEach(t => t.stop());
      const sr = audioCtxRef.current?.sampleRate || 16000;
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') audioCtxRef.current.close();

      let total = 0;
      for (const c of pcmChunksRef.current) total += c.length;
      const merged = new Float32Array(total);
      let off = 0;
      for (const c of pcmChunksRef.current) { merged.set(c, off); off += c.length; }

      const wavBlob = encodeWAV(merged, sr);
      const form = new FormData();
      form.append('audio_file',    wavBlob, 'question.wav');
      form.append('language_code', language);
      form.append('model',         'prisma-v3.0');

      setChatLoading(true);
      const sttRes = await fetch('/api/transcribe', { method: 'POST', body: form });
      if (!sttRes.ok) throw new Error(`STT HTTP ${sttRes.status}`);
      const sttData = await sttRes.json();
      const transcript = sttData.transcript || '';
      setChatLoading(false);

      if (transcript.trim()) {
        await sendChatMessage(transcript);
      }
    } catch (err) {
      setChatLoading(false);
      toast(`Voice error: ${err.message}`, 'error');
    }
  };

  const categoryConfigs = [
    { key: 'key_allegations',     icon: AlertCircle, defaultTitle: 'Key Allegations / Notice Intent' },
    { key: 'deadlines_dates',     icon: Clock,       defaultTitle: 'Deadlines & Important Dates' },
    { key: 'financial_penalties', icon: Scale,       defaultTitle: 'Financial Demands & Penalties' },
    { key: 'action_steps',        icon: Shield,      defaultTitle: 'Recommended Action Steps' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

      {/* Top Bar: Back & All Gnani Supported Languages with English integration */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-bold text-[#1D3557] hover:opacity-75 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{strings.card2Title}</span>
          </button>

          <span className="text-[10px] font-bold text-[#1D3557]/60 bg-black/5 px-2.5 py-1 rounded-full">
            Prisma STT &amp; Timbre TTS Supported
          </span>
        </div>

        {/* All Supported Languages Pill Bar */}
        <div className="space-y-1.5 bg-white p-3 rounded-2xl border border-[#1D3557]/15 shadow-sm">
          <div className="flex items-center justify-between px-0.5">
            <p className="text-[10px] font-bold text-[#1D3557]/70 uppercase tracking-wider">
              Select Language (Code-Mixed with English):
            </p>
            <span className="text-[9px] font-bold text-[#1D3557]/50">
              11 Dialects Supported
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SUPPORTED_LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => {
                  onLanguageChange(l.code);
                  if (selectedFile) {
                    handleUploadFile(selectedFile, l.code);
                  }
                }}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                  language === l.code
                    ? 'bg-[#1D3557] text-white shadow-sm ring-1 ring-[#1D3557]'
                    : 'bg-[#FDFBF7] border border-[#1D3557]/20 text-[#1D3557] hover:border-[#1D3557]/40'
                }`}
              >
                {l.native}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dual Column Layout: Upload & Breakdown (Left) vs Chat (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* LEFT COLUMN: Upload & Categorized Breakdown */}
        <div className="lg:col-span-7 space-y-4">

          {/* Upload Dropzone */}
          <Card className="border-2 border-dashed border-[#1D3557]/20 hover:border-[#1D3557]/40 bg-white text-center p-6">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
              className="hidden"
              onChange={e => {
                if (e.target.files?.[0]) handleUploadFile(e.target.files[0]);
              }}
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-[#EAF2F8] text-[#1D3557] flex items-center justify-center">
                <UploadCloud className="w-6 h-6 text-[#1D3557]" />
              </div>
              <h4 className="text-sm font-bold text-[#1D3557]">
                Upload legal notice (PDF, JPG, PNG)
              </h4>
              <p className="text-xs text-[#1D3557]/60">
                RapidOCR extracts regional text and plain-language summaries automatically
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="mt-2 px-4 py-2 bg-[#1D3557] hover:bg-[#2A4A73] text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40"
              >
                {uploading ? 'Analyzing document…' : 'Choose File'}
              </button>
            </div>
          </Card>

          {/* Audio Summary Card */}
          {docResult?.audio_base64 && !uploading && (
            <Card className="p-4 bg-white border border-[#1D3557]/15 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => toggleAudio(docResult.audio_base64, 'summary')}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 ${
                    playingAudioId === 'summary' && !isAudioPaused ? 'bg-[#1D3557]' : 'bg-[#1D3557]/80'
                  }`}
                >
                  {playingAudioId === 'summary' && !isAudioPaused ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 ml-0.5" />
                  )}
                </button>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#1D3557] truncate">
                    {playingAudioId === 'summary'
                      ? isAudioPaused ? 'Summary Audio Paused' : 'Playing Voice Summary…'
                      : 'Listen to Plain-Language Summary'}
                  </p>
                  <p className="text-[10px] text-[#1D3557]/60">
                    Gnani Timbre TTS · Voice: Nalini
                  </p>
                </div>
              </div>
              {playingAudioId === 'summary' && (
                <button
                  onClick={stopAudio}
                  className="p-1.5 text-xs text-[#1D3557]/60 hover:text-rose-600"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              )}
            </Card>
          )}

          {/* Categorized Breakdown */}
          {docResult?.structured_summary && !uploading && (
            <div className="space-y-3">
              {categoryConfigs.map(cat => {
                const title = docResult.structured_summary.category_titles?.[cat.key] || cat.defaultTitle;
                const points = docResult.structured_summary[cat.key] || [];
                const isExpanded = expandedCategories[cat.key];
                if (!points.length) return null;

                const Icon = cat.icon;

                return (
                  <Card key={cat.key} className="p-4 bg-white border border-[#1D3557]/15">
                    <button
                      onClick={() => setExpandedCategories(prev => ({ ...prev, [cat.key]: !prev[cat.key] }))}
                      className="w-full flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-[#1D3557]" />
                        <h4 className="text-xs font-bold text-[#1D3557]">{title}</h4>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {isExpanded && (
                      <ul className="mt-3 space-y-1.5 text-xs text-[#1D3557]/80 list-disc list-inside">
                        {points.map((pt, idx) => (
                          <li key={idx} className="leading-relaxed">{pt}</li>
                        ))}
                      </ul>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Document Contextual Assistant Chat */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-4 bg-white border border-[#1D3557]/15 flex flex-col h-[520px]">
            <div className="border-b border-[#1D3557]/10 pb-2.5 flex items-center justify-between">
              <span className="text-xs font-bold text-[#1D3557]">
                Document Q&amp;A Assistant
              </span>
              <span className="text-[10px] font-semibold text-[#1D3557]/50">
                Gnani STT &amp; TTS
              </span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 text-xs">
              {chatMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center text-[#1D3557]/50 p-4">
                  <MessageSquare className="w-8 h-8 mb-2 text-[#1D3557]/30" />
                  <p>Upload a document to ask contextual questions</p>
                </div>
              )}

              {chatMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={[
                      'max-w-[85%] px-3.5 py-2.5 rounded-2xl leading-relaxed',
                      msg.role === 'user'
                        ? 'bg-[#1D3557] text-white rounded-br-sm'
                        : 'bg-[#F5F3EE] text-[#1D3557] rounded-bl-sm',
                    ].join(' ')}
                  >
                    <p>{msg.text}</p>
                    {msg.audio_base64 && (
                      <div className="mt-2 pt-1.5 border-t border-[#1D3557]/10 flex items-center gap-1.5">
                        <button
                          onClick={() => toggleAudio(msg.audio_base64, msg.id)}
                          className="flex items-center gap-1 text-[10px] font-bold text-[#1D3557] hover:underline"
                        >
                          {playingAudioId === msg.id && !isAudioPaused ? (
                            <><Pause className="w-2.5 h-2.5" /> Pause voice</>
                          ) : (
                            <><Play className="w-2.5 h-2.5" /> Listen</>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#F5F3EE] px-3 py-2 rounded-2xl flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1D3557] animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1D3557] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1D3557] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input Bar */}
            <div className="pt-2 border-t border-[#1D3557]/10 space-y-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={recording ? stopVoiceQuestion : startVoiceQuestion}
                  disabled={uploading || chatLoading}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white ${
                    recording ? 'bg-[#E63946] animate-pulse' : 'bg-[#1D3557]'
                  }`}
                  title="Ask by voice"
                >
                  <Mic className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendChatMessage();
                    }
                  }}
                  placeholder={recording ? 'Recording voice question…' : 'Ask any question about this notice…'}
                  className="flex-1 bg-white border border-[#1D3557]/20 rounded-xl px-3 py-2 text-xs text-[#1D3557] placeholder:text-[#1D3557]/40 focus:outline-none focus:ring-1 focus:ring-[#1D3557]"
                />

                <button
                  type="button"
                  onClick={() => sendChatMessage()}
                  disabled={!chatInput.trim() || chatLoading}
                  className="w-9 h-9 rounded-xl bg-[#1D3557] hover:bg-[#2A4A73] text-white flex items-center justify-center shrink-0 disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Status bar */}
              {playingAudioId && (
                <div className="flex items-center justify-between text-[11px] text-[#1D3557]/70">
                  <span>{isAudioPaused ? '❚❚ Audio paused' : '● Playing voice response…'}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={isAudioPaused ? resumeAudio : pauseAudio}
                      className="font-bold underline text-[#1D3557]"
                    >
                      {isAudioPaused ? 'Resume' : 'Pause'}
                    </button>
                    <span>·</span>
                    <button
                      onClick={stopAudio}
                      className="font-bold underline text-[#1D3557]"
                    >
                      Stop
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>

    </div>
  );
}
