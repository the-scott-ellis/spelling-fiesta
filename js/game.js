// Main game loop, state machine, and input handling

const Game = {
    // States
    STATE: {
        TITLE: 'title',
        PLAYER_SELECT: 'player_select',
        PLAYING: 'playing',
        RESULT: 'result',
        GAME_OVER: 'game_over'
    },

    // Current state
    state: 'title',
    stateTimer: 0,

    // Player selection
    selectedPlayers: [0, 1, 2, 3], // All 4 selected by default
    selectCursor: 0,
    difficulty: 'easy',

    // Game state
    players: [],
    scores: [],
    activePlayerIndex: 0,
    currentWord: '',
    isRecording: false,
    transcript: '',
    wordAnnounced: false,
    round: 1,
    targetScore: 10,

    // Result state
    lastCorrect: false,
    lastTranscript: '',
    resultTimer: 0,
    particles: [],

    // Input tracking
    keys: {},
    spaceHeld: false,
    isTouchDevice: false,
    touchControls: null,

    init() {
        const canvas = document.getElementById('game');
        UI.init(canvas);
        SoundManager.init();
        WordManager.init();
        SpeechManager.init();

        // Detect touch device
        this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        this.touchControls = document.getElementById('touch-controls');

        // Keyboard handlers
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));

        // Canvas tap handler (for touch devices as fallback)
        canvas.addEventListener('click', (e) => {
            SoundManager.resume();
        });

        // Speech result callback
        SpeechManager.onResult = (text, isFinal) => {
            this.transcript = text;
        };

        // Set up initial touch controls
        this.updateTouchControls();

        // Start game loop
        this.loop();
    },

    // ---- TOUCH CONTROLS ----
    updateTouchControls() {
        if (!this.touchControls) return;
        this.touchControls.innerHTML = '';

        const makeBtn = (label, cssClass) => {
            const btn = document.createElement('button');
            btn.className = 'touch-btn' + (cssClass ? ' ' + cssClass : '');
            btn.textContent = label;
            return btn;
        };

        switch (this.state) {
            case this.STATE.TITLE: {
                const startBtn = makeBtn('▶ START');
                startBtn.addEventListener('click', () => {
                    SoundManager.resume();
                    SoundManager.playClick();
                    this.state = this.STATE.PLAYER_SELECT;
                    this.updateTouchControls();
                });
                this.touchControls.appendChild(startBtn);

                const customBtn = makeBtn('+ Custom Words');
                customBtn.addEventListener('click', () => {
                    SoundManager.resume();
                    const input = prompt('Enter custom words (comma-separated):');
                    if (input) {
                        const count = WordManager.addCustomWords(input);
                        if (count > 0) SoundManager.playCorrect();
                    }
                });
                this.touchControls.appendChild(customBtn);

                const voiceBtn = makeBtn('🎙 AI Voice');
                voiceBtn.addEventListener('click', () => {
                    SoundManager.resume();
                    const current = SpeechManager.getApiKey();
                    const key = prompt('Enter OpenAI API key for AI voice (leave blank to clear):', current);
                    if (key !== null) {
                        SpeechManager.setApiKey(key.trim());
                        if (key.trim()) SoundManager.playCorrect();
                    }
                });
                this.touchControls.appendChild(voiceBtn);
                break;
            }

            case this.STATE.PLAYER_SELECT: {
                // Character toggle buttons
                CHARACTERS.forEach((char, i) => {
                    const btn = makeBtn(char.name);
                    if (this.selectedPlayers.includes(i)) {
                        btn.style.background = '#27ae60';
                        btn.style.borderColor = '#27ae60';
                    }
                    btn.addEventListener('click', () => {
                        SoundManager.resume();
                        SoundManager.playClick();
                        const idx = this.selectedPlayers.indexOf(i);
                        if (idx >= 0) {
                            this.selectedPlayers.splice(idx, 1);
                        } else {
                            this.selectedPlayers.push(i);
                            this.selectedPlayers.sort();
                        }
                        this.updateTouchControls();
                    });
                    this.touchControls.appendChild(btn);
                });

                // Difficulty button
                const diffBtn = makeBtn('Difficulty: ' + this.difficulty.toUpperCase());
                diffBtn.addEventListener('click', () => {
                    SoundManager.resume();
                    SoundManager.playClick();
                    const diffs = ['easy', 'medium', 'hard'];
                    const current = diffs.indexOf(this.difficulty);
                    this.difficulty = diffs[(current + 1) % diffs.length];
                    this.updateTouchControls();
                });
                this.touchControls.appendChild(diffBtn);

                // Go button
                const goBtn = makeBtn('▶ GO!');
                goBtn.style.background = '#e94560';
                goBtn.addEventListener('click', () => {
                    SoundManager.resume();
                    if (this.selectedPlayers.length >= 1) {
                        SoundManager.playClick();
                        this.startGame();
                        this.updateTouchControls();
                    }
                });
                this.touchControls.appendChild(goBtn);
                break;
            }

            case this.STATE.PLAYING: {
                // Hear word again button
                const hearBtn = makeBtn('🔊 Hear Word');
                hearBtn.addEventListener('click', () => {
                    SoundManager.resume();
                    if (this.currentWord) {
                        SoundManager.playAnnounce();
                        SpeechManager.sayWordWithAI(this.currentWord);
                    }
                });
                this.touchControls.appendChild(hearBtn);

                // Hold to spell button
                const spellBtn = makeBtn('🎤 HOLD TO SPELL', 'spell-btn');
                spellBtn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    SoundManager.resume();
                    spellBtn.classList.add('active');
                    this.startRecording();
                });
                spellBtn.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    spellBtn.classList.remove('active');
                    this.stopRecording();
                });
                // Mouse fallback for testing on desktop
                spellBtn.addEventListener('mousedown', (e) => {
                    SoundManager.resume();
                    spellBtn.classList.add('active');
                    this.startRecording();
                });
                spellBtn.addEventListener('mouseup', (e) => {
                    spellBtn.classList.remove('active');
                    this.stopRecording();
                });
                this.touchControls.appendChild(spellBtn);
                break;
            }

            case this.STATE.RESULT: {
                // No buttons during result (auto-advances)
                break;
            }

            case this.STATE.GAME_OVER: {
                const againBtn = makeBtn('▶ Play Again');
                againBtn.addEventListener('click', () => {
                    SoundManager.resume();
                    SoundManager.playClick();
                    this.startGame();
                    this.updateTouchControls();
                });
                this.touchControls.appendChild(againBtn);

                const titleBtn = makeBtn('🏠 Title');
                titleBtn.addEventListener('click', () => {
                    SoundManager.resume();
                    SoundManager.playClick();
                    this.state = this.STATE.TITLE;
                    this.updateTouchControls();
                });
                this.touchControls.appendChild(titleBtn);
                break;
            }
        }
    },

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    },

    update() {
        // Update particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1; // gravity
            p.life -= 1;
            return p.life > 0;
        });

        // State-specific updates
        if (this.state === this.STATE.RESULT) {
            this.resultTimer--;
            if (this.resultTimer <= 0) {
                this.nextTurn();
            }
        }
    },

    draw() {
        switch (this.state) {
            case this.STATE.TITLE:
                UI.drawTitleScreen();
                break;
            case this.STATE.PLAYER_SELECT:
                UI.drawPlayerSelect(this.selectedPlayers, this.selectCursor, this.difficulty);
                break;
            case this.STATE.PLAYING:
                UI.drawGameScreen({
                    players: this.players,
                    activePlayerIndex: this.activePlayerIndex,
                    currentWord: this.currentWord,
                    isRecording: this.isRecording,
                    transcript: this.transcript,
                    scores: this.scores,
                    targetScore: this.targetScore,
                    wordAnnounced: this.wordAnnounced,
                    round: this.round
                });
                break;
            case this.STATE.RESULT:
                UI.drawResultScreen(
                    this.lastCorrect,
                    this.currentWord,
                    CHARACTERS[this.players[this.activePlayerIndex].charIndex].name,
                    this.lastTranscript,
                    this.particles
                );
                break;
            case this.STATE.GAME_OVER:
                UI.drawGameOver(
                    this.players[this.winnerIndex],
                    this.players,
                    this.scores,
                    this.particles
                );
                break;
        }
    },

    onKeyDown(e) {
        if (this.keys[e.code]) return; // Prevent key repeat
        this.keys[e.code] = true;

        // Resume audio context on first interaction
        SoundManager.resume();

        switch (this.state) {
            case this.STATE.TITLE:
                this.handleTitleInput(e);
                break;
            case this.STATE.PLAYER_SELECT:
                this.handleSelectInput(e);
                break;
            case this.STATE.PLAYING:
                this.handlePlayingInput(e);
                break;
            case this.STATE.GAME_OVER:
                this.handleGameOverInput(e);
                break;
        }
    },

    onKeyUp(e) {
        this.keys[e.code] = false;

        if (this.state === this.STATE.PLAYING && e.code === 'Space') {
            this.stopRecording();
        }
    },

    // ---- INPUT HANDLERS ----

    handleTitleInput(e) {
        if (e.code === 'Enter') {
            SoundManager.playClick();
            this.state = this.STATE.PLAYER_SELECT;
            this.updateTouchControls();
        } else if (e.code === 'KeyC') {
            // Custom words
            const input = prompt('Enter custom words (comma-separated):');
            if (input) {
                const count = WordManager.addCustomWords(input);
                if (count > 0) {
                    SoundManager.playCorrect();
                }
            }
        } else if (e.code === 'KeyV') {
            // Voice API key
            const current = SpeechManager.getApiKey();
            const key = prompt('Enter OpenAI API key for AI voice (leave blank to clear):', current);
            if (key !== null) {
                SpeechManager.setApiKey(key.trim());
                if (key.trim()) SoundManager.playCorrect();
            }
        }
    },

    handleSelectInput(e) {
        const numChars = CHARACTERS.length;

        if (e.code === 'ArrowLeft') {
            SoundManager.playClick();
            this.selectCursor = (this.selectCursor - 1 + numChars) % numChars;
        } else if (e.code === 'ArrowRight') {
            SoundManager.playClick();
            this.selectCursor = (this.selectCursor + 1) % numChars;
        } else if (e.code === 'Space') {
            e.preventDefault();
            SoundManager.playClick();
            const idx = this.selectedPlayers.indexOf(this.selectCursor);
            if (idx >= 0) {
                this.selectedPlayers.splice(idx, 1);
            } else {
                this.selectedPlayers.push(this.selectCursor);
                this.selectedPlayers.sort();
            }
        } else if (e.code === 'KeyD') {
            SoundManager.playClick();
            const diffs = ['easy', 'medium', 'hard'];
            const current = diffs.indexOf(this.difficulty);
            this.difficulty = diffs[(current + 1) % diffs.length];
        } else if (e.code === 'Enter') {
            if (this.selectedPlayers.length >= 1) {
                SoundManager.playClick();
                this.startGame();
                this.updateTouchControls();
            }
        }
    },

    handlePlayingInput(e) {
        if (e.code === 'Space') {
            e.preventDefault();
            this.startRecording();
        } else if (e.code === 'KeyR') {
            // Repeat word
            if (this.currentWord) {
                SoundManager.playAnnounce();
                SpeechManager.sayWordWithAI(this.currentWord);
            }
        }
    },

    handleGameOverInput(e) {
        if (e.code === 'Enter') {
            SoundManager.playClick();
            this.startGame();
            this.updateTouchControls();
        } else if (e.code === 'Escape') {
            SoundManager.playClick();
            this.state = this.STATE.TITLE;
            this.updateTouchControls();
        }
    },

    // ---- GAME LOGIC ----

    startGame() {
        this.players = this.selectedPlayers.map(charIndex => ({
            charIndex
        }));
        this.scores = new Array(this.players.length).fill(0);
        this.activePlayerIndex = 0;
        this.round = 1;
        this.state = this.STATE.PLAYING;
        WordManager.reset();
        this.newWord();
    },

    newWord() {
        this.currentWord = WordManager.getRandomWord(this.difficulty);
        this.transcript = '';
        this.isRecording = false;
        this.wordAnnounced = false;

        // Announce the word after a brief delay
        setTimeout(() => {
            SoundManager.playAnnounce();
            SpeechManager.sayWordWithAI(this.currentWord);
            this.wordAnnounced = true;
        }, 500);
    },

    startRecording() {
        if (this.isRecording || !this.wordAnnounced) return;
        this.isRecording = true;
        this.transcript = '';
        SoundManager.playMicOn();
        SpeechManager.startListening();
    },

    stopRecording() {
        if (!this.isRecording) return;
        this.isRecording = false;
        SpeechManager.stopListening();

        // Brief delay to allow final transcript to arrive
        setTimeout(() => {
            this.checkAnswer();
        }, 300);
    },

    checkAnswer() {
        const spoken = SpeechManager.getFullTranscript();
        this.lastTranscript = SpeechManager.extractLetters(spoken);
        this.lastCorrect = SpeechManager.checkSpelling(spoken, this.currentWord);

        if (this.lastCorrect) {
            SoundManager.playCorrect();
            this.scores[this.activePlayerIndex]++;
            this.spawnParticles(400, 200, 30);

            // Check for winner
            if (this.scores[this.activePlayerIndex] >= this.targetScore) {
                this.winnerIndex = this.activePlayerIndex;
                this.state = this.STATE.GAME_OVER;
                this.resultTimer = 0;
                SoundManager.playFanfare();
                this.spawnParticles(400, 100, 60);
                this.updateTouchControls();
                return;
            }
        } else {
            SoundManager.playWrong();
        }

        this.state = this.STATE.RESULT;
        this.resultTimer = 180; // ~3 seconds at 60fps
        this.updateTouchControls();
    },

    nextTurn() {
        this.activePlayerIndex = (this.activePlayerIndex + 1) % this.players.length;
        if (this.activePlayerIndex === 0) {
            this.round++;
        }
        this.state = this.STATE.PLAYING;
        this.newWord();
        this.updateTouchControls();
    },

    spawnParticles(cx, cy, count) {
        const colors = ['#ffd700', '#e94560', '#27ae60', '#3498db', '#9b59b6', '#e67e22'];
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: cx,
                y: cy,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 3,
                size: Math.random() * 6 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 60 + Math.random() * 60
            });
        }
    }
};

// Start when page loads
window.addEventListener('load', () => Game.init());
