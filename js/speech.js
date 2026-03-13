// Speech recognition (voice input) and synthesis (word pronunciation)

const SpeechManager = {
    recognition: null,
    isListening: false,
    transcript: '',
    interimTranscript: '',
    onResult: null, // callback(transcript, isFinal)
    supported: false,
    bestVoice: null,

    // Preferred voice names in order of quality (Neural > Google > Microsoft > macOS native)
    VOICE_PREFERENCES: [
        'Google US English',
        'Google UK English Female',
        'Microsoft Jenny Online (Natural) - English (United States)',
        'Microsoft Aria Online (Natural) - English (United States)',
        'Samantha',
        'Alex',
    ],

    selectBestVoice() {
        const voices = window.speechSynthesis.getVoices();
        // Try preferred list first
        for (const preferred of this.VOICE_PREFERENCES) {
            const match = voices.find(v => v.name === preferred);
            if (match) { this.bestVoice = match; return; }
        }
        // Fall back to any en-US voice
        const enUs = voices.find(v => v.lang === 'en-US');
        if (enUs) { this.bestVoice = enUs; return; }
        // Fall back to any English voice
        const anyEn = voices.find(v => v.lang.startsWith('en'));
        if (anyEn) { this.bestVoice = anyEn; }
    },

    setApiKey(key) {
        if (key) {
            localStorage.setItem('spellingFiesta_openAiKey', key);
        } else {
            localStorage.removeItem('spellingFiesta_openAiKey');
        }
    },

    getApiKey() {
        return localStorage.getItem('spellingFiesta_openAiKey') || '';
    },

    init() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('Web Speech API not supported in this browser');
            this.supported = false;
            return;
        }
        this.supported = true;

        // Load voices — they may not be ready immediately
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = () => this.selectBestVoice();
        }
        this.selectBestVoice();

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.addEventListener('result', (event) => {
            let interim = '';
            let final = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    final += result[0].transcript;
                } else {
                    interim += result[0].transcript;
                }
            }

            if (final) {
                this.transcript += final;
            }
            this.interimTranscript = interim;

            if (this.onResult) {
                this.onResult(this.transcript + this.interimTranscript, !!final);
            }
        });

        this.recognition.addEventListener('error', (event) => {
            console.log('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                this.supported = false;
            }
        });

        this.recognition.addEventListener('end', () => {
            // If we're still supposed to be listening, restart
            if (this.isListening) {
                try {
                    this.recognition.start();
                } catch (e) {
                    // Already started
                }
            }
        });
    },

    startListening() {
        if (!this.supported || !this.recognition) return;
        this.transcript = '';
        this.interimTranscript = '';
        this.isListening = true;
        try {
            this.recognition.start();
        } catch (e) {
            // May already be started
        }
    },

    stopListening() {
        if (!this.recognition) return;
        this.isListening = false;
        try {
            this.recognition.stop();
        } catch (e) {
            // May already be stopped
        }
    },

    getFullTranscript() {
        return this.transcript + this.interimTranscript;
    },

    // Extract letters from spoken spelling
    // Kids might say "C - A - T" or "see ay tee" etc.
    extractLetters(spoken) {
        const raw = spoken.toLowerCase().trim();

        // Common speech-to-text letter mappings
        const letterMap = {
            'ay': 'a', 'eh': 'a', 'bee': 'b', 'be': 'b',
            'see': 'c', 'sea': 'c', 'dee': 'd', 'de': 'd',
            'ee': 'e', 'ef': 'f', 'eff': 'f',
            'gee': 'g', 'je': 'g', 'aitch': 'h', 'ache': 'h', 'age': 'h',
            'eye': 'i', 'jay': 'j', 'jae': 'j',
            'kay': 'k', 'que': 'k', 'el': 'l', 'elle': 'l',
            'em': 'm', 'en': 'n', 'oh': 'o',
            'pee': 'p', 'pe': 'p', 'cue': 'q', 'queue': 'q', 'que': 'q',
            'are': 'r', 'ar': 'r', 'es': 's', 'ass': 's',
            'tee': 't', 'tea': 't', 'te': 't',
            'you': 'u', 'yu': 'u',
            'vee': 'v', 've': 'v',
            'double you': 'w', 'double u': 'w', 'doubleyou': 'w',
            'ex': 'x', 'ecks': 'x',
            'why': 'y', 'wie': 'y', 'wye': 'y',
            'zee': 'z', 'zed': 'z', 'ze': 'z'
        };

        // First try: see if it's just the word spelled out with single letters
        // Remove all non-letter characters and see if it matches
        const justLetters = raw.replace(/[^a-z]/g, '');
        if (justLetters.length > 0) {
            // Check if the transcript looks like individual letters with spaces
            // e.g., "c a t" or "c. a. t."
            const parts = raw.split(/[\s,.\-]+/).filter(p => p.length > 0);
            let allSingleLetters = parts.every(p => p.length === 1 && /[a-z]/.test(p));

            if (allSingleLetters) {
                return parts.join('');
            }

            // Try mapping spoken letter names to actual letters
            let mapped = '';
            let unmapped = false;
            for (const part of parts) {
                if (part.length === 1 && /[a-z]/.test(part)) {
                    mapped += part;
                } else if (letterMap[part]) {
                    mapped += letterMap[part];
                } else {
                    unmapped = true;
                }
            }

            if (!unmapped && mapped.length > 0) {
                return mapped;
            }

            // Fallback: just use the raw letters
            return justLetters;
        }

        return '';
    },

    // Check if the spoken spelling matches the target word
    checkSpelling(spoken, targetWord) {
        const extracted = this.extractLetters(spoken);
        return extracted === targetWord.toLowerCase();
    },

    // Pronounce a word using the best available Web Speech API voice
    sayWord(word) {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.rate = 0.65;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        if (this.bestVoice) utterance.voice = this.bestVoice;
        window.speechSynthesis.speak(utterance);
    },

    // Pronounce a word using OpenAI TTS if an API key is set, otherwise fall back to sayWord()
    async sayWordWithAI(word) {
        const key = this.getApiKey();
        if (key) {
            try {
                const res = await fetch('https://api.openai.com/v1/audio/speech', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${key}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ model: 'tts-1', input: word, voice: 'nova', speed: 0.75 })
                });
                if (!res.ok) throw new Error(`OpenAI TTS error: ${res.status}`);
                const blob = await res.blob();
                const audio = new Audio(URL.createObjectURL(blob));
                audio.play();
                return;
            } catch (e) {
                console.warn('OpenAI TTS failed, falling back to Web Speech API:', e);
            }
        }
        this.sayWord(word);
    },

    // Say a phrase (for announcements)
    say(text, rate = 0.9) {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate;
        window.speechSynthesis.speak(utterance);
    }
};
