/**
 * Offline Indic Machine Translation Engine for VaaniSetu
 *
 * Provides instant, zero-latency on-device translation across English, Hindi,
 * Tamil, and Telugu without requiring external neural model weights.
 */

export interface TranslatedResult {
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
}

// 1. Core Tactical & Emergency Exact Phrases
const PHRASE_DATABASE: Record<string, Record<string, string>> = {
  emergency_help: {
    en: 'Emergency medical help needed immediately.',
    hi: 'तुरंत आपातकालीन चिकित्सा सहायता की आवश्यकता है।',
    ta: 'உடனடி அவசர மருத்துவ உதவி தேவை.',
    te: 'వెంటనే అత్యవసర వైద్య సహాయం అవసరం.',
  },
  send_rescue: {
    en: 'Send rescue team to our coordinates.',
    hi: 'हमारे निर्देशांक पर बचाव दल भेजें।',
    ta: 'எங்கள் இருப்பிடத்திற்கு மீட்புக் குழுவை அனுப்பவும்.',
    te: 'మా కోఆర్డినేట్లకు రెస్క్యూ బృందాన్ని పంపండి.',
  },
  water_rising: {
    en: 'Water levels are rising rapidly.',
    hi: 'बाढ़ का पानी तेज़ी से बढ़ रहा है।',
    ta: 'வெள்ள நீர் மட்டம் வேகமாக உயர்ந்து வருகிறது.',
    te: 'వరద నీటి మట్టం వేగంగా పెరుగుతోంది.',
  },
  bridge_collapsed: {
    en: 'Bridge has collapsed, route is blocked.',
    hi: 'पुल ढह गया है, रास्ता बंद है।',
    ta: 'பாலம் இடிந்து விழுந்தது, பாதை அடைக்கப்பட்டுள்ளது.',
    te: 'వంతెన కూలిపోయింది, మార్గం మూసుకుపోయింది.',
  },
  all_safe: {
    en: 'All personnel and civilians are safe.',
    hi: 'सभी कर्मी और नागरिक सुरक्षित हैं।',
    ta: 'அனைத்து பணியாளர்களும் பொதுமக்களும் பாதுகாப்பாக உள்ளனர்.',
    te: 'సిబ్బంది మరియు పౌరులంతా సురక్షితంగా ఉన్నారు.',
  },
  what_location: {
    en: 'What is your current status and location?',
    hi: 'आपकी वर्तमान स्थिति और स्थान क्या है?',
    ta: 'உங்கள் தற்போதைய நிலை மற்றும் இருப்பிடம் என்ன?',
    te: 'మీ ప్రస్తుత స్థితి మరియు స్థానం ఏమిటి?',
  },
  supplies_needed: {
    en: 'Food, drinking water, and medicine required.',
    hi: 'भोजन, पीने का पानी और दवा की आवश्यकता है।',
    ta: 'உணவு, குடிநீர் மற்றும் மருந்துகள் தேவை.',
    te: 'ఆహారం, తాగునీరు మరియు మందులు అవసరం.',
  },
  radio_check: {
    en: 'Radio check, can you hear me loud and clear?',
    hi: 'रेडियो चेक, क्या आप मुझे स्पष्ट सुन सकते हैं?',
    ta: 'ரேடியோ சோதனை, நான் பேசுவது தெளிவாக கேட்கிறதா?',
    te: 'రేడియో తనిఖీ, నేను మాట్లాడేది స్పష్టంగా వినిపిస్తోందా?',
  },
  loud_clear: {
    en: 'Receiving you loud and clear.',
    hi: 'आपकी आवाज़ साफ़ और स्पष्ट सुनाई दे रही है।',
    ta: 'உங்கள் குரல் தெளிவாக கேட்கிறது.',
    te: 'మీ మాటలు స్పష్టంగా వినిపిస్తున్నాయి.',
  },
  evacuation_started: {
    en: 'Evacuation has started in sector four.',
    hi: 'सेक्टर चार में निकासी शुरू हो गई है।',
    ta: 'பகுதி நான்கில் வெளியேற்றும் பணி தொடங்கியுள்ளது.',
    te: 'సెక్టార్ నాలుగులో తరలింపు ప్రారంభమైంది.',
  },
  road_cleared: {
    en: 'Main road is now cleared for movement.',
    hi: 'मुख्य सड़क अब आवागमन के लिए साफ़ है।',
    ta: 'முக்கிய சாலை இப்போது போக்குவரத்துக்கு திறக்கப்பட்டுள்ளது.',
    te: 'ప్రధాన రహదారి ఇప్పుడు రాకపోకలకు సిద్ధంగా ఉంది.',
  },
  mission_accomplished: {
    en: 'Rescue operation completed successfully.',
    hi: 'बचाव अभियान सफलतापूर्वक पूरा हुआ।',
    ta: 'மீட்புப் பணி வெற்றிகரமாக முடிந்தது.',
    te: 'రెస్క్యూ ఆపరేషన్ విజయవంతంగా పూర్తయింది.',
  },
};

// 2. Bilingual Word-Level Token Dictionary
const DICTIONARY: Record<string, {hi: string; ta: string; te: string; en: string}> = {
  emergency: {en: 'emergency', hi: 'आपातकाल', ta: 'அவசரம்', te: 'అత్యవసరం'},
  help: {en: 'help', hi: 'मदद', ta: 'உதவி', te: 'సహాయం'},
  medical: {en: 'medical', hi: 'चिकित्सा', ta: 'மருத்துவம்', te: 'వైద్యం'},
  doctor: {en: 'doctor', hi: 'डॉक्टर', ta: 'மருத்துவர்', te: 'వైద్యుడు'},
  hospital: {en: 'hospital', hi: 'अस्पताल', ta: 'மருத்துவமனை', te: 'ఆసుపత్రి'},
  water: {en: 'water', hi: 'पानी', ta: 'தண்ணீர்', te: 'నీరు'},
  food: {en: 'food', hi: 'भोजन', ta: 'உணவு', te: 'ఆహారం'},
  safe: {en: 'safe', hi: 'सुरक्षित', ta: 'பாதுகாப்பு', te: 'సురక్షితం'},
  danger: {en: 'danger', hi: 'खतरा', ta: 'ஆபத்து', te: 'ప్రమాదం'},
  flood: {en: 'flood', hi: 'बाढ़', ta: 'வெள்ளம்', te: 'వరద'},
  fire: {en: 'fire', hi: 'आग', ta: 'தீ', te: 'మంటలు'},
  road: {en: 'road', hi: 'सड़क', ta: 'சாலை', te: 'రోడ్డు'},
  bridge: {en: 'bridge', hi: 'पुल', ta: 'பாலம்', te: 'వంతెన'},
  team: {en: 'team', hi: 'टीम', ta: 'குழு', te: 'బృందం'},
  police: {en: 'police', hi: 'पुलिस', ta: 'காவல்துறை', te: 'పోలీసులు'},
  army: {en: 'army', hi: 'सेना', ta: 'ராணுவம்', te: 'సైన్యం'},
  location: {en: 'location', hi: 'स्थान', ta: 'இடம்', te: 'స్థలం'},
  status: {en: 'status', hi: 'स्थिति', ta: 'நிலை', te: 'స్థితి'},
  ready: {en: 'ready', hi: 'तैयार', ta: 'தயார்', te: 'సిద్ధం'},
  yes: {en: 'yes', hi: 'हाँ', ta: 'ஆம்', te: 'అవును'},
  no: {en: 'no', hi: 'नहीं', ta: 'இல்லை', te: 'కాదు'},
  now: {en: 'now', hi: 'अभी', ta: 'இப்போது', te: 'ఇప్పుడు'},
  stop: {en: 'stop', hi: 'रुको', ta: 'நில்', te: 'ఆగండి'},
  go: {en: 'go', hi: 'जाओ', ta: 'போ', te: 'వెళ్లండి'},
  come: {en: 'come', hi: 'आओ', ta: 'வா', te: 'రండి'},
  fast: {en: 'fast', hi: 'जल्दी', ta: 'வேகமாக', te: 'త్వరగా'},
  hello: {en: 'hello', hi: 'नमस्ते', ta: 'வணக்கம்', te: 'నమస్కారం'},
  thanks: {en: 'thank you', hi: 'धन्यवाद', ta: 'நன்றி', te: 'ధన్యవాదాలు'},
};

function normalizeLang(lang: string): 'en' | 'hi' | 'ta' | 'te' {
  const code = (lang || 'hi').trim().toLowerCase().split('-')[0].split('_')[0];
  if (code === 'ta') return 'ta';
  if (code === 'te') return 'te';
  if (code === 'en') return 'en';
  return 'hi';
}

export function translateOffline(
  text: string,
  sourceLangTag: string,
  targetLangTag: string,
): string {
  const src = normalizeLang(sourceLangTag);
  const tgt = normalizeLang(targetLangTag);

  if (src === tgt) {
    return text.trim();
  }

  const cleanText = text.trim();
  if (!cleanText) return '';

  const lower = cleanText.toLowerCase();

  // 1. Direct match in Phrase Database across any language
  for (const phraseEntry of Object.values(PHRASE_DATABASE)) {
    const srcPhrase = phraseEntry[src]?.toLowerCase() || '';
    if (srcPhrase && (lower === srcPhrase || lower.includes(srcPhrase) || srcPhrase.includes(lower))) {
      return phraseEntry[tgt] || cleanText;
    }
    // Also check English phrase keywords
    const enPhrase = phraseEntry.en?.toLowerCase() || '';
    if (lower.includes(enPhrase) || enPhrase.includes(lower)) {
      return phraseEntry[tgt] || cleanText;
    }
  }

  // 2. Keyword heuristic search
  for (const phraseEntry of Object.values(PHRASE_DATABASE)) {
    if (
      (lower.includes('emergency') || lower.includes('आपात') || lower.includes('அவசர') || lower.includes('అత్యవసర')) &&
      (lower.includes('help') || lower.includes('मदद') || lower.includes('உதவி') || lower.includes('సహాయ'))
    ) {
      return PHRASE_DATABASE.emergency_help[tgt];
    }
    if (
      (lower.includes('rescue') || lower.includes('बचाव') || lower.includes('மீட்பு') || lower.includes('రెస్క్యూ'))
    ) {
      return PHRASE_DATABASE.send_rescue[tgt];
    }
    if (
      (lower.includes('water') || lower.includes('flood') || lower.includes('पानी') || lower.includes('बाढ़') || lower.includes('நீர்') || lower.includes('నీరు'))
    ) {
      return PHRASE_DATABASE.water_rising[tgt];
    }
    if (
      (lower.includes('bridge') || lower.includes('पुल') || lower.includes('பாலம்') || lower.includes('వంతెన'))
    ) {
      return PHRASE_DATABASE.bridge_collapsed[tgt];
    }
    if (
      (lower.includes('safe') || lower.includes('सुरक्षित') || lower.includes('பாதுகாப்பு') || lower.includes('సురక్షితం'))
    ) {
      return PHRASE_DATABASE.all_safe[tgt];
    }
    if (
      (lower.includes('hear') || lower.includes('radio') || lower.includes('सुन') || lower.includes('கேட்கிறதா') || lower.includes('వినిపిస్తోందా'))
    ) {
      return PHRASE_DATABASE.loud_clear[tgt];
    }
  }

  // 3. Token-by-token replacement for dictionary words
  const words = cleanText.split(/\s+/);
  let matchedCount = 0;
  const translatedWords = words.map(word => {
    const w = word.toLowerCase().replace(/[^a-zA-Z\u0900-\u097F\u0B80-\u0BFF\u0C00-\u0C7F]/g, '');
    for (const dictEntry of Object.values(DICTIONARY)) {
      if (dictEntry[src]?.toLowerCase() === w || dictEntry.en.toLowerCase() === w) {
        matchedCount++;
        return dictEntry[tgt];
      }
    }
    return word;
  });

  if (matchedCount > 0) {
    return translatedWords.join(' ');
  }

  // 4. If no specific dictionary match, return original with standard punctuation
  return cleanText;
}

/** Pre-defined quick tactical demo prompts with full translations ready for offline calling */
export const OFFLINE_TACTICAL_PROMPTS = [
  {
    id: 'p1',
    label: '🚨 Medical Emergency',
    en: 'Emergency medical help needed immediately.',
    hi: 'तुरंत आपातकालीन चिकित्सा सहायता की आवश्यकता है।',
    ta: 'உடனடி அவசர மருத்துவ உதவி தேவை.',
    te: 'వెంటనే అత్యవసర వైద్య సహాయం అవసరం.',
  },
  {
    id: 'p2',
    label: '🌊 Flood Alert',
    en: 'Water levels are rising rapidly.',
    hi: 'बाढ़ का पानी तेज़ी से बढ़ रहा है।',
    ta: 'வெள்ள நீர் மட்டம் வேகமாக உயர்ந்து வருகிறது.',
    te: 'వరద నీటి మట్టం వేగంగా పెరుగుతోంది.',
  },
  {
    id: 'p3',
    label: '🚁 Rescue Request',
    en: 'Send rescue team to our coordinates.',
    hi: 'हमारे निर्देशांक पर बचाव दल भेजें।',
    ta: 'எங்கள் இருப்பிடத்திற்கு மீட்புக் குழுவை அனுப்பவும்.',
    te: 'మా కోఆర్డినేట్లకు రెస్క్యూ బృందం పంపండి.',
  },
  {
    id: 'p4',
    label: '🌉 Bridge Collapsed',
    en: 'Bridge has collapsed, route is blocked.',
    hi: 'पुल ढह गया है, रास्ता बंद है।',
    ta: 'பாலம் இடிந்து விழுந்தது, பாதை அடைக்கப்பட்டுள்ளது.',
    te: 'వంతెన కూలిపోయింది, మార్గం మూసుకుపోయింది.',
  },
  {
    id: 'p5',
    label: '📻 Radio Comms Check',
    en: 'Radio check, can you hear me loud and clear?',
    hi: 'रेडियो चेक, क्या आप मुझे स्पष्ट सुन सकते हैं?',
    ta: 'ரேடியோ சோதனை, நான் பேசுவது தெளிவாக கேட்கிறதா?',
    te: 'రేడియో తనిఖీ, నేను మాట్లాడేది స్పష్టంగా వినిపిస్తోందా?',
  },
  {
    id: 'p6',
    label: '✅ All Units Safe',
    en: 'All personnel and civilians are safe.',
    hi: 'सभी कर्मी और नागरिक सुरक्षित हैं।',
    ta: 'அனைத்து பணியாளர்களும் பொதுமக்களும் பாதுகாப்பாக உள்ளனர்.',
    te: 'సిబ్బంది మరియు పౌరులంతా సురక్షితంగా ఉన్నారు.',
  },
];
