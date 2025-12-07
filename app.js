// Object Finder App - Multi-Mode Object Locator v2.3

class ObjectFinder {
    constructor() {
        // Configuration
        this.config = {
            detectionMode: 'rotation',
            targetAngles: [90], // Array of target angles
            targetSegment: 4,
            tolerance: 10,
            sensitivity: 'medium'
        };

        // State
        this.isActive = false;
        this.currentAngle = 0;
        this.currentSegment = 0;
        this.initialOrientation = null;
        this.signalStrength = 0;
        this.isBeeping = false;
        this.foundTarget = false;
        this.longPressTimer = null;
        this.shortPressRotation = false;
        this.longPressDelay = 3000; // 3 seconds

        // Audio Context
        this.audioContext = null;
        this.beepInterval = null;

        // Constants
        this.POKER_CARD_WIDTH = 6.4; // cm

        // DOM Elements
        this.elements = {
            powerButton: document.getElementById('powerButton'),
            powerButtonText: document.getElementById('powerButtonText'),
            statusText: document.getElementById('statusText'),
            signalStrength: document.getElementById('signalStrength'),
            wrongMark: document.getElementById('wrongMark'),
            bars: document.querySelectorAll('.bar'),
            radar: document.querySelector('.radar'),
            header: document.querySelector('header'),
            appTitle: document.getElementById('appTitle'),
            settingsMenu: document.getElementById('settingsMenu'),
            closeSettings: document.getElementById('closeSettings'),
            saveSettings: document.getElementById('saveSettings'),
            detectionMode: document.getElementById('detectionMode'),
            numPositions: document.getElementById('numPositions'),
            anglesContainer: document.getElementById('anglesContainer'),
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
            if (typeof StatusBar !== 'undefined') {
                StatusBar.hide();
            }
            if (typeof AndroidFullScreen !== 'undefined') {
                AndroidFullScreen.immersiveMode(
                    () => console.log('Immersive mode enabled'),
                    (err) => console.log('Immersive mode error:', err)
                );
            }
        }, false);

        // Hide splash screen
        setTimeout(() => {
            if (this.elements.splashScreen) {
                this.elements.splashScreen.remove();
            }
        }, 2800);

        // Power button events
        this.elements.powerButton.addEventListener('mousedown', () => this.handlePowerButtonDown());
        this.elements.powerButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handlePowerButtonDown();
        });
        this.elements.powerButton.addEventListener('mouseup', () => this.handlePowerButtonUp());
        this.elements.powerButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handlePowerButtonUp();
        });
        this.elements.powerButton.addEventListener('mouseleave', () => this.cancelLongPress());
        this.elements.powerButton.addEventListener('touchcancel', () => this.cancelLongPress());

        // Settings menu - long press on header (2 seconds)
        this.elements.header.addEventListener('mousedown', () => this.startSettingsLongPress());
        this.elements.header.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startSettingsLongPress();
        });
        this.elements.header.addEventListener('mouseup', () => this.cancelSettingsLongPress());
        this.elements.header.addEventListener('touchend', () => this.cancelSettingsLongPress());
        this.elements.header.addEventListener('mouseleave', () => this.cancelSettingsLongPress());
        this.elements.header.addEventListener('touchcancel', () => this.cancelSettingsLongPress());

        this.elements.closeSettings.addEventListener('click', () => this.closeSettings());
        this.elements.saveSettings.addEventListener('click', () => this.saveSettings());

        // Detection mode change
        this.elements.detectionMode.addEventListener('change', (e) => {
            this.updateModeVisibility(e.target.value);
        });

        // Number of positions change
        this.elements.numPositions.addEventListener('change', (e) => {
            this.generateAngleFields(parseInt(e.target.value));
        });

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

        this.elements.tolerance.addEventListener('input', (e) => {
            this.elements.toleranceSlider.value = e.target.value;
            this.elements.toleranceValue.textContent = '±' + e.target.value + '°';
        });

        this.elements.toleranceSlider.addEventListener('input', (e) => {
            this.elements.tolerance.value = e.target.value;
            this.elements.toleranceValue.textContent = '±' + e.target.value + '°';
        });
    }

    startSettingsLongPress() {
        // Visual feedback
        this.elements.appTitle.style.textShadow = '0 0 20px rgba(0, 255, 136, 0.9)';
        this.elements.appTitle.style.color = '#00ff88';

        this.settingsLongPressTimer = setTimeout(() => {
            this.openSettings();
            if (navigator.vibrate) {
                navigator.vibrate(100);
            }
        }, 2000); // 2 seconds
    }

    cancelSettingsLongPress() {
        if (this.settingsLongPressTimer) {
            clearTimeout(this.settingsLongPressTimer);
            this.settingsLongPressTimer = null;
        }
        // Reset visual feedback
        this.elements.appTitle.style.textShadow = '';
        this.elements.appTitle.style.color = '';
    }

    generateAngleFields(numPositions) {
        const container = this.elements.anglesContainer;
        container.innerHTML = '';

        // Auto-distribute angles evenly by default
        const angleStep = 360 / numPositions;

        for (let i = 0; i < numPositions; i++) {
            const defaultAngle = Math.round((this.config.targetAngles[i] !== undefined) ?
                                          this.config.targetAngles[i] :
                                          (i * angleStep));

            const fieldHTML = `
                <div class="angle-field">
                    <label for="angle${i}">Posición ${i + 1}:</label>
                    <input type="number" id="angle${i}" class="angle-input"
                           min="0" max="359" value="${defaultAngle}" data-index="${i}">
                    <input type="range" id="angleSlider${i}" class="angle-slider"
                           min="0" max="359" value="${defaultAngle}" data-index="${i}">
                    <span class="angle-value" id="angleValue${i}">${defaultAngle}°</span>
                </div>
            `;
            container.innerHTML += fieldHTML;
        }

        // Add event listeners for each field
        for (let i = 0; i < numPositions; i++) {
            const input = document.getElementById(`angle${i}`);
            const slider = document.getElementById(`angleSlider${i}`);
            const valueSpan = document.getElementById(`angleValue${i}`);

            input.addEventListener('input', (e) => {
                slider.value = e.target.value;
                valueSpan.textContent = e.target.value + '°';
            });

            slider.addEventListener('input', (e) => {
                input.value = e.target.value;
                valueSpan.textContent = e.target.value + '°';
            });
        }
    }

    handlePowerButtonDown() {
        if (!this.isActive) {
            // Short press to turn on
            this.togglePower();
        } else if (this.config.detectionMode !== 'rotation' && !this.foundTarget) {
            // In linear mode: check card
            this.checkCard();
        } else if (this.config.detectionMode === 'rotation') {
            // In rotation mode: prepare for click to turn off (no long press)
            this.shortPressRotation = true;
        } else {
            // In linear mode after found: long press to turn off
            this.longPressTimer = setTimeout(() => {
                this.stopFinder();
                if (navigator.vibrate) {
                    navigator.vibrate(100);
                }
            }, this.longPressDelay);
        }
    }

    handlePowerButtonUp() {
        // In rotation mode: turn off with short click
        if (this.shortPressRotation) {
            this.stopFinder();
            this.shortPressRotation = false;
        }
        this.cancelLongPress();
    }

    cancelLongPress() {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        this.shortPressRotation = false;
    }

    checkCard() {
        this.currentSegment++;

        const targetSegment = Math.round(parseFloat(this.elements.targetPosition.value) / this.POKER_CARD_WIDTH);

        if (this.currentSegment === targetSegment) {
            // Found the target card!
            this.foundTarget = true;
            this.elements.statusText.textContent = '¡ENCONTRADO!';
            this.updateSignal(100);
            this.startBeeping();

            if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200]);
            }
        } else {
            // Wrong card
            this.showWrongFeedback();

            const positionCm = this.currentSegment * this.POKER_CARD_WIDTH;
            this.elements.statusText.textContent = `Carta ${this.currentSegment}`;

            const signalStrength = this.calculateSegmentSignalStrength(this.currentSegment, targetSegment);
            this.updateSignal(signalStrength);

            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        }
    }

    showWrongFeedback() {
        // Show red theme
        this.elements.powerButton.classList.add('wrong');
        this.elements.wrongMark.classList.add('visible');

        // Hide after 500ms
        setTimeout(() => {
            this.elements.powerButton.classList.remove('wrong');
            this.elements.wrongMark.classList.remove('visible');
        }, 500);
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
            // Request permission if needed
            if (this.config.detectionMode === 'rotation') {
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
            }

            this.startFinder();
        }
    }

    startFinder() {
        this.isActive = true;
        this.initialOrientation = null;
        this.currentSegment = 0;
        this.foundTarget = false;

        // Initialize audio context
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Update UI
        this.elements.powerButton.classList.add('active');
        this.elements.powerButtonText.textContent = 'APAGAR';
        this.elements.statusText.textContent = this.config.detectionMode === 'rotation' ? 'BUSCANDO...' : 'Toca para verificar';
        this.elements.statusText.classList.add('active');
        this.elements.radar.classList.add('active');
        this.elements.wrongMark.classList.remove('visible');

        // Start orientation sensor if in rotation mode
        if (this.config.detectionMode === 'rotation') {
            window.addEventListener('deviceorientation', this.handleOrientation.bind(this));
        } else {
            this.updateSignal(0);
        }

        console.log('Finder started - Mode:', this.config.detectionMode);
    }

    stopFinder() {
        this.isActive = false;

        // Stop sensors
        window.removeEventListener('deviceorientation', this.handleOrientation.bind(this));

        // Stop beeping
        this.stopBeeping();

        // Update UI
        this.elements.powerButton.classList.remove('active');
        this.elements.powerButton.classList.remove('wrong');
        this.elements.powerButtonText.textContent = 'ENCENDER';
        this.elements.statusText.textContent = 'APAGADO';
        this.elements.statusText.classList.remove('active');
        this.elements.radar.classList.remove('active');
        this.elements.wrongMark.classList.remove('visible');

        // Reset signal
        this.updateSignal(0);
    }

    handleOrientation(event) {
        if (!this.isActive || this.config.detectionMode !== 'rotation') return;

        let alpha = event.alpha || 0;

        if (this.initialOrientation === null) {
            this.initialOrientation = { alpha };
            console.log('Initial orientation:', this.initialOrientation);
        }

        let relativeAngle = this.normalizeAngle(alpha - this.initialOrientation.alpha);
        this.currentAngle = relativeAngle;

        // Check multiple targets
        const signalStrength = this.calculateSignalStrength(relativeAngle);
        this.updateSignal(signalStrength);

        // Update status text based on proximity
        if (this.isAtAnyTarget(relativeAngle)) {
            this.elements.statusText.textContent = '¡ENCONTRADO!';
        } else {
            this.elements.statusText.textContent = 'BUSCANDO...';
        }
    }

    isAtAnyTarget(currentAngle) {
        const tolerance = this.config.tolerance;

        for (let targetAngle of this.config.targetAngles) {
            let diff = Math.abs(currentAngle - targetAngle);
            if (diff > 180) {
                diff = 360 - diff;
            }
            if (diff <= tolerance) {
                return true;
            }
        }
        return false;
    }

    normalizeAngle(angle) {
        while (angle < 0) angle += 360;
        while (angle >= 360) angle -= 360;
        return angle;
    }

    calculateSignalStrength(currentAngle) {
        // Find closest target
        let minDiff = 180;
        for (let targetAngle of this.config.targetAngles) {
            let diff = Math.abs(currentAngle - targetAngle);
            if (diff > 180) {
                diff = 360 - diff;
            }
            minDiff = Math.min(minDiff, diff);
        }

        // Map to strength
        let strength = 100 - (minDiff / 180 * 100);

        const sensitivityFactors = {
            low: 0.7,
            medium: 1.0,
            high: 1.3
        };

        strength *= sensitivityFactors[this.config.sensitivity];
        return Math.max(0, Math.min(100, strength));
    }

    calculateSegmentSignalStrength(currentSegment, targetSegment) {
        const diff = Math.abs(currentSegment - targetSegment);
        const maxRange = 15;
        let strength = 100 - (diff / maxRange * 100);

        const sensitivityFactors = {
            low: 0.7,
            medium: 1.0,
            high: 1.3
        };

        strength *= sensitivityFactors[this.config.sensitivity];
        return Math.max(0, Math.min(100, strength));
    }

    updateSignal(strength) {
        this.signalStrength = strength;
        this.elements.signalStrength.textContent = Math.round(strength);

        const barCount = 5;
        const activeBarCount = Math.ceil((strength / 100) * barCount);

        this.elements.bars.forEach((bar, index) => {
            if (index < activeBarCount) {
                bar.classList.add('active');
            } else {
                bar.classList.remove('active');
            }
        });

        // Dynamic beeping based on signal strength
        if (this.isActive && this.config.detectionMode === 'rotation') {
            if (strength > 0) {
                if (!this.isBeeping) {
                    this.startBeeping();
                } else {
                    this.updateBeepSpeed();
                }
            } else {
                if (this.isBeeping) {
                    this.stopBeeping();
                }
            }
        }
    }

    startBeeping() {
        if (this.isBeeping || !this.audioContext) return;

        this.isBeeping = true;
        this.beep();
        this.scheduleNextBeep();
    }

    updateBeepSpeed() {
        // Beep speed is updated automatically via scheduleNextBeep
    }

    scheduleNextBeep() {
        if (!this.isBeeping) return;

        // Calculate interval: 2000ms at 0% down to 100ms at 100%
        const maxInterval = 2000; // 2 seconds
        const minInterval = 100;  // 0.1 seconds
        const beepSpeed = maxInterval - ((this.signalStrength / 100) * (maxInterval - minInterval));

        this.beepInterval = setTimeout(() => {
            if (this.isBeeping) {
                this.beep();
                this.scheduleNextBeep();
            }
        }, beepSpeed);
    }

    stopBeeping() {
        this.isBeeping = false;

        if (this.beepInterval) {
            clearTimeout(this.beepInterval);
            this.beepInterval = null;
        }
    }

    beep() {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Frequency increases with signal: 400Hz at 0% to 1600Hz at 100%
        const frequency = 400 + (this.signalStrength * 12);

        // Duration decreases with signal: 0.08s at 0% to 0.15s at 100%
        const duration = 0.08 + (this.signalStrength / 100 * 0.07);

        // Volume increases with signal: 0.15 at 0% to 0.4 at 100%
        const volume = 0.15 + (this.signalStrength / 100 * 0.25);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    openSettings() {
        this.elements.settingsMenu.classList.remove('hidden');

        this.elements.detectionMode.value = this.config.detectionMode;
        this.updateModeVisibility(this.config.detectionMode);

        // Set number of positions and generate angle fields
        this.elements.numPositions.value = this.config.targetAngles.length;
        this.generateAngleFields(this.config.targetAngles.length);

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

        // Save all angle values
        const numPositions = parseInt(this.elements.numPositions.value);
        this.config.targetAngles = [];
        for (let i = 0; i < numPositions; i++) {
            const angleInput = document.getElementById(`angle${i}`);
            if (angleInput) {
                this.config.targetAngles.push(parseInt(angleInput.value));
            }
        }

        const targetPos = parseFloat(this.elements.targetPosition.value);
        this.config.targetSegment = Math.round(targetPos / this.POKER_CARD_WIDTH);

        this.config.tolerance = parseInt(this.elements.tolerance.value);
        this.config.sensitivity = this.elements.sensitivity.value;

        localStorage.setItem('finderConfig', JSON.stringify(this.config));

        this.closeSettings();

        console.log('Settings saved:', this.config);
    }

    loadConfig() {
        const saved = localStorage.getItem('finderConfig');
        if (saved) {
            try {
                const loadedConfig = JSON.parse(saved);

                // Migrate old config format to new format
                if (loadedConfig.targetAngle !== undefined && !loadedConfig.targetAngles) {
                    const numTargets = loadedConfig.multiTarget || 1;
                    const baseAngle = loadedConfig.targetAngle;
                    const angleStep = 360 / numTargets;
                    loadedConfig.targetAngles = [];
                    for (let i = 0; i < numTargets; i++) {
                        loadedConfig.targetAngles.push((baseAngle + (angleStep * i)) % 360);
                    }
                    delete loadedConfig.targetAngle;
                    delete loadedConfig.multiTarget;
                }

                // Ensure targetAngles is an array
                if (!Array.isArray(loadedConfig.targetAngles)) {
                    loadedConfig.targetAngles = [90];
                }

                this.config = loadedConfig;
                console.log('Config loaded:', this.config);
            } catch (e) {
                console.error('Error loading config:', e);
            }
        }
    }
}

// Initialize app
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
