// Avatar Generator - Creates 3D-style portraits based on voice features
class AvatarGenerator {
    constructor(canvas) {
        this.HAIR_STRAND_RANDOM_OFFSET = 10;
        this.HAIR_STRAND_RANDOM_CENTER = 5;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
    }

    generate(voiceFeatures) {
        const { pitch, volume, toneVariation } = voiceFeatures;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Map voice features to avatar characteristics
        const avatarProps = this.mapFeaturesToAvatar(pitch, volume, toneVariation);

        // Draw the avatar
        this.drawBackground(avatarProps);
        this.drawHead(avatarProps);
        this.drawEyes(avatarProps);
        this.drawNose(avatarProps);
        this.drawMouth(avatarProps);
        this.drawHair(avatarProps);
        this.addShading(avatarProps);
    }

    mapFeaturesToAvatar(pitch, volume, toneVariation) {
        // Pitch affects face shape and features
        // Low pitch (0-40) -> more angular, mature features
        // Medium pitch (40-60) -> balanced features
        // High pitch (60-100) -> softer, rounder features

        // Volume affects expression intensity
        // Low volume -> calm, subtle expression
        // High volume -> bold, expressive features

        // Tone variation affects personality traits
        // Low variation -> simple, consistent features
        // High variation -> complex, varied features

        const faceRoundness = this.lerp(0.7, 1.2, pitch / 100);
        const eyeSize = this.lerp(15, 25, volume / 100);
        const mouthWidth = this.lerp(40, 70, volume / 100);
        const hairComplexity = Math.floor(this.lerp(5, 15, toneVariation / 100));
        
        // Color palette based on pitch
        let skinHue = this.lerp(20, 40, pitch / 100);
        let hairHue = this.lerp(10, 60, (100 - pitch) / 100);
        
        // Adjust saturation based on volume
        const saturation = this.lerp(30, 70, volume / 100);
        
        return {
            faceRoundness,
            eyeSize,
            mouthWidth,
            hairComplexity,
            skinColor: `hsl(${skinHue}, ${saturation}%, 70%)`,
            hairColor: `hsl(${hairHue}, ${saturation}%, 30%)`,
            eyeColor: `hsl(${this.lerp(200, 30, toneVariation / 100)}, 60%, 50%)`,
            expressiveness: volume / 100,
            complexity: toneVariation / 100
        };
    }

    drawBackground(props) {
        // Gradient background
        const gradient = this.ctx.createRadialGradient(
            this.width / 2, this.height / 2, 0,
            this.width / 2, this.height / 2, this.width / 2
        );
        
        const bgHue = this.lerp(200, 280, props.complexity);
        gradient.addColorStop(0, `hsl(${bgHue}, 50%, 90%)`);
        gradient.addColorStop(1, `hsl(${bgHue}, 40%, 80%)`);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawHead(props) {
        const centerX = this.width / 2;
        const centerY = this.height / 2 + 20;
        const radiusX = 80 * props.faceRoundness;
        const radiusY = 100;

        // Face base
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.scale(1, props.faceRoundness);
        
        // Main face
        this.ctx.fillStyle = props.skinColor;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 100, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Chin definition
        this.ctx.fillStyle = this.adjustBrightness(props.skinColor, -10);
        this.ctx.beginPath();
        this.ctx.ellipse(0, 30, 60, 40, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
        
        // Store center for other features
        this.centerX = centerX;
        this.centerY = centerY;
    }

    drawEyes(props) {
        const eyeY = this.centerY - 20;
        const eyeSpacing = 35;

        // Draw both eyes
        [-1, 1].forEach(side => {
            const eyeX = this.centerX + (eyeSpacing * side);
            
            // Eye white
            this.ctx.fillStyle = 'white';
            this.ctx.beginPath();
            this.ctx.ellipse(eyeX, eyeY, props.eyeSize, props.eyeSize * 0.8, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Iris
            this.ctx.fillStyle = props.eyeColor;
            this.ctx.beginPath();
            this.ctx.arc(eyeX, eyeY, props.eyeSize * 0.6, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Pupil
            this.ctx.fillStyle = '#000';
            this.ctx.beginPath();
            this.ctx.arc(eyeX, eyeY, props.eyeSize * 0.3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Highlight
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.beginPath();
            this.ctx.arc(eyeX - props.eyeSize * 0.15, eyeY - props.eyeSize * 0.15, props.eyeSize * 0.15, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Eyebrow
            this.ctx.strokeStyle = this.adjustBrightness(props.hairColor, 20);
            this.ctx.lineWidth = 3;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            const browY = eyeY - props.eyeSize - 8;
            const browCurve = props.expressiveness * 5;
            this.ctx.moveTo(eyeX - 20, browY + browCurve);
            this.ctx.quadraticCurveTo(eyeX, browY - browCurve, eyeX + 20, browY + browCurve);
            this.ctx.stroke();
        });
    }

    drawNose(props) {
        const noseY = this.centerY + 10;
        const noseWidth = 8 + props.expressiveness * 5;
        
        this.ctx.fillStyle = this.adjustBrightness(props.skinColor, -15);
        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX, noseY - 15);
        this.ctx.lineTo(this.centerX - noseWidth / 2, noseY + 5);
        this.ctx.lineTo(this.centerX + noseWidth / 2, noseY + 5);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Nostrils
        this.ctx.fillStyle = this.adjustBrightness(props.skinColor, -25);
        [-1, 1].forEach(side => {
            this.ctx.beginPath();
            this.ctx.arc(this.centerX + (noseWidth * 0.6 * side), noseY + 5, 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawMouth(props) {
        const mouthY = this.centerY + 50;
        const mouthCurve = props.expressiveness * 20;
        
        // Lips
        this.ctx.strokeStyle = this.adjustBrightness(props.skinColor, -30);
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX - props.mouthWidth / 2, mouthY);
        this.ctx.quadraticCurveTo(this.centerX, mouthY + mouthCurve, this.centerX + props.mouthWidth / 2, mouthY);
        this.ctx.stroke();
        
        // Smile line
        if (props.expressiveness > 0.5) {
            this.ctx.strokeStyle = this.adjustBrightness(props.skinColor, -20);
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(this.centerX - props.mouthWidth / 2, mouthY + 5);
            this.ctx.quadraticCurveTo(this.centerX, mouthY + mouthCurve + 10, this.centerX + props.mouthWidth / 2, mouthY + 5);
            this.ctx.stroke();
        }
    }

    drawHair(props) {
        // Hair style based on complexity and features
        this.ctx.fillStyle = props.hairColor;
        
        // Base hair shape
        this.ctx.beginPath();
        const hairTop = this.centerY - 100 * props.faceRoundness;
        const hairWidth = 100 * props.faceRoundness;
        
        this.ctx.ellipse(this.centerX, hairTop, hairWidth, 60, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Side hair
        [-1, 1].forEach(side => {
            this.ctx.beginPath();
            this.ctx.ellipse(
                this.centerX + (80 * side * props.faceRoundness),
                this.centerY - 30,
                40,
                80,
                0,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        });
        
        // Hair details/strands based on complexity
        this.ctx.strokeStyle = this.adjustBrightness(props.hairColor, -20);
        this.ctx.lineWidth = 2;
        for (let i = 0; i < props.hairComplexity; i++) {
            const angle = (i / props.hairComplexity) * Math.PI - Math.PI / 2;
            const startX = this.centerX + Math.cos(angle) * 70;
            const startY = hairTop + 10;
            const endX = startX + Math.cos(angle) * 30;
            const endY = startY + Math.sin(angle) * 30;
            
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.quadraticCurveTo(
                startX + Math.random() * this.HAIR_STRAND_RANDOM_OFFSET - this.HAIR_STRAND_RANDOM_CENTER,
                (startY + endY) / 2,
                endX,
                endY
            );
            this.ctx.stroke();
        }
    }

    addShading(props) {
        // Add subtle 3D shading to the face
        const gradient = this.ctx.createRadialGradient(
            this.centerX - 30, this.centerY - 20, 20,
            this.centerX, this.centerY, 120
        );
        
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.ellipse(this.centerX, this.centerY, 100 * props.faceRoundness, 100, 0, 0, Math.PI * 2);
        this.ctx.fill();
    }

    // Helper functions
    lerp(start, end, t) {
        return start + (end - start) * t;
    }

    adjustBrightness(hslColor, adjustment) {
        // Parse HSL color
        const match = hslColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (match) {
            const h = match[1];
            const s = match[2];
            const l = Math.max(0, Math.min(100, parseInt(match[3]) + adjustment));
            return `hsl(${h}, ${s}%, ${l}%)`;
        }
        return hslColor;
    }

    downloadImage() {
        const link = document.createElement('a');
        link.download = `vocaface-avatar-${Date.now()}.png`;
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AvatarGenerator;
}
