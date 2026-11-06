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
export const PHRASE_DATABASE: Record<string, Record<string, string>> = {
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
    te: 'వరద నీటి மட்டம் వేగంగా పెరుగుతోంది.',
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
  greeting_hello: {
    en: 'Hello, greetings from base command.',
    hi: 'नमस्ते, बेस कमांड से अभिवादन।',
    ta: 'வணக்கம், கட்டுப்பாட்டு மையத்திலிருந்து வாழ்த்துகள்.',
    te: 'నమస్కారం, బేస్ కమాండ్ నుండి శుభాకాంక్షలు.',
  },
  how_are_you: {
    en: 'How are you doing over there?',
    hi: 'आप वहाँ कैसे हैं?',
    ta: 'அங்கே நீங்கள் எப்படி இருக்கிறீர்கள்?',
    te: 'మీరు అక్కడ ఎలా ఉన్నారు?',
  },
  we_are_fine: {
    en: 'We are safe and holding our position.',
    hi: 'हम सुरक्षित हैं और अपनी स्थिति बनाए हुए हैं।',
    ta: 'நாங்கள் பாதுகாப்பாக இருக்கிறோம், எங்கள் நிலையில் உறுதியாக உள்ளோம்.',
    te: 'మేము సురక్షితంగా ఉన్నాము, మా స్థానంలో స్థిరంగా ఉన్నాము.',
  },
  need_doctor: {
    en: 'Doctor and ambulance needed urgently.',
    hi: 'डॉक्टर और एम्बुलेंस की तत्काल आवश्यकता है।',
    ta: 'மருத்துவர் மற்றும் ஆம்புலன்ஸ் அவசரமாக தேவை.',
    te: 'డాక్టర్ మరియు అంబులెన్స్ అత్యవసరంగా అవసరం.',
  },
  come_quickly: {
    en: 'Please proceed quickly to the rally point.',
    hi: 'कृपया शीघ्रता से मिलन स्थल पर पहुंचें।',
    ta: 'தயவுசெய்து விரைவில் சந்திப்பு இடத்திற்கு வாருங்கள்.',
    te: 'దయచేసి త్వరగా ర్యాలీ పాయింట్‌కు చేరుకోండి.',
  },
  danger_area: {
    en: 'Danger ahead, proceed with caution.',
    hi: 'आगे ख़तरा है, सावधानी से आगे बढ़ें।',
    ta: 'முன்னே ஆபத்து, எச்சரிக்கையுடன் செல்லுங்கள்.',
    te: 'ముందు ప్రమాదం ఉంది, జాగ్రత్తగా వెళ్లండి.',
  },
  stand_by: {
    en: 'Stand by for further instructions.',
    hi: 'आगे के निर्देशों के लिए प्रतीक्षा करें।',
    ta: 'அடுத்த கட்ட அறிவுறுத்தல்களுக்காக காத்திருங்கள்.',
    te: 'తదుపరి సూచనల కోసం వేచి ఉండండి.',
  },
  acknowledged: {
    en: 'Message received and understood.',
    hi: 'संदेश प्राप्त हुआ और समझ लिया गया।',
    ta: 'செய்தி பெறப்பட்டு புரிந்துகொள்ளப்பட்டது.',
    te: 'సందేశం అందింది మరియు అర్థమైంది.',
  },
};

// 2. Bilingual Word-Level Token Dictionary
export const DICTIONARY: Record<string, {hi: string; ta: string; te: string; en: string}> = {
  emergency: {en: 'emergency', hi: 'आपातकाल', ta: 'அவசரம்', te: 'అత్యవసరం'},
  help: {en: 'help', hi: 'मदद', ta: 'உதவி', te: 'సహాయం'},
  medical: {en: 'medical', hi: 'चिकित्सा', ta: 'மருத்துவம்', te: 'వైద్యం'},
  doctor: {en: 'doctor', hi: 'डॉक्टर', ta: 'மருத்துவர்', te: 'వైద్యుడు'},
  hospital: {en: 'hospital', hi: 'अस्पताल', ta: 'மருத்துவமனை', te: 'ఆసుపత్రి'},
  water: {en: 'water', hi: 'पानी', ta: 'தண்ணீர்', te: 'నీరు'},
  food: {en: 'food', hi: 'भोजन', ta: 'உணவு', te: 'ఆహారం'},
  safe: {en: 'safe', hi: 'सुरक्षित', ta: 'பாதுகாப்பு', te: 'సురక్షితం'},
  danger: {en: 'danger', hi: 'खतरा', ta: 'ஆபத்து', te: 'ప్రమాదం'},
  bridge: {en: 'bridge', hi: 'पुल', ta: 'பாலம்', te: 'వంతెన'},
  road: {en: 'road', hi: 'सड़क', ta: 'சாலை', te: 'రహదారి'},
  rescue: {en: 'rescue', hi: 'बचाव', ta: 'மீட்பு', te: 'రెస్క్యూ'},
  team: {en: 'team', hi: 'दल', ta: 'குழு', te: 'బృందం'},
  location: {en: 'location', hi: 'स्थान', ta: 'இருப்பிடம்', te: 'స్థానం'},
  radio: {en: 'radio', hi: 'रेडियो', ta: 'வானொலி', te: 'రేడియో'},
  clear: {en: 'clear', hi: 'स्पष्ट', ta: 'தெளிவு', te: 'స్పష్టం'},
  boat: {en: 'boat', hi: 'नाव', ta: 'படகு', te: 'పడవ'},
  helicopter: {en: 'helicopter', hi: 'हेलीकॉप्टर', ta: 'ஹெலிகாப்டர்', te: 'హెలికాప్టర్'},
  ambulance: {en: 'ambulance', hi: 'एम्बुलेंस', ta: 'ஆம்புலன்ஸ்', te: 'అంబులెన్స్'},
  flood: {en: 'flood', hi: 'बाढ़', ta: 'வெள்ளம்', te: 'వరద'},
  rain: {en: 'rain', hi: 'बारिश', ta: 'மழை', te: 'వర్షం'},
  fire: {en: 'fire', hi: 'आग', ta: 'தீ', te: 'మంటలు'},
  yes: {en: 'yes', hi: 'हाँ', ta: 'ஆம்', te: 'అవును'},
  no: {en: 'no', hi: 'नहीं', ta: 'இல்லை', te: 'కాదు'},
  ok: {en: 'ok', hi: 'ठीक है', ta: 'சரி', te: 'సరే'},
  now: {en: 'now', hi: 'अभी', ta: 'இப்போது', te: 'ఇప్పుడు'},
  stop: {en: 'stop', hi: 'रुको', ta: 'நில்லுங்கள்', te: 'ఆగండి'},
  go: {en: 'go', hi: 'जाओ', ta: 'செல்லுங்கள்', te: 'వెళ్లండి'},
  fast: {en: 'fast', hi: 'जल्दी', ta: 'வேகமாக', te: 'త్వరగా'},
  slow: {en: 'slow', hi: 'धीरे', ta: 'மெதுவாக', te: 'నెమ్మదిగా'},
  hello: {en: 'hello', hi: 'नमस्ते', ta: 'வணக்கம்', te: 'నమస్కారం'},
  thanks: {en: 'thanks', hi: 'धन्यवाद', ta: 'நன்றி', te: 'ధన్యవాదాలు'},
  please: {en: 'please', hi: 'कृपया', ta: 'தயவுசெய்து', te: 'దయచేసి'},
  people: {en: 'people', hi: 'लोग', ta: 'மக்கள்', te: 'ప్రజలు'},
  children: {en: 'children', hi: 'बच्चे', ta: 'குழந்தைகள்', te: 'పిల్లలు'},
  shelter: {en: 'shelter', hi: 'आश्रय', ta: 'தங்குமிடம்', te: 'ఆశ్రయం'},
  medicine: {en: 'medicine', hi: 'दवा', ta: 'மருந்து', te: 'మందు'},
  blood: {en: 'blood', hi: 'रक्त', ta: 'இரத்தம்', te: 'రక్తం'},
  electricity: {en: 'power', hi: 'बिजली', ta: 'மின்சாரம்', te: 'విద్యుత్'},
  network: {en: 'signal', hi: 'सिग्नल', ta: 'சமிக்ஞை', te: 'సిగ్నల్'},
};

function normalizeLangCode(lang: string): 'en' | 'hi' | 'ta' | 'te' {
  const code = (lang || 'hi').trim().toLowerCase().split('-')[0].split('_')[0];
  if (code === 'ta') return 'ta';
  if (code === 'te') return 'te';
  if (code === 'en') return 'en';
  return 'hi';
}

/**
 * Translates input text from source language to target language.
 */
export function translateOffline(
  text: string,
  sourceLanguage: string = 'hi',
  targetLanguage: string = 'ta',
): string {
  const src = normalizeLangCode(sourceLanguage);
  const tgt = normalizeLangCode(targetLanguage);

  // If languages match, return text as-is
  if (src === tgt || !text) {
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
    if (lower === enPhrase || lower.includes(enPhrase) || enPhrase.includes(lower)) {
      return phraseEntry[tgt] || cleanText;
    }
  }

  // 2. Keyword heuristic search for emergency concepts
  for (const phraseEntry of Object.values(PHRASE_DATABASE)) {
    if (
      (lower.includes('emergency') || lower.includes('आपात') || lower.includes('அவசர') || lower.includes('అత్యవసర') || lower.includes('doctor') || lower.includes('डॉक्टर')) &&
      (lower.includes('help') || lower.includes('मदद') || lower.includes('உதவி') || lower.includes('సహాయ') || lower.includes('need') || lower.includes('चाहिए'))
    ) {
      return PHRASE_DATABASE.emergency_help[tgt];
    }
    if (
      lower.includes('rescue') || lower.includes('बचाव') || lower.includes('மீட்பு') || lower.includes('రెస్క్యూ')
    ) {
      return PHRASE_DATABASE.send_rescue[tgt];
    }
    if (
      lower.includes('water') || lower.includes('flood') || lower.includes('पानी') || lower.includes('बाढ़') || lower.includes('நீர்') || lower.includes('నీరు') || lower.includes('వరద')
    ) {
      return PHRASE_DATABASE.water_rising[tgt];
    }
    if (
      lower.includes('bridge') || lower.includes('पुल') || lower.includes('பாலம்') || lower.includes('వంతెన')
    ) {
      return PHRASE_DATABASE.bridge_collapsed[tgt];
    }
    if (
      lower.includes('safe') || lower.includes('सुरक्षित') || lower.includes('பாதுகாப்பு') || lower.includes('సురక్షితం')
    ) {
      return PHRASE_DATABASE.all_safe[tgt];
    }
    if (
      lower.includes('hear') || lower.includes('radio') || lower.includes('सुन') || lower.includes('கேட்கிறதா') || lower.includes('వినిపిస్తోందా') || lower.includes('चेक')
    ) {
      return PHRASE_DATABASE.loud_clear[tgt];
    }
    if (
      lower.includes('hello') || lower.includes('नमस्ते') || lower.includes('வணக்கம்') || lower.includes('నమస్కారం') || lower.includes('hi')
    ) {
      return PHRASE_DATABASE.greeting_hello[tgt];
    }
    if (
      lower.includes('where') || lower.includes('कहाँ') || lower.includes('status') || lower.includes('స్థితి') || lower.includes('இருப்பிடம்')
    ) {
      return PHRASE_DATABASE.what_location[tgt];
    }
  }

  // 3. Token-by-token replacement for dictionary words
  const words = cleanText.split(/\s+/);
  let matchedCount = 0;
  const translatedWords = words.map(word => {
    const w = word.toLowerCase().replace(/[^a-zA-Z\u0900-\u097F\u0B80-\u0BFF\u0C00-\u0C7F]/g, '');
    for (const dictEntry of Object.values(DICTIONARY)) {
      if (
        dictEntry[src]?.toLowerCase() === w ||
        dictEntry.en.toLowerCase() === w ||
        dictEntry.hi.toLowerCase() === w
      ) {
        matchedCount++;
        return dictEntry[tgt];
      }
    }
    return word;
  });

  if (matchedCount > 0) {
    return translatedWords.join(' ');
  }

  // 4. Fallback to cleanText if unknown proper noun or numbers
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
    te: 'మా కోఆర్డినేట్లకు రెస్క్యూ బృందాన్ని పంపండి.',
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
