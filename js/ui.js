// UI rendering - all screens drawn on canvas

const UI = {
    canvas: null,
    ctx: null,
    width: 800,
    height: 600,

    isTouch: false,

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    },

    clear() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.width, this.height);
    },

    // ---- TITLE SCREEN ----
    drawTitleScreen(beeFrame) {
        this.clear();

        // Starry background
        this._drawStars();

        // Title
        this.ctx.font = 'bold 56px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ffd700';
        this.ctx.fillText('SPELLING BEE!', this.width / 2, 160);

        // Animated bee (simple pixel art)
        this._drawBee(this.width / 2 - 20 + Math.sin(Date.now() / 500) * 30, 200, beeFrame);

        // Subtitle
        this.ctx.font = '20px monospace';
        this.ctx.fillStyle = '#e94560';
        this.ctx.fillText('A Family Spelling Adventure', this.width / 2, 290);

        // Character preview
        const previewScale = 3.5;
        const previewSpacing = 100;
        const startX = this.width / 2 - (4 * previewSpacing) / 2;
        CHARACTERS.forEach((char, i) => {
            const cx = startX + i * previewSpacing + 20;
            SpriteRenderer.drawCharacter(this.ctx, char, cx, 310, previewScale, 0, false);
            this.ctx.font = 'bold 14px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(char.name, cx + 8 * previewScale, 395);
        });

        // Instructions
        this.ctx.font = '18px monospace';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(this.isTouch ? 'Tap START below' : 'Press ENTER to Start', this.width / 2, 460);

        if (!this.isTouch) {
            this.ctx.font = '14px monospace';
            this.ctx.fillStyle = '#888888';
            this.ctx.fillText('Press C to add custom words', this.width / 2, 500);
        }

        // Custom words count
        if (WordManager.customWords.length > 0) {
            this.ctx.fillStyle = '#27ae60';
            this.ctx.fillText(`${WordManager.customWords.length} custom word(s) loaded`, this.width / 2, 530);
        }
    },

    // ---- PLAYER SELECT SCREEN ----
    drawPlayerSelect(selectedPlayers, cursorIndex, difficulty) {
        this.clear();

        this.ctx.font = 'bold 36px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ffd700';
        this.ctx.fillText('CHOOSE PLAYERS', this.width / 2, 60);

        // Draw each character as selectable
        const selScale = 4;
        const selSpacing = 170;
        const selStartX = this.width / 2 - (4 * selSpacing) / 2;
        CHARACTERS.forEach((char, i) => {
            const cx = selStartX + i * selSpacing + 30;
            const charCenterX = cx + 8 * selScale;
            const isSelected = selectedPlayers.includes(i);
            const isCursor = cursorIndex === i;

            // Selection box
            if (isSelected) {
                this.ctx.fillStyle = 'rgba(39, 174, 96, 0.3)';
                this.ctx.fillRect(cx - 10, 75, 16 * selScale + 20, 220);
                this.ctx.strokeStyle = '#27ae60';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(cx - 10, 75, 16 * selScale + 20, 220);
            }

            // Cursor indicator
            if (isCursor) {
                this.ctx.fillStyle = '#ffd700';
                this.ctx.font = '20px monospace';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('▼', charCenterX, 90);
            }

            // Character
            SpriteRenderer.drawCharacter(this.ctx, char, cx, 100, selScale, 0, isCursor);

            // Name
            this.ctx.font = 'bold 18px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = isSelected ? '#27ae60' : '#ffffff';
            this.ctx.fillText(char.name, charCenterX, 210);

            // Selection status
            this.ctx.font = '14px monospace';
            this.ctx.fillStyle = isSelected ? '#27ae60' : '#666666';
            this.ctx.fillText(isSelected ? '✓ Playing' : (this.isTouch ? 'Tap below' : 'SPACE'), charCenterX, 230);
        });

        // Difficulty selector
        const difficulties = ['easy', 'medium', 'hard'];
        this.ctx.font = 'bold 20px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText('Difficulty:', this.width / 2, 320);

        difficulties.forEach((d, i) => {
            const dx = this.width / 2 + (i - 1) * 140;
            const isActive = difficulty === d;
            this.ctx.font = isActive ? 'bold 18px monospace' : '16px monospace';
            this.ctx.fillStyle = isActive ? '#e94560' : '#666666';
            this.ctx.fillText(d.toUpperCase(), dx, 355);
            if (isActive) {
                this.ctx.fillText('▲', dx, 340);
            }
        });

        // Instructions
        this.ctx.font = '16px monospace';
        this.ctx.fillStyle = '#ffffff';
        if (this.isTouch) {
            this.ctx.fillText('Tap names below to toggle players', this.width / 2, 420);
        } else {
            this.ctx.fillText('← → Move   SPACE Toggle   D Difficulty   ENTER Start', this.width / 2, 420);
        }

        const selectedCount = selectedPlayers.length;
        if (selectedCount < 1) {
            this.ctx.fillStyle = '#e94560';
            this.ctx.fillText('Select at least 1 player!', this.width / 2, 460);
        }
    },

    // ---- GAME SCREEN ----
    drawGameScreen(gameState) {
        this.clear();

        const { players, activePlayerIndex, currentWord, isRecording, transcript,
                scores, targetScore, wordAnnounced } = gameState;

        // Progress track at top
        this._drawProgressTrack(players, scores, targetScore);

        // Active player info
        const activePlayer = players[activePlayerIndex];
        const activeChar = CHARACTERS[activePlayer.charIndex];

        // Active player - big and center stage
        const activeScale = 6;
        const activeW = 16 * activeScale;
        const activeX = this.width / 2 - activeW / 2;
        SpriteRenderer.drawCharacter(this.ctx, activeChar, activeX, 90, activeScale, 0, true);

        // Active player name
        this.ctx.font = 'bold 24px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ffd700';
        this.ctx.fillText(`${activeChar.name}'s Turn`, this.width / 2, 235);

        // Small inactive player sprites along the sides
        const inactivePlayers = players.map((p, i) => ({ ...p, idx: i })).filter((_, i) => i !== activePlayerIndex);
        if (inactivePlayers.length > 0) {
            const smallScale = 2;
            // Left side
            const leftPlayers = inactivePlayers.slice(0, Math.ceil(inactivePlayers.length / 2));
            const rightPlayers = inactivePlayers.slice(Math.ceil(inactivePlayers.length / 2));

            leftPlayers.forEach((p, i) => {
                const char = CHARACTERS[p.charIndex];
                const sx = 15;
                const sy = 90 + i * 60;
                SpriteRenderer.drawCharacter(this.ctx, char, sx, sy, smallScale, 0, false);
                this.ctx.font = '10px monospace';
                this.ctx.textAlign = 'left';
                this.ctx.fillStyle = '#888888';
                this.ctx.fillText(char.name, sx + 35, sy + 20);
            });

            rightPlayers.forEach((p, i) => {
                const char = CHARACTERS[p.charIndex];
                const sx = this.width - 50;
                const sy = 90 + i * 60;
                SpriteRenderer.drawCharacter(this.ctx, char, sx, sy, smallScale, 0, false);
                this.ctx.font = '10px monospace';
                this.ctx.textAlign = 'right';
                this.ctx.fillStyle = '#888888';
                this.ctx.fillText(char.name, sx - 5, sy + 20);
            });
        }

        // Speaker icon (word is heard, not shown)
        if (wordAnnounced) {
            this._drawSpeakerIcon(this.width / 2, 280);
            this.ctx.font = '14px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = '#888888';
            this.ctx.fillText(this.isTouch ? 'Tap "Hear Word" below' : 'Press R to hear the word again', this.width / 2, 310);
        }

        // Recording state
        if (isRecording) {
            // Pulsing red mic indicator
            const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
            this.ctx.beginPath();
            this.ctx.arc(this.width / 2, 350, 14, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(231, 76, 60, ${pulse})`;
            this.ctx.fill();
            this.ctx.font = 'bold 20px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.fillText('LISTENING...', this.width / 2, 385);

            // Show transcription
            if (transcript) {
                this.ctx.font = 'bold 28px monospace';
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillText(transcript.toUpperCase(), this.width / 2, 430);
            }
        } else if (wordAnnounced) {
            this.ctx.font = 'bold 20px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = '#e94560';
            this.ctx.fillText(this.isTouch ? 'Hold the green button to spell' : 'Hold SPACE to spell', this.width / 2, 370);
        }

        // Bottom info bar
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#666666';
        this.ctx.fillText(`Round ${gameState.round}  |  First to ${targetScore} wins`, this.width / 2, 580);
    },

    // ---- RESULT SCREEN ----
    drawResultScreen(correct, word, playerName, transcript, particles) {
        this.clear();

        if (correct) {
            // Green celebration
            this.ctx.fillStyle = 'rgba(39, 174, 96, 0.15)';
            this.ctx.fillRect(0, 0, this.width, this.height);

            this.ctx.font = 'bold 72px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = '#27ae60';
            this.ctx.fillText('✓', this.width / 2, 180);

            this.ctx.font = 'bold 36px monospace';
            this.ctx.fillStyle = '#27ae60';
            this.ctx.fillText('CORRECT!', this.width / 2, 240);

            // Draw particles
            if (particles) {
                particles.forEach(p => {
                    this.ctx.fillStyle = p.color;
                    this.ctx.fillRect(p.x, p.y, p.size, p.size);
                });
            }
        } else {
            // Red feedback (gentle)
            this.ctx.fillStyle = 'rgba(231, 76, 60, 0.1)';
            this.ctx.fillRect(0, 0, this.width, this.height);

            this.ctx.font = 'bold 72px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.fillText('✗', this.width / 2, 180);

            this.ctx.font = 'bold 36px monospace';
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.fillText('NOT QUITE!', this.width / 2, 240);
        }

        // Reveal the word
        this.ctx.font = '20px monospace';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText('The word was:', this.width / 2, 310);

        this.ctx.font = 'bold 48px monospace';
        this.ctx.fillStyle = '#ffd700';
        this.ctx.fillText(word.toUpperCase(), this.width / 2, 370);

        // Show what they said
        if (transcript) {
            this.ctx.font = '16px monospace';
            this.ctx.fillStyle = '#aaaaaa';
            this.ctx.fillText(`${playerName} spelled: ${transcript.toUpperCase()}`, this.width / 2, 420);
        }

        this.ctx.font = '16px monospace';
        this.ctx.fillStyle = '#888888';
        this.ctx.fillText('Next turn in a moment...', this.width / 2, 480);
    },

    // ---- GAME OVER SCREEN ----
    drawGameOver(winner, players, scores, particles) {
        this.clear();

        // Confetti particles
        if (particles) {
            particles.forEach(p => {
                this.ctx.fillStyle = p.color;
                this.ctx.fillRect(p.x, p.y, p.size, p.size);
            });
        }

        this.ctx.font = 'bold 48px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ffd700';
        this.ctx.fillText('WINNER!', this.width / 2, 80);

        // Winner sprite (large)
        const winnerChar = CHARACTERS[winner.charIndex];
        const winScale = 7;
        SpriteRenderer.drawCharacter(this.ctx, winnerChar, this.width / 2 - 8 * winScale, 90, winScale, 0, true);

        this.ctx.font = 'bold 32px monospace';
        this.ctx.fillStyle = '#ffd700';
        this.ctx.fillText(winnerChar.name, this.width / 2, 260);

        // All scores
        this.ctx.font = '20px monospace';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText('FINAL SCORES', this.width / 2, 300);

        players.forEach((player, i) => {
            const char = CHARACTERS[player.charIndex];
            const score = scores[i];
            const y = 340 + i * 35;
            this.ctx.font = '18px monospace';
            this.ctx.fillStyle = player === winner ? '#ffd700' : '#aaaaaa';
            this.ctx.fillText(`${char.name}: ${score} points`, this.width / 2, y);
        });

        this.ctx.font = '18px monospace';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(this.isTouch ? 'Use buttons below' : 'Press ENTER to play again', this.width / 2, 520);

        if (!this.isTouch) {
            this.ctx.font = '14px monospace';
            this.ctx.fillStyle = '#888888';
            this.ctx.fillText('Press ESC for title screen', this.width / 2, 550);
        }
    },

    // ---- HELPERS ----

    _drawStars() {
        // Deterministic stars based on position
        const seed = 42;
        for (let i = 0; i < 60; i++) {
            const x = ((i * 137 + seed) % this.width);
            const y = ((i * 211 + seed) % this.height);
            const brightness = 100 + (i * 37 % 155);
            const twinkle = Math.sin(Date.now() / 1000 + i) * 30 + brightness;
            this.ctx.fillStyle = `rgb(${twinkle}, ${twinkle}, ${twinkle + 30})`;
            this.ctx.fillRect(x, y, 2, 2);
        }
    },

    _drawBee(x, y) {
        const ctx = this.ctx;
        const s = 3;
        // Body (yellow/black stripes)
        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = i % 2 === 0 ? '#ffd700' : '#1a1a1a';
            ctx.fillRect(x + i * s * 2, y, s * 2, s * 4);
        }
        // Wings
        ctx.fillStyle = 'rgba(200, 200, 255, 0.6)';
        ctx.fillRect(x + 2 * s, y - s * 2, s * 3, s * 2);
        ctx.fillRect(x + 6 * s, y - s * 2, s * 3, s * 2);
        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y + s, s, s);
    },

    _drawSpeakerIcon(cx, cy) {
        const ctx = this.ctx;
        const pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;

        // Speaker body
        ctx.fillStyle = `rgba(255, 215, 0, ${pulse})`;
        ctx.fillRect(cx - 15, cy - 10, 10, 20);
        // Speaker cone
        ctx.beginPath();
        ctx.moveTo(cx - 5, cy - 10);
        ctx.lineTo(cx + 10, cy - 20);
        ctx.lineTo(cx + 10, cy + 20);
        ctx.lineTo(cx - 5, cy + 10);
        ctx.closePath();
        ctx.fill();

        // Sound waves
        ctx.strokeStyle = `rgba(255, 215, 0, ${pulse * 0.6})`;
        ctx.lineWidth = 2;
        for (let i = 1; i <= 3; i++) {
            ctx.beginPath();
            ctx.arc(cx + 10, cy, 10 + i * 8, -Math.PI / 4, Math.PI / 4);
            ctx.stroke();
        }
    },

    _drawProgressTrack(players, scores, targetScore) {
        const ctx = this.ctx;
        const trackY = 20;
        const trackH = 30;
        const trackX = 50;
        const trackW = this.width - 100;

        // Track background
        ctx.fillStyle = '#2d2d4e';
        ctx.fillRect(trackX, trackY, trackW, trackH);

        // Grid lines
        ctx.strokeStyle = '#3d3d5e';
        ctx.lineWidth = 1;
        for (let i = 0; i <= targetScore; i++) {
            const gx = trackX + (i / targetScore) * trackW;
            ctx.beginPath();
            ctx.moveTo(gx, trackY);
            ctx.lineTo(gx, trackY + trackH);
            ctx.stroke();
        }

        // Finish line
        const finishX = trackX + trackW;
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(finishX, trackY);
        ctx.lineTo(finishX, trackY + trackH);
        ctx.stroke();

        // Player markers
        players.forEach((player, i) => {
            const char = CHARACTERS[player.charIndex];
            const score = scores[i] || 0;
            const markerX = trackX + (score / targetScore) * trackW;
            const markerY = trackY + 5 + i * 6;

            ctx.fillStyle = char.shirtColor;
            ctx.fillRect(markerX - 4, markerY, 8, 5);

            // Small name label
            ctx.font = '9px monospace';
            ctx.textAlign = 'left';
            ctx.fillStyle = char.shirtColor;
            ctx.fillText(char.name, markerX + 6, markerY + 5);
        });

        // Labels
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#888888';
        ctx.fillText('START', trackX, trackY + trackH + 14);
        ctx.fillStyle = '#ffd700';
        ctx.fillText('FINISH', trackX + trackW, trackY + trackH + 14);
    }
};
