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
     * Augmenté de 10ms → 25ms pour être plus perceptible
     */
    light() {
        if (this.isAvailable()) {
            navigator.vibrate(25);
        }
    },
    
    /**
     * Vibration moyenne (bouton, action)
     * Augmenté de 20ms → 50ms pour être bien perceptible
     */
    medium() {
        if (this.isAvailable()) {
            navigator.vibrate(50);
        }
    },
    
    /**
     * Vibration forte (succès, validation)
     * Augmenté de 30ms → 100ms pour être vraiment impactant
     */
    heavy() {
        if (this.isAvailable()) {
            navigator.vibrate(100);
        }
    },
    
    /**
     * Vibration très forte (actions importantes)
     * Nouveau : vibration extra-forte
     */
    extraHeavy() {
        if (this.isAvailable()) {
            navigator.vibrate(200);
        }
    },
    
    /**
     * Vibration d'erreur (pattern)
     * Pattern plus long et perceptible
     */
    error() {
        if (this.isAvailable()) {
            navigator.vibrate([50, 100, 50, 100, 50]);
        }
    },
    
    /**
     * Vibration de succès (pattern)
     * Pattern plus dynamique et joyeux
     */
    success() {
        if (this.isAvailable()) {
            navigator.vibrate([30, 50, 30, 50, 100]);
        }
    },
    
    /**
     * Vibration d'avertissement (pattern)
     * Pattern plus insistant
     */
    warning() {
        if (this.isAvailable()) {
            navigator.vibrate([50, 100, 50, 100, 50]);
        }
    },
    
    /**
     * Vibration de notification
     * Nouveau : pattern de notification
     */
    notification() {
        if (this.isAvailable()) {
            navigator.vibrate([30, 50, 30]);
        }
    },
    
    /**
     * Vibration de confirmation
     * Nouveau : double tap
     */
    confirm() {
        if (this.isAvailable()) {
            navigator.vibrate([50, 100, 50]);
        }
    },
    
    /**
     * Vibration de suppression
     * Nouveau : pattern intense pour action destructive
     */
    delete() {
        if (this.isAvailable()) {
            navigator.vibrate([100, 100, 100]);
        }
    },
    
    /**
     * Vibration de toggle (on/off)
     * Nouveau : pattern court et net
     */
    toggle() {
        if (this.isAvailable()) {
            navigator.vibrate([30, 30, 30]);
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
    },
    
    /**
     * Test de vibration (pour debugging)
     * Fait vibrer en séquence tous les types
     */
    test() {
        if (!this.isAvailable()) {
            console.warn('Vibration API non disponible');
            return;
        }
        
        console.log('🧪 Test des vibrations...');
        
        setTimeout(() => {
            console.log('1️⃣ Light (25ms)');
            this.light();
        }, 0);
        
        setTimeout(() => {
            console.log('2️⃣ Medium (50ms)');
            this.medium();
        }, 1000);
        
        setTimeout(() => {
            console.log('3️⃣ Heavy (100ms)');
            this.heavy();
        }, 2000);
        
        setTimeout(() => {
            console.log('4️⃣ Success (pattern)');
            this.success();
        }, 3000);
        
        setTimeout(() => {
            console.log('5️⃣ Error (pattern)');
            this.error();
        }, 4500);
        
        setTimeout(() => {
            console.log('✅ Test terminé');
        }, 6000);
    }
};

console.log('✅ Module Haptic Feedback chargé');

