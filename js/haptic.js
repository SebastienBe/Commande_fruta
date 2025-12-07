/* ============================================
   HAPTIC FEEDBACK - Vibrations sur actions
   ============================================ */

const Haptic = {
    /**
     * Vérifie si le haptic feedback est disponible
     */
    isAvailable() {
        return 'vibrate' in navigator;
    },
    
    /**
     * Vibration légère (sélection, hover)
     */
    light() {
        if (this.isAvailable()) {
            navigator.vibrate(10);
        }
    },
    
    /**
     * Vibration moyenne (bouton, action)
     */
    medium() {
        if (this.isAvailable()) {
            navigator.vibrate(20);
        }
    },
    
    /**
     * Vibration forte (succès, validation)
     */
    heavy() {
        if (this.isAvailable()) {
            navigator.vibrate(30);
        }
    },
    
    /**
     * Vibration d'erreur (pattern)
     */
    error() {
        if (this.isAvailable()) {
            navigator.vibrate([10, 50, 10]);
        }
    },
    
    /**
     * Vibration de succès (pattern)
     */
    success() {
        if (this.isAvailable()) {
            navigator.vibrate([10, 30, 10]);
        }
    },
    
    /**
     * Vibration d'avertissement (pattern)
     */
    warning() {
        if (this.isAvailable()) {
            navigator.vibrate([20, 50, 20]);
        }
    },
    
    /**
     * Pattern personnalisé
     * @param {Array<number>} pattern - [vibrate, pause, vibrate, ...]
     */
    custom(pattern) {
        if (this.isAvailable()) {
            navigator.vibrate(pattern);
        }
    }
};

console.log('✅ Module Haptic Feedback chargé');

