// Pixel art character sprites drawn on canvas
// Each character is a ~16x24 pixel grid, scaled up

const CHARACTERS = [
    {
        name: 'Ada',
        skinColor: '#c68642',
        hairColor: '#4a2800',
        shirtColor: '#9b59b6',
        pantsColor: '#6c3483',
        hairStyle: 'long',
        spriteImage: null // Set to an Image object to use PNG instead
    },
    {
        name: 'Arlo',
        skinColor: '#c68642',
        hairColor: '#1a1a1a',
        shirtColor: '#3498db',
        pantsColor: '#2471a3',
        hairStyle: 'short',
        spriteImage: null
    },
    {
        name: 'Evie',
        skinColor: '#c68642',
        hairColor: '#8b4513',
        shirtColor: '#e74c8b',
        pantsColor: '#c0392b',
        hairStyle: 'pigtails',
        spriteImage: null
    },
    {
        name: 'Kai',
        skinColor: '#c68642',
        hairColor: '#3d2b1f',
        shirtColor: '#27ae60',
        pantsColor: '#1e8449',
        hairStyle: 'curly',
        spriteImage: null
    }
];

const SpriteRenderer = {
    // Draw a single "pixel" (scaled up block)
    _pixel(ctx, x, y, size, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, size, size);
    },

    // Draw a character at position (x, y) with given scale
    // animFrame: 0=idle, 1=step
    drawCharacter(ctx, charConfig, x, y, scale = 3, animFrame = 0, highlighted = false) {
        // If PNG sprite is set, use that instead
        if (charConfig.spriteImage && charConfig.spriteImage.complete) {
            const imgW = 16 * scale;
            const imgH = 24 * scale;
            ctx.drawImage(charConfig.spriteImage, x, y, imgW, imgH);
            if (highlighted) {
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 2;
                ctx.strokeRect(x - 2, y - 2, imgW + 4, imgH + 4);
            }
            return;
        }

        const s = scale;
        const skin = charConfig.skinColor;
        const hair = charConfig.hairColor;
        const shirt = charConfig.shirtColor;
        const pants = charConfig.pantsColor;
        const eyeColor = '#ffffff';
        const pupilColor = '#1a1a1a';
        const shoeColor = '#2c2c2c';

        // Bounce for idle animation
        const bounceY = animFrame === 0 ? Math.sin(Date.now() / 300) * 1.5 : 0;
        const stepOffset = animFrame === 1 ? -2 : 0;

        const px = x;
        const py = y + bounceY + stepOffset;

        // Glow if highlighted
        if (highlighted) {
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 15;
        }

        // Hair (top of head) - varies by style
        if (charConfig.hairStyle === 'long') {
            // Long hair - wider at sides
            for (let i = 2; i <= 13; i++) this._pixel(ctx, px + i * s, py + 0 * s, s, hair);
            for (let i = 1; i <= 14; i++) this._pixel(ctx, px + i * s, py + 1 * s, s, hair);
            for (let i = 1; i <= 14; i++) this._pixel(ctx, px + i * s, py + 2 * s, s, hair);
            // Hair sides going down
            this._pixel(ctx, px + 1 * s, py + 3 * s, s, hair);
            this._pixel(ctx, px + 2 * s, py + 3 * s, s, hair);
            this._pixel(ctx, px + 13 * s, py + 3 * s, s, hair);
            this._pixel(ctx, px + 14 * s, py + 3 * s, s, hair);
            this._pixel(ctx, px + 1 * s, py + 4 * s, s, hair);
            this._pixel(ctx, px + 14 * s, py + 4 * s, s, hair);
            this._pixel(ctx, px + 1 * s, py + 5 * s, s, hair);
            this._pixel(ctx, px + 14 * s, py + 5 * s, s, hair);
            this._pixel(ctx, px + 1 * s, py + 6 * s, s, hair);
            this._pixel(ctx, px + 14 * s, py + 6 * s, s, hair);
            this._pixel(ctx, px + 1 * s, py + 7 * s, s, hair);
            this._pixel(ctx, px + 14 * s, py + 7 * s, s, hair);
        } else if (charConfig.hairStyle === 'short') {
            // Short cropped hair
            for (let i = 3; i <= 12; i++) this._pixel(ctx, px + i * s, py + 0 * s, s, hair);
            for (let i = 2; i <= 13; i++) this._pixel(ctx, px + i * s, py + 1 * s, s, hair);
            for (let i = 2; i <= 13; i++) this._pixel(ctx, px + i * s, py + 2 * s, s, hair);
        } else if (charConfig.hairStyle === 'pigtails') {
            // Pigtails
            for (let i = 3; i <= 12; i++) this._pixel(ctx, px + i * s, py + 0 * s, s, hair);
            for (let i = 2; i <= 13; i++) this._pixel(ctx, px + i * s, py + 1 * s, s, hair);
            for (let i = 2; i <= 13; i++) this._pixel(ctx, px + i * s, py + 2 * s, s, hair);
            // Left pigtail
            this._pixel(ctx, px + 0 * s, py + 2 * s, s, hair);
            this._pixel(ctx, px + 1 * s, py + 2 * s, s, hair);
            this._pixel(ctx, px + 0 * s, py + 3 * s, s, hair);
            this._pixel(ctx, px + 0 * s, py + 4 * s, s, hair);
            this._pixel(ctx, px + 0 * s, py + 5 * s, s, hair);
            // Right pigtail
            this._pixel(ctx, px + 14 * s, py + 2 * s, s, hair);
            this._pixel(ctx, px + 15 * s, py + 2 * s, s, hair);
            this._pixel(ctx, px + 15 * s, py + 3 * s, s, hair);
            this._pixel(ctx, px + 15 * s, py + 4 * s, s, hair);
            this._pixel(ctx, px + 15 * s, py + 5 * s, s, hair);
        } else if (charConfig.hairStyle === 'curly') {
            // Curly/afro hair - bigger and rounder
            for (let i = 2; i <= 13; i++) this._pixel(ctx, px + i * s, py + (-1) * s, s, hair);
            for (let i = 1; i <= 14; i++) this._pixel(ctx, px + i * s, py + 0 * s, s, hair);
            for (let i = 1; i <= 14; i++) this._pixel(ctx, px + i * s, py + 1 * s, s, hair);
            for (let i = 1; i <= 14; i++) this._pixel(ctx, px + i * s, py + 2 * s, s, hair);
            this._pixel(ctx, px + 1 * s, py + 3 * s, s, hair);
            this._pixel(ctx, px + 14 * s, py + 3 * s, s, hair);
        }

        // Face (skin)
        for (let row = 3; row <= 7; row++) {
            for (let col = 3; col <= 12; col++) {
                this._pixel(ctx, px + col * s, py + row * s, s, skin);
            }
        }

        // Eyes
        this._pixel(ctx, px + 5 * s, py + 4 * s, s, eyeColor);
        this._pixel(ctx, px + 6 * s, py + 4 * s, s, eyeColor);
        this._pixel(ctx, px + 9 * s, py + 4 * s, s, eyeColor);
        this._pixel(ctx, px + 10 * s, py + 4 * s, s, eyeColor);
        // Pupils
        this._pixel(ctx, px + 6 * s, py + 4 * s, s, pupilColor);
        this._pixel(ctx, px + 10 * s, py + 4 * s, s, pupilColor);

        // Mouth (smile)
        this._pixel(ctx, px + 6 * s, py + 6 * s, s, '#c0392b');
        this._pixel(ctx, px + 7 * s, py + 6 * s, s, '#c0392b');
        this._pixel(ctx, px + 8 * s, py + 6 * s, s, '#c0392b');
        this._pixel(ctx, px + 9 * s, py + 6 * s, s, '#c0392b');

        // Neck
        this._pixel(ctx, px + 7 * s, py + 8 * s, s, skin);
        this._pixel(ctx, px + 8 * s, py + 8 * s, s, skin);

        // Shirt/Body
        for (let row = 9; row <= 14; row++) {
            for (let col = 4; col <= 11; col++) {
                this._pixel(ctx, px + col * s, py + row * s, s, shirt);
            }
        }
        // Arms
        for (let row = 9; row <= 13; row++) {
            this._pixel(ctx, px + 3 * s, py + row * s, s, shirt);
            this._pixel(ctx, px + 12 * s, py + row * s, s, shirt);
        }
        // Hands
        this._pixel(ctx, px + 3 * s, py + 14 * s, s, skin);
        this._pixel(ctx, px + 12 * s, py + 14 * s, s, skin);

        // Pants
        for (let row = 15; row <= 19; row++) {
            for (let col = 4; col <= 7; col++) {
                this._pixel(ctx, px + col * s, py + row * s, s, pants);
            }
            for (let col = 8; col <= 11; col++) {
                this._pixel(ctx, px + col * s, py + row * s, s, pants);
            }
        }

        // Shoes
        for (let col = 3; col <= 7; col++) {
            this._pixel(ctx, px + col * s, py + 20 * s, s, shoeColor);
        }
        for (let col = 8; col <= 12; col++) {
            this._pixel(ctx, px + col * s, py + 20 * s, s, shoeColor);
        }

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
    },

    // Draw character name label below sprite
    drawLabel(ctx, name, x, y, scale = 3, highlighted = false) {
        const centerX = x + 8 * scale;
        const labelY = y + 23 * scale;
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = highlighted ? '#ffd700' : '#ffffff';
        ctx.fillText(name, centerX, labelY);
    },

    // Get character width/height for layout
    getSize(scale = 3) {
        return { width: 16 * scale, height: 21 * scale };
    }
};
