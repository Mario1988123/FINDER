// Object Finder App - Multi-Mode Object Locator v2.5

class ObjectFinder {
    constructor() {
        // Configuration
        this.config = {
            detectionMode: 'rotation',
            targetAngles: [90], // Array of target angles
            objectNames: ['Objeto 1', 'Objeto 2', 'Objeto 3'], // Array of object names for linear mode
            targetObjectIndex: 2, // Which object is the correct one (0-indexed)
            tolerance: 10,
            sensitivity: 'medium'
        };

        // State
        this.isActive = false;
        this.currentAngle = 0;
        this.currentSegment = 0;
        this.initialOrientation = null;
        this.markedOrientation = null; // For 'anywhere' mode
        this.anywhereMarked = false; // Flag for 'anywhere' mode
        this.signalStrength = 0;
        this.isBeeping = false;
        this.foundTarget = false;
        this.longPressTimer = null;
        this.shortPressRotation = false;
        this.longPressDelay = 3000; // 3 seconds
        this.wrongDisplayTimer = null; // Timer for wrong mark display
        this.cornerPressTimer = null; // Timer for corner long press

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
            numObjects: document.getElementById('numObjects'),
            targetObjectIndex: document.getElementById('targetObjectIndex'),
            objectsContainer: document.getElementById('objectsContainer'),
            tolerance: document.getElementById('tolerance'),
            toleranceSlider: document.getElementById('toleranceSlider'),
            toleranceValue: document.getElementById('toleranceValue'),
            sensitivity: document.getElementById('sensitivity'),
            permissionOverlay: document.getElementById('permissionOverlay'),
            requestPermission: document.getElementById('requestPermission'),
            splashScreen: document.getElementById('splashScreen'),
            cornerTopLeft: document.getElementById('cornerTopLeft'),
            cornerTopRight: document.getElementById('cornerTopRight'),
            cornerBottomLeft: document.getElementById('cornerBottomLeft'),
            cornerBottomRight: document.getElementById('cornerBottomRight')
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

        // Number of positions change (rotation mode)
        this.elements.numPositions.addEventListener('change', (e) => {
            this.generateAngleFields(parseInt(e.target.value));
        });

        // Number of objects change (linear mode)
        this.elements.numObjects.addEventListener('change', (e) => {
            this.generateObjectFields(parseInt(e.target.value));
            this.updateTargetObjectOptions(parseInt(e.target.value));
        });

        this.elements.tolerance.addEventListener('input', (e) => {
            this.elements.toleranceSlider.value = e.target.value;
            this.elements.toleranceValue.textContent = '±' + e.target.value + '°';
        });

        this.elements.toleranceSlider.addEventListener('input', (e) => {
            this.elements.tolerance.value = e.target.value;
            this.elements.toleranceValue.textContent = '±' + e.target.value + '°';
        });

        // Corner buttons events (for Anytime mode)
        const corners = [
            this.elements.cornerTopLeft,
            this.elements.cornerTopRight,
            this.elements.cornerBottomLeft,
            this.elements.cornerBottomRight
        ];

        corners.forEach(corner => {
            corner.addEventListener('mousedown', () => this.handleCornerPress());
            corner.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleCornerPress();
            });
            corner.addEventListener('mouseup', () => this.cancelCornerPress());
            corner.addEventListener('touchend', () => this.cancelCornerPress());
            corner.addEventListener('mouseleave', () => this.cancelCornerPress());
            corner.addEventListener('touchcancel', () => this.cancelCornerPress());
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

    handleCornerPress() {
        if (!this.isActive || this.config.detectionMode !== 'anytime') return;

        // Start 2-second timer to advance to next card
        this.cornerPressTimer = setTimeout(() => {
            this.advanceToNextCard();
            if (navigator.vibrate) {
                navigator.vibrate(100);
            }
        }, 2000); // 2 seconds
    }

    cancelCornerPress() {
        if (this.cornerPressTimer) {
            clearTimeout(this.cornerPressTimer);
            this.cornerPressTimer = null;
        }
    }

    advanceToNextCard() {
        // Advance to the next card in anytime mode
        this.currentSegment++;
        this.foundTarget = false;

        // Reset UI
        this.elements.wrongMark.classList.remove('visible');
        this.elements.powerButton.classList.remove('wrong');
        this.elements.statusText.textContent = 'Toca para verificar';
        this.updateSignal(0);

        // Reset button to "FIND" for next card
        this.updatePowerButtonForAnytime(false);

        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
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

    generateObjectFields(numObjects) {
        const container = this.elements.objectsContainer;
        container.innerHTML = '';

        for (let i = 0; i < numObjects; i++) {
            const defaultName = this.config.objectNames[i] || `Objeto ${i + 1}`;

            const fieldHTML = `
                <div class="object-field">
                    <label for="object${i}">Objeto ${i + 1}:</label>
                    <input type="text" id="object${i}" class="object-input"
                           value="${defaultName}" data-index="${i}" maxlength="30"
                           placeholder="Nombre del objeto">
                </div>
            `;
            container.innerHTML += fieldHTML;
        }

        // Add event listeners for each field
        for (let i = 0; i < numObjects; i++) {
            const input = document.getElementById(`object${i}`);
            input.addEventListener('input', (e) => {
                // Update in real-time (optional)
            });
        }
    }

    updateTargetObjectOptions(numObjects) {
        const select = this.elements.targetObjectIndex;
        select.innerHTML = '';

        for (let i = 0; i < numObjects; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Objeto ${i + 1}`;
            select.appendChild(option);
        }

        // Set default or current value
        if (this.config.targetObjectIndex < numObjects) {
            select.value = this.config.targetObjectIndex;
        } else {
            select.value = numObjects - 1;
        }
    }

    handlePowerButtonDown() {
        // Mode "Anywhere": first click marks position, second click activates
        if (this.config.detectionMode === 'anywhere' && !this.isActive) {
            if (!this.anywhereMarked) {
                // First click: mark the initial angle
                this.markAnywherePosition();
            } else {
                // Second click: activate finder
                this.togglePower();
            }
        } else if (!this.isActive) {
            // Other modes: short press to turn on
            this.togglePower();
        } else if (this.config.detectionMode === 'anytime' && !this.foundTarget) {
            // In anytime mode: check card (multiple attempts allowed)
            this.checkCardAnytime();
        } else if (this.config.detectionMode === 'anytime' && this.foundTarget) {
            // In anytime mode after found: click to turn off
            this.shortPressRotation = true;
        } else if (this.config.detectionMode === 'linear-horizontal' && !this.foundTarget) {
            // In linear mode: check object
            this.checkCard();
        } else if (this.config.detectionMode === 'rotation' || this.config.detectionMode === 'anywhere') {
            // In rotation/anywhere mode: prepare for click to turn off (no long press)
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

        const targetIndex = this.config.targetObjectIndex;

        if (this.currentSegment - 1 === targetIndex) {
            // Found the target object!
            this.foundTarget = true;
            const objectName = this.config.objectNames[this.currentSegment - 1] || `Objeto ${this.currentSegment}`;
            this.elements.statusText.textContent = `¡${objectName}!`;
            this.updateSignal(100);
            this.startBeeping();

            if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200]);
            }
        } else {
            // Wrong object
            const objectName = this.config.objectNames[this.currentSegment - 1] || `Objeto ${this.currentSegment}`;
            this.showWrongFeedback(objectName);

            const signalStrength = this.calculateObjectSignalStrength(this.currentSegment - 1, targetIndex);
            this.updateSignal(signalStrength);

            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        }
    }

    checkCardAnytime() {
        // In anytime mode, don't increment segment - allow multiple attempts
        const targetIndex = this.config.targetObjectIndex;

        if (this.currentSegment === targetIndex) {
            // Found the target object!
            this.foundTarget = true;
            const objectName = this.config.objectNames[this.currentSegment] || `Objeto ${this.currentSegment + 1}`;
            this.elements.statusText.textContent = `¡${objectName}!`;
            this.updateSignal(100);
            this.startBeeping();

            // Change button to "APAGAR" now that card is found
            this.updatePowerButtonForAnytime(true);

            if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200]);
            }
        } else {
            // Wrong object - show error message
            this.showWrongFeedback('NO ES ESA CARTA!!');

            const signalStrength = this.calculateObjectSignalStrength(this.currentSegment, targetIndex);
            this.updateSignal(signalStrength);

            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        }
    }

    showWrongFeedback(objectName) {
        // Clear previous timer if exists
        if (this.wrongDisplayTimer) {
            clearTimeout(this.wrongDisplayTimer);
        }

        // Show red theme and object name
        this.elements.powerButton.classList.add('wrong');
        this.elements.wrongMark.classList.add('visible');
        this.elements.statusText.textContent = objectName || 'Incorrecto';

        // Hide after 1500ms (1.5 seconds)
        this.wrongDisplayTimer = setTimeout(() => {
            this.elements.powerButton.classList.remove('wrong');
            this.elements.wrongMark.classList.remove('visible');
            this.elements.statusText.textContent = 'Toca para verificar';
        }, 1500);
    }

    markAnywherePosition() {
        // Request access to orientation sensor
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.startMarkingPosition();
                }
            }).catch(console.error);
        } else {
            this.startMarkingPosition();
        }
    }

    startMarkingPosition() {
        // Listen to orientation event once to mark the position
        const markPosition = (event) => {
            let alpha = event.alpha || 0;
            this.markedOrientation = { alpha };
            this.anywhereMarked = true;

            // Silent UI update - no text shown
            this.elements.powerButtonText.textContent = 'ENCENDER';

            if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100]);
            }

            // Remove listener
            window.removeEventListener('deviceorientation', markPosition);
        };

        window.addEventListener('deviceorientation', markPosition);

        // Silent feedback - only vibration
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }

    updatePowerButtonForAnytime(found) {
        const icon = this.elements.powerButton.querySelector('.power-icon');
        const text = this.elements.powerButtonText;

        if (found) {
            // Found the card: show power off icon and "APAGAR"
            icon.innerHTML = '<path fill="currentColor" d="M13,3H11V13H13V3M17.83,5.17L16.41,6.59C18.05,7.91 19,9.9 19,12C19,15.87 15.87,19 12,19C8.13,19 5,15.87 5,12C5,9.9 5.95,7.91 7.59,6.59L6.17,5.17C4.23,6.82 3,9.26 3,12C3,16.97 7.03,21 12,21C16.97,21 21,16.97 21,12C21,9.26 19.77,6.82 17.83,5.17Z"/>';
            text.textContent = 'APAGAR';
        } else {
            // Searching: show magnifying glass icon and "FIND"
            icon.innerHTML = '<path fill="currentColor" d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>';
            text.textContent = 'FIND';
        }
    }

    updateModeVisibility(mode) {
        const rotationMode = document.querySelectorAll('.rotation-mode');
        const linearMode = document.querySelectorAll('.linear-mode');

        if (mode === 'rotation' || mode === 'anywhere') {
            rotationMode.forEach(el => el.classList.remove('hidden'));
            linearMode.forEach(el => el.classList.add('hidden'));
        } else {
            rotationMode.forEach(el => el.classList.add('hidden'));
            linearMode.forEach(el => el.classList.remove('hidden'));
        }
    }

    showCornerButtons() {
        this.elements.cornerTopLeft.classList.remove('hidden');
        this.elements.cornerTopRight.classList.remove('hidden');
        this.elements.cornerBottomLeft.classList.remove('hidden');
        this.elements.cornerBottomRight.classList.remove('hidden');
    }

    hideCornerButtons() {
        this.elements.cornerTopLeft.classList.add('hidden');
        this.elements.cornerTopRight.classList.add('hidden');
        this.elements.cornerBottomLeft.classList.add('hidden');
        this.elements.cornerBottomRight.classList.add('hidden');
    }

    async togglePower() {
        if (!this.isActive) {
            // Request permission if needed
            if (this.config.detectionMode === 'rotation' || this.config.detectionMode === 'anywhere') {
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
        this.currentSegment = 0;
        this.foundTarget = false;

        // For "anywhere" mode, use marked orientation as initial
        if (this.config.detectionMode === 'anywhere' && this.anywhereMarked) {
            this.initialOrientation = this.markedOrientation;
        } else {
            this.initialOrientation = null;
        }

        // Initialize audio context
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Update UI
        this.elements.powerButton.classList.add('active');

        // Different button text for Anytime mode
        if (this.config.detectionMode === 'anytime') {
            this.updatePowerButtonForAnytime(false); // false = not found yet
        } else {
            this.elements.powerButtonText.textContent = 'APAGAR';
        }

        if (this.config.detectionMode === 'rotation' || this.config.detectionMode === 'anywhere') {
            this.elements.statusText.textContent = 'BUSCANDO...';
        } else {
            this.elements.statusText.textContent = 'Toca para verificar';
        }

        this.elements.statusText.classList.add('active');
        this.elements.radar.classList.add('active');
        this.elements.wrongMark.classList.remove('visible');

        // Show corner buttons if in anytime mode
        if (this.config.detectionMode === 'anytime') {
            this.showCornerButtons();
            this.updateSignal(0); // Start at 0%
        } else {
            this.hideCornerButtons();
            if (this.config.detectionMode !== 'rotation' && this.config.detectionMode !== 'anywhere') {
                this.updateSignal(0);
            }
        }

        // Start orientation sensor if in rotation or anywhere mode
        if (this.config.detectionMode === 'rotation' || this.config.detectionMode === 'anywhere') {
            window.addEventListener('deviceorientation', this.handleOrientation.bind(this));
        }

        console.log('Finder started - Mode:', this.config.detectionMode);
    }

    stopFinder() {
        this.isActive = false;

        // Stop sensors
        window.removeEventListener('deviceorientation', this.handleOrientation.bind(this));

        // Stop beeping
        this.stopBeeping();

        // Reset anywhere mode state
        if (this.config.detectionMode === 'anywhere') {
            this.anywhereMarked = false;
            this.markedOrientation = null;
        }

        // Hide corner buttons
        this.hideCornerButtons();

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
        if (!this.isActive) return;
        if (this.config.detectionMode !== 'rotation' && this.config.detectionMode !== 'anywhere') return;

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

    calculateObjectSignalStrength(currentIndex, targetIndex) {
        const diff = Math.abs(currentIndex - targetIndex);
        const maxRange = this.config.objectNames.length;
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
        if (this.isActive && (this.config.detectionMode === 'rotation' || this.config.detectionMode === 'anywhere')) {
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

        // Calculate interval: 800ms at 0% down to 150ms at 92-100%
        const maxInterval = 800;  // 0.8 seconds
        const minInterval = 150;  // 0.15 seconds

        // Plateau effect: from 92% to 100%, keep minimum interval
        let effectiveStrength = this.signalStrength;
        if (effectiveStrength > 92) {
            effectiveStrength = 92;
        }

        const beepSpeed = maxInterval - ((effectiveStrength / 100) * (maxInterval - minInterval));

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

        // Constant frequency (same tone)
        const frequency = 800;  // Fixed at 800Hz

        // Fixed duration
        const duration = 0.12;

        // Volume increases with signal: 0.10 at 0% to 0.50 at 100%
        // Plateau effect: from 92% to 100%, volume changes minimally
        let effectiveStrength = this.signalStrength;
        if (effectiveStrength > 92) {
            // Subtle increase from 92% to 100%
            const plateauProgress = (this.signalStrength - 92) / 8; // 0 to 1
            effectiveStrength = 92 + (plateauProgress * 2); // 92 to 94
        }

        const volume = 0.10 + (effectiveStrength / 100 * 0.40);

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

        // Set number of positions and generate angle fields (rotation/anywhere mode)
        this.elements.numPositions.value = this.config.targetAngles.length;
        this.generateAngleFields(this.config.targetAngles.length);

        // Set number of objects and generate object fields (linear mode)
        this.elements.numObjects.value = this.config.objectNames.length;
        this.generateObjectFields(this.config.objectNames.length);
        this.updateTargetObjectOptions(this.config.objectNames.length);
        this.elements.targetObjectIndex.value = this.config.targetObjectIndex;

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

        // Save all angle values (rotation/anywhere mode)
        const numPositions = parseInt(this.elements.numPositions.value);
        this.config.targetAngles = [];
        for (let i = 0; i < numPositions; i++) {
            const angleInput = document.getElementById(`angle${i}`);
            if (angleInput) {
                this.config.targetAngles.push(parseInt(angleInput.value));
            }
        }

        // Save all object names (linear mode)
        const numObjects = parseInt(this.elements.numObjects.value);
        this.config.objectNames = [];
        for (let i = 0; i < numObjects; i++) {
            const objectInput = document.getElementById(`object${i}`);
            if (objectInput) {
                this.config.objectNames.push(objectInput.value || `Objeto ${i + 1}`);
            }
        }
        this.config.targetObjectIndex = parseInt(this.elements.targetObjectIndex.value);

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
