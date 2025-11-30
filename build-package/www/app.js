// Object Finder App - Gyroscope-based Object Locator

class ObjectFinder {
    constructor() {
        // Configuration
        this.config = {
            targetAngle: 90,
            tolerance: 10,
            sensitivity: 'medium'
        };

        // State
        this.isActive = false;
        this.currentAngle = 0;
        this.initialOrientation = null;
        this.signalStrength = 0;
        this.isBeeping = false;

        // Audio Context for beeping
        this.audioContext = null;
        this.beepInterval = null;

        // DOM Elements
        this.elements = {
            powerButton: document.getElementById('powerButton'),
            statusText: document.getElementById('statusText'),
            signalStrength: document.getElementById('signalStrength'),
            angleDisplay: document.getElementById('angleDisplay'),
            bars: document.querySelectorAll('.bar'),
            radar: document.querySelector('.radar'),
            settingsIcon: document.getElementById('settingsIcon'),
            settingsMenu: document.getElementById('settingsMenu'),
            closeSettings: document.getElementById('closeSettings'),
            saveSettings: document.getElementById('saveSettings'),
            targetAngle: document.getElementById('targetAngle'),
            targetAngleSlider: document.getElementById('targetAngleSlider'),
            angleValue: document.getElementById('angleValue'),
            tolerance: document.getElementById('tolerance'),
            toleranceSlider: document.getElementById('toleranceSlider'),
            toleranceValue: document.getElementById('toleranceValue'),
            sensitivity: document.getElementById('sensitivity'),
            permissionOverlay: document.getElementById('permissionOverlay'),
            requestPermission: document.getElementById('requestPermission')
        };

        // Load saved configuration
        this.loadConfig();

        // Initialize
        this.init();
    }

    init() {
        // Event listeners
        this.elements.powerButton.addEventListener('click', () => this.togglePower());
        this.elements.settingsIcon.addEventListener('click', () => this.openSettings());
        this.elements.closeSettings.addEventListener('click', () => this.closeSettings());
        this.elements.saveSettings.addEventListener('click', () => this.saveSettings());

        // Settings synchronization
        this.elements.targetAngle.addEventListener('input', (e) => {
            this.elements.targetAngleSlider.value = e.target.value;
            this.elements.angleValue.textContent = e.target.value + '°';
        });

        this.elements.targetAngleSlider.addEventListener('input', (e) => {
            this.elements.targetAngle.value = e.target.value;
            this.elements.angleValue.textContent = e.target.value + '°';
        });

        this.elements.tolerance.addEventListener('input', (e) => {
            this.elements.toleranceSlider.value = e.target.value;
            this.elements.toleranceValue.textContent = '±' + e.target.value + '°';
        });

        this.elements.toleranceSlider.addEventListener('input', (e) => {
            this.elements.tolerance.value = e.target.value;
            this.elements.toleranceValue.textContent = '±' + e.target.value + '°';
        });

        // Check if DeviceOrientation is supported
        if (!window.DeviceOrientationEvent) {
            alert('Tu dispositivo no soporta el sensor de orientación.');
        }
    }

    async togglePower() {
        if (!this.isActive) {
            // Request permission if needed (iOS 13+)
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                try {
                    const permission = await DeviceOrientationEvent.requestPermission();
                    if (permission !== 'granted') {
                        alert('Permiso denegado para acceder al sensor de orientación.');
                        return;
                    }
                } catch (error) {
                    console.error('Error requesting permission:', error);
                    this.elements.permissionOverlay.classList.remove('hidden');
                    return;
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

        // Start listening to orientation
        window.addEventListener('deviceorientation', this.handleOrientation.bind(this));

        console.log('Finder started - Target angle:', this.config.targetAngle);
    }

    stopFinder() {
        this.isActive = false;

        // Stop listening to orientation
        window.removeEventListener('deviceorientation', this.handleOrientation.bind(this));

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
        if (!this.isActive) return;

        // Get alpha (compass heading) - ranges from 0 to 360
        let alpha = event.alpha || 0;

        // Get beta (front-to-back tilt) - ranges from -180 to 180
        let beta = event.beta || 0;

        // Get gamma (left-to-right tilt) - ranges from -90 to 90
        let gamma = event.gamma || 0;

        // Store initial orientation on first read
        if (this.initialOrientation === null) {
            this.initialOrientation = { alpha, beta, gamma };
            console.log('Initial orientation:', this.initialOrientation);
        }

        // Calculate relative rotation from initial position
        // Using alpha (compass) as primary orientation
        let relativeAngle = this.normalizeAngle(alpha - this.initialOrientation.alpha);

        // Also consider device tilt for more responsive detection
        // Combine rotation with tilt for better detection
        const tiltFactor = Math.abs(gamma) / 90; // 0 to 1

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
        // The closer to target, the higher the signal
        const maxRange = 180; // Maximum possible difference
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
        const baseInterval = 1000; // Base interval in ms
        const minInterval = 100; // Minimum interval at 100% signal
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
        const frequency = 800 + (this.signalStrength * 10); // Higher pitch for stronger signal
        const duration = 0.1; // Beep duration in seconds

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
        this.elements.targetAngle.value = this.config.targetAngle;
        this.elements.targetAngleSlider.value = this.config.targetAngle;
        this.elements.angleValue.textContent = this.config.targetAngle + '°';

        this.elements.tolerance.value = this.config.tolerance;
        this.elements.toleranceSlider.value = this.config.tolerance;
        this.elements.toleranceValue.textContent = '±' + this.config.tolerance + '°';

        this.elements.sensitivity.value = this.config.sensitivity;
    }

    closeSettings() {
        this.elements.settingsMenu.classList.add('hidden');
    }

    saveSettings() {
        this.config.targetAngle = parseInt(this.elements.targetAngle.value);
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
