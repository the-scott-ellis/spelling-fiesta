// Word lists for Spelling Bee game
// Grouped by difficulty for ages 6-9 (grades 1-3)

const WORD_LISTS = {
    easy: [
        "cat", "dog", "sun", "hat", "bed", "cup", "run", "big", "red", "top",
        "pig", "fox", "box", "hop", "sit", "map", "pen", "bus", "nut", "jam",
        "wet", "fan", "log", "mud", "zip", "hug", "dot", "fin", "gum", "web",
        "bat", "van", "wig", "yam", "cob", "dip", "hen", "jog", "kit", "lip"
    ],
    medium: [
        "apple", "brave", "cloud", "dance", "eagle", "flame", "grape", "happy",
        "jelly", "knock", "lemon", "magic", "night", "ocean", "piano", "queen",
        "river", "snake", "tiger", "under", "voice", "water", "youth", "zebra",
        "beach", "candy", "dream", "fresh", "globe", "honey", "giant", "jumpy",
        "kites", "light", "mouse", "north", "paint", "quick", "robot", "stone"
    ],
    hard: [
        "butterfly", "elephant", "beautiful", "chocolate", "dinosaur", "adventure",
        "breakfast", "calendar", "dangerous", "education", "furniture", "gymnasium",
        "happiness", "important", "jellyfish", "knowledge", "laughter", "mountains",
        "neighbors", "obstacles", "passenger", "questions", "rainbows", "satellite",
        "telephone", "umbrella", "vacation", "wonderful", "xylophone", "yesterday",
        "alligator", "blueberry", "caterpillar", "dragonfly", "everybody", "fantastic",
        "geography", "hamburger", "invisible", "landscape"
    ]
};

// Word manager handles picking words and custom words
const WordManager = {
    usedWords: new Set(),
    customWords: [],

    init() {
        // Load custom words from localStorage
        const saved = localStorage.getItem('spellingBee_customWords');
        if (saved) {
            try {
                this.customWords = JSON.parse(saved);
            } catch (e) {
                this.customWords = [];
            }
        }
    },

    getRandomWord(difficulty) {
        let pool = [...WORD_LISTS[difficulty]];

        // Add custom words to the pool
        if (this.customWords.length > 0) {
            pool = pool.concat(this.customWords);
        }

        // Filter out already used words
        let available = pool.filter(w => !this.usedWords.has(w));

        // If all words used, reset
        if (available.length === 0) {
            this.usedWords.clear();
            available = pool;
        }

        const word = available[Math.floor(Math.random() * available.length)];
        this.usedWords.add(word);
        return word;
    },

    addCustomWords(wordsString) {
        const newWords = wordsString
            .split(',')
            .map(w => w.trim().toLowerCase())
            .filter(w => w.length > 0 && /^[a-z]+$/.test(w));

        this.customWords = [...new Set([...this.customWords, ...newWords])];
        localStorage.setItem('spellingBee_customWords', JSON.stringify(this.customWords));
        return newWords.length;
    },

    clearCustomWords() {
        this.customWords = [];
        localStorage.removeItem('spellingBee_customWords');
    },

    reset() {
        this.usedWords.clear();
    }
};
