// Object Finder App - Multi-Mode Object Locator v2.1

class ObjectFinder {
    constructor() {
        // Configuration
        this.config = {
            detectionMode: 'rotation', // rotation, linear-horizontal, linear-vertical
            targetAngle: 90,
            targetSegment: 4, // Target segment for linear modes (1-15)
            tolerance: 10,
            sensitivity: 'medium'
        };

        // State
        this.isActive = false;
        this.currentAngle = 0;
        this.currentSegment = 0; // Current segment for linear modes
        this.initialOrientation = null;
        this.signalStrength = 0;
        this.isBeeping = false;

        // Audio Context for beeping
        this.audioContext = null;
        this.beepInterval = null;

        // Linear detection using acceleration magnitude
        this.lastAccelMagnitude = 0;
        this.movementThreshold = 2.0; // m/s² threshold for detecting movement
        this.segmentCooldown = false;
        this.lastSegmentTime = 0;

        // Constants
        this.POKER_CARD_WIDTH = 6.4; // cm
        this.COOLDOWN_MS = 300; // Milliseconds between segment detections

        // DOM Elements
        this.elements = {
            powerButton: document.getElementById('powerButton'),
            statusText: document.getElementById('statusText'),
            signalStrength: document.getElementById('signalStrength'),
            angleDisplay: document.getElementById('angleDisplay'),
            bars: document.querySelectorAll('.bar'),
            radar: document.querySelector('.radar'),
            appTitle: document.getElementById('appTitle'),
            settingsMenu: document.getElementById('settingsMenu'),
            closeSettings: document.getElementById('closeSettings'),
            saveSettings: document.getElementById('saveSettings'),
            detectionMode: document.getElementById('detectionMode'),
            targetAngle: document.getElementById('targetAngle'),
            targetAngleSlider: document.getElementById('targetAngleSlider'),
            angleValue: document.getElementById('angleValue'),
            targetPosition: document.getElementById('targetPosition'),
            targetPositionSlider: document.getElementById('targetPositionSlider'),
            positionValue: document.getElementById('positionValue'),
            tolerance: document.getElementById('tolerance'),
            toleranceSlider: document.getElementById('toleranceSlider'),
            toleranceValue: document.getElementById('toleranceValue'),
            sensitivity: document.getElementById('sensitivity'),
            permissionOverlay: document.getElementById('permissionOverlay'),
            requestPermission: document.getElementById('requestPermission'),
            splashScreen: document.getElementById('splashScreen')
        };

        // Load saved configuration
        this.loadConfig();

        // Initialize
        this.init();
    }

    init() {
        // Setup fullscreen mode (Cordova)
        document.addEventListener('deviceready', () => {
            // Hide status bar completely
            if (typeof StatusBar !== 'undefined') {
                StatusBar.hide();
            }

            // Enable immersive fullscreen mode
            if (typeof AndroidFullScreen !== 'undefined') {
                AndroidFullScreen.immersiveMode(
                    () => console.log('Immersive mode enabled'),
                    (err) => console.log('Immersive mode error:', err)
                );
            }
        }, false);

        // Hide splash screen after delay
        setTimeout(() => {
            if (this.elements.splashScreen) {
                this.elements.splashScreen.remove();
            }
        }, 2800);

        // Event listeners
        this.elements.powerButton.addEventListener('click', () => this.togglePower());
        this.elements.appTitle.addEventListener('click', () => this.openSettings());
        this.elements.closeSettings.addEventListener('click', () => this.closeSettings());
        this.elements.saveSettings.addEventListener('click', () => this.saveSettings());

        // Detection mode change
        this.elements.detectionMode.addEventListener('change', (e) => {
            this.updateModeVisibility(e.target.value);
        });

        // Settings synchronization - Angle
        this.elements.targetAngle.addEventListener('input', (e) => {
            this.elements.targetAngleSlider.value = e.target.value;
            this.elements.angleValue.textContent = e.target.value + '°';
        });

        this.elements.targetAngleSlider.addEventListener('input', (e) => {
            this.elements.targetAngle.value = e.target.value;
            this.elements.angleValue.textContent = e.target.value + '°';
        });

        // Settings synchronization - Position (segment)
        this.elements.targetPosition.addEventListener('input', (e) => {
            this.elements.targetPositionSlider.value = e.target.value;
            const segment = Math.round(e.target.value / this.POKER_CARD_WIDTH);
            this.elements.positionValue.textContent = `Carta ${segment} (${e.target.value} cm)`;
        });

        this.elements.targetPositionSlider.addEventListener('input', (e) => {
            this.elements.targetPosition.value = e.target.value;
            const segment = Math.round(e.target.value / this.POKER_CARD_WIDTH);
            this.elements.positionValue.textContent = `Carta ${segment} (${e.target.value} cm)`;
        });

        // Settings synchronization - Tolerance
        this.elements.tolerance.addEventListener('input', (e) => {
            this.elements.toleranceSlider.value = e.target.value;
            this.elements.toleranceValue.textContent = '±' + e.target.value + '°';
        });

        this.elements.toleranceSlider.addEventListener('input', (e) => {
            this.elements.tolerance.value = e.target.value;
            this.elements.toleranceValue.textContent = '±' + e.target.value + '°';
        });

        // Check if sensors are supported
        if (!window.DeviceOrientationEvent && !window.DeviceMotionEvent) {
            alert('Tu dispositivo no soporta los sensores necesarios.');
        }
    }

    updateModeVisibility(mode) {
        const rotationMode = document.querySelectorAll('.rotation-mode');
        const linearMode = document.querySelectorAll('.linear-mode');

        if (mode === 'rotation') {
            rotationMode.forEach(el => el.classList.remove('hidden'));
            linearMode.forEach(el => el.classList.add('hidden'));
        } else {
            rotationMode.forEach(el => el.classList.add('hidden'));
            linearMode.forEach(el => el.classList.remove('hidden'));
        }
    }

    async togglePower() {
        if (!this.isActive) {
            // Request permission if needed (iOS 13+)
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                try {
                    const permission = await DeviceOrientationEvent.requestPermission();
                    if (permission !== 'granted') {
                        alert('Permiso denegado para acceder a los sensores.');
                        return;
                    }
                } catch (error) {
                    console.error('Error requesting permission:', error);
                    this.elements.permissionOverlay.classList.remove('hidden');
                    return;
                }
            }

            // Request motion permission if in linear mode
            if (this.config.detectionMode !== 'rotation') {
                if (typeof DeviceMotionEvent.requestPermission === 'function') {
                    try {
                        const permission = await DeviceMotionEvent.requestPermission();
                        if (permission !== 'granted') {
                            alert('Permiso denegado para acceder al acelerómetro.');
                            return;
                        }
                    } catch (error) {
                        console.error('Error requesting motion permission:', error);
                    }
                }
            }

            this.startFinder();
        } else {
            this.stopFinder();
        }
    }

    startFinder() {
        this.isActive = true;
        this.initialOrientation = null;
        this.currentSegment = 0;
        this.lastAccelMagnitude = 0;
        this.segmentCooldown = false;
        this.lastSegmentTime = 0;

        // Initialize audio context
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Update UI
        this.elements.powerButton.classList.add('active');
        this.elements.powerButton.querySelector('.power-text').textContent = 'APAGAR';
        this.elements.statusText.textContent = 'BUSCANDO...';
        this.elements.statusText.classList.add('active');
        this.elements.radar.classList.add('active');

        // Start appropriate sensor based on mode
        if (this.config.detectionMode === 'rotation') {
            window.addEventListener('deviceorientation', this.handleOrientation.bind(this));
        } else {
            window.addEventListener('devicemotion', this.handleMotion.bind(this));
        }

        console.log('Finder started - Mode:', this.config.detectionMode);
    }

    stopFinder() {
        this.isActive = false;

        // Stop listening to sensors
        window.removeEventListener('deviceorientation', this.handleOrientation.bind(this));
        window.removeEventListener('devicemotion', this.handleMotion.bind(this));

        // Stop beeping
        this.stopBeeping();

        // Update UI
        this.elements.powerButton.classList.remove('active');
        this.elements.powerButton.querySelector('.power-text').textContent = 'ENCENDER';
        this.elements.statusText.textContent = 'APAGADO';
        this.elements.statusText.classList.remove('active');
        this.elements.radar.classList.remove('active');

        // Reset signal
        this.updateSignal(0);
        this.elements.angleDisplay.textContent = '0°';
    }

    handleOrientation(event) {
        if (!this.isActive || this.config.detectionMode !== 'rotation') return;

        // Get alpha (compass heading) - ranges from 0 to 360
        let alpha = event.alpha || 0;

        // Store initial orientation on first read
        if (this.initialOrientation === null) {
            this.initialOrientation = { alpha };
            console.log('Initial orientation:', this.initialOrientation);
        }

        // Calculate relative rotation from initial position
        let relativeAngle = this.normalizeAngle(alpha - this.initialOrientation.alpha);

        this.currentAngle = relativeAngle;
        this.elements.angleDisplay.textContent = Math.round(relativeAngle) + '°';

        // Calculate signal strength based on proximity to target angle
        const signalStrength = this.calculateSignalStrength(relativeAngle);
        this.updateSignal(signalStrength);

        // Check if we're at target angle
        if (this.isAtTarget(relativeAngle)) {
            if (!this.isBeeping) {
                this.startBeeping();
                this.elements.statusText.textContent = '¡ENCONTRADO!';
            }
        } else {
            if (this.isBeeping) {
                this.stopBeeping();
                this.elements.statusText.textContent = 'BUSCANDO...';
            }
        }
    }

    handleMotion(event) {
        if (!this.isActive || this.config.detectionMode === 'rotation') return;

        const accel = event.accelerationIncludingGravity;
        if (!accel) return;

        // Calculate acceleration magnitude
        const ax = accel.x || 0;
        const ay = accel.y || 0;
        const az = accel.z || 0;

        // Choose axis based on mode
        let relevantAccel;
        if (this.config.detectionMode === 'linear-horizontal') {
            relevantAccel = Math.abs(ax);
        } else { // linear-vertical
            relevantAccel = Math.abs(ay);
        }

        const now = Date.now();

        // Detect sharp movement to count segments
        if (relevantAccel > this.movementThreshold && !this.segmentCooldown) {
            // Increment segment counter
            this.currentSegment++;
            this.segmentCooldown = true;
            this.lastSegmentTime = now;

            // Vibrate for feedback
            if (navigator.vibrate) {
                navigator.vibrate(30);
            }

            console.log('Segment detected:', this.currentSegment);
        }

        // Reset cooldown
        if (this.segmentCooldown && (now - this.lastSegmentTime) > this.COOLDOWN_MS) {
            this.segmentCooldown = false;
        }

        // Update display
        const positionCm = this.currentSegment * this.POKER_CARD_WIDTH;
        this.elements.angleDisplay.textContent = `Carta ${this.currentSegment} (${positionCm.toFixed(1)} cm)`;

        // Calculate signal strength based on proximity to target segment
        const targetSegment = Math.round(parseFloat(this.elements.targetPosition.value) / this.POKER_CARD_WIDTH);
        const signalStrength = this.calculateSegmentSignalStrength(this.currentSegment, targetSegment);
        this.updateSignal(signalStrength);

        // Check if we're at target segment
        if (this.isAtTargetSegment(this.currentSegment, targetSegment)) {
            if (!this.isBeeping) {
                this.startBeeping();
                this.elements.statusText.textContent = '¡ENCONTRADO!';
            }
        } else {
            if (this.isBeeping) {
                this.stopBeeping();
                this.elements.statusText.textContent = 'BUSCANDO...';
            }
        }

        this.lastAccelMagnitude = relevantAccel;
    }

    normalizeAngle(angle) {
        // Normalize angle to 0-360 range
        while (angle < 0) angle += 360;
        while (angle >= 360) angle -= 360;
        return angle;
    }

    calculateSignalStrength(currentAngle) {
        const target = this.config.targetAngle;

        // Calculate shortest angular distance
        let diff = Math.abs(currentAngle - target);
        if (diff > 180) {
            diff = 360 - diff;
        }

        // Map difference to signal strength (0-100)
        const maxRange = 180;
        let strength = 100 - (diff / maxRange * 100);

        // Apply sensitivity multiplier
        const sensitivityFactors = {
            low: 0.7,
            medium: 1.0,
            high: 1.3
        };

        strength *= sensitivityFactors[this.config.sensitivity];

        // Clamp to 0-100
        strength = Math.max(0, Math.min(100, strength));

        return strength;
    }

    calculateSegmentSignalStrength(currentSegment, targetSegment) {
        // Calculate distance from target segment
        const diff = Math.abs(currentSegment - targetSegment);

        // Map difference to signal strength (0-100)
        // Assuming max range of 15 segments (about 1 meter)
        const maxRange = 15;
        let strength = 100 - (diff / maxRange * 100);

        // Apply sensitivity multiplier
        const sensitivityFactors = {
            low: 0.7,
            medium: 1.0,
            high: 1.3
        };

        strength *= sensitivityFactors[this.config.sensitivity];

        // Clamp to 0-100
        strength = Math.max(0, Math.min(100, strength));

        return strength;
    }

    isAtTarget(currentAngle) {
        const target = this.config.targetAngle;
        const tolerance = this.config.tolerance;

        // Calculate shortest angular distance
        let diff = Math.abs(currentAngle - target);
        if (diff > 180) {
            diff = 360 - diff;
        }

        return diff <= tolerance;
    }

    isAtTargetSegment(currentSegment, targetSegment) {
        // Tolerance for segments (±1 segment)
        const tolerance = 1;
        const diff = Math.abs(currentSegment - targetSegment);
        return diff <= tolerance;
    }

    updateSignal(strength) {
        this.signalStrength = strength;
        this.elements.signalStrength.textContent = Math.round(strength);

        // Update signal bars
        const barCount = 5;
        const activeBarCount = Math.ceil((strength / 100) * barCount);

        this.elements.bars.forEach((bar, index) => {
            if (index < activeBarCount) {
                bar.classList.add('active');
            } else {
                bar.classList.remove('active');
            }
        });
    }

    startBeeping() {
        if (this.isBeeping || !this.audioContext) return;

        this.isBeeping = true;

        // Calculate beep frequency based on signal strength
        const baseInterval = 1000;
        const minInterval = 100;
        const beepSpeed = baseInterval - ((this.signalStrength / 100) * (baseInterval - minInterval));

        this.beep();

        this.beepInterval = setInterval(() => {
            this.beep();
        }, beepSpeed);
    }

    stopBeeping() {
        this.isBeeping = false;

        if (this.beepInterval) {
            clearInterval(this.beepInterval);
            this.beepInterval = null;
        }
    }

    beep() {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Beep parameters
        const frequency = 800 + (this.signalStrength * 10);
        const duration = 0.1;

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    openSettings() {
        this.elements.settingsMenu.classList.remove('hidden');

        // Load current config into form
        this.elements.detectionMode.value = this.config.detectionMode;
        this.updateModeVisibility(this.config.detectionMode);

        this.elements.targetAngle.value = this.config.targetAngle;
        this.elements.targetAngleSlider.value = this.config.targetAngle;
        this.elements.angleValue.textContent = this.config.targetAngle + '°';

        // Calculate target position from segment
        const targetPos = this.config.targetSegment * this.POKER_CARD_WIDTH;
        this.elements.targetPosition.value = targetPos;
        this.elements.targetPositionSlider.value = targetPos;
        this.elements.positionValue.textContent = `Carta ${this.config.targetSegment} (${targetPos} cm)`;

        this.elements.tolerance.value = this.config.tolerance;
        this.elements.toleranceSlider.value = this.config.tolerance;
        this.elements.toleranceValue.textContent = '±' + this.config.tolerance + '°';

        this.elements.sensitivity.value = this.config.sensitivity;
    }

    closeSettings() {
        this.elements.settingsMenu.classList.add('hidden');
    }

    saveSettings() {
        this.config.detectionMode = this.elements.detectionMode.value;
        this.config.targetAngle = parseInt(this.elements.targetAngle.value);

        // Calculate target segment from position
        const targetPos = parseFloat(this.elements.targetPosition.value);
        this.config.targetSegment = Math.round(targetPos / this.POKER_CARD_WIDTH);

        this.config.tolerance = parseInt(this.elements.tolerance.value);
        this.config.sensitivity = this.elements.sensitivity.value;

        // Save to localStorage
        localStorage.setItem('finderConfig', JSON.stringify(this.config));

        this.closeSettings();

        console.log('Settings saved:', this.config);
    }

    loadConfig() {
        const saved = localStorage.getItem('finderConfig');
        if (saved) {
            try {
                this.config = JSON.parse(saved);
                console.log('Config loaded:', this.config);
            } catch (e) {
                console.error('Error loading config:', e);
            }
        }
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ObjectFinder();
    });
} else {
    new ObjectFinder();
}

// iOS 13+ permission handler
document.getElementById('requestPermission').addEventListener('click', async () => {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
            const permission = await DeviceOrientationEvent.requestPermission();
            if (permission === 'granted') {
                document.getElementById('permissionOverlay').classList.add('hidden');
            } else {
                alert('Permiso denegado. No se puede usar el sensor de orientación.');
            }
        } catch (error) {
            console.error('Error requesting permission:', error);
            alert('Error al solicitar permiso: ' + error.message);
        }
    }
});
