/* ============================================
   SWIPE GESTURES - Swipe pour actions sur cards
   ============================================ */

class SwipeHandler {
    constructor(element, options = {}) {
        this.element = element;
        this.options = {
            threshold: 80, // Distance minimum pour trigger
            leftAction: null, // Callback pour swipe gauche
            rightAction: null, // Callback pour swipe droit
            leftIcon: '✓',
            rightIcon: '🗑️',
            leftLabel: 'Valider',
            rightLabel: 'Supprimer',
            leftColor: '#4CAF50',
            rightColor: '#F44336',
            ...options
        };
        
        this.startX = 0;
        this.currentX = 0;
        this.isSwiping = false;
        this.swipeDistance = 0;
        
        this.init();
    }
    
    /**
     * Initialise le swipe
     */
    init() {
        // Wrapper pour le swipe
        this.element.classList.add('swipe-action');
        
        // Créer les backgrounds gauche et droit
        this.createBackgrounds();
        
        // Wrapper le contenu
        const content = this.element.innerHTML;
        this.element.innerHTML = `
            <div class="swipe-content">${content}</div>
        `;
        this.content = this.element.querySelector('.swipe-content');
        
        // Événements touch
        this.setupTouchListeners();
    }
    
    /**
     * Crée les backgrounds d'action
     */
    createBackgrounds() {
        if (this.options.leftAction) {
            const leftBg = document.createElement('div');
            leftBg.className = 'swipe-background left';
            leftBg.style.background = `linear-gradient(90deg, ${this.options.leftColor}, transparent)`;
            leftBg.innerHTML = `
                <span class="swipe-icon">${this.options.leftIcon}</span>
                <span class="swipe-label">${this.options.leftLabel}</span>
            `;
            this.element.appendChild(leftBg);
        }
        
        if (this.options.rightAction) {
            const rightBg = document.createElement('div');
            rightBg.className = 'swipe-background right';
            rightBg.style.background = `linear-gradient(270deg, ${this.options.rightColor}, transparent)`;
            rightBg.innerHTML = `
                <span class="swipe-label">${this.options.rightLabel}</span>
                <span class="swipe-icon">${this.options.rightIcon}</span>
            `;
            this.element.appendChild(rightBg);
        }
    }
    
    /**
     * Configure les listeners touch
     */
    setupTouchListeners() {
        this.content.addEventListener('touchstart', (e) => {
            this.startX = e.touches[0].clientX;
            this.currentX = this.startX;
            this.isSwiping = true;
            this.content.classList.add('swiping');
        }, { passive: true });
        
        this.content.addEventListener('touchmove', (e) => {
            if (!this.isSwiping) return;
            
            this.currentX = e.touches[0].clientX;
            this.swipeDistance = this.currentX - this.startX;
            
            // Limiter le swipe selon les actions disponibles
            if (this.swipeDistance > 0 && !this.options.leftAction) {
                this.swipeDistance = 0;
            }
            if (this.swipeDistance < 0 && !this.options.rightAction) {
                this.swipeDistance = 0;
            }
            
            // Appliquer la transformation avec effet élastique
            const maxDistance = 150;
            const elasticDistance = this.swipeDistance > maxDistance 
                ? maxDistance + (this.swipeDistance - maxDistance) * 0.3
                : this.swipeDistance < -maxDistance
                    ? -maxDistance + (this.swipeDistance + maxDistance) * 0.3
                    : this.swipeDistance;
            
            this.content.style.transform = `translateX(${elasticDistance}px)`;
            
            // Afficher le background approprié
            this.updateBackgrounds(elasticDistance);
        }, { passive: true });
        
        this.content.addEventListener('touchend', () => {
            if (!this.isSwiping) return;
            
            this.handleSwipeEnd();
        });
    }
    
    /**
     * Met à jour la visibilité des backgrounds
     */
    updateBackgrounds(distance) {
        const leftBg = this.element.querySelector('.swipe-background.left');
        const rightBg = this.element.querySelector('.swipe-background.right');
        
        if (leftBg) {
            leftBg.style.opacity = Math.min(distance / this.options.threshold, 1);
        }
        if (rightBg) {
            rightBg.style.opacity = Math.min(Math.abs(distance) / this.options.threshold, 1);
        }
    }
    
    /**
     * Gère la fin du swipe
     */
    async handleSwipeEnd() {
        this.isSwiping = false;
        this.content.classList.remove('swiping');
        
        // Swipe à gauche (action droite - supprimer)
        if (this.swipeDistance < -this.options.threshold && this.options.rightAction) {
            await this.triggerAction('right');
        }
        // Swipe à droite (action gauche - valider)
        else if (this.swipeDistance > this.options.threshold && this.options.leftAction) {
            await this.triggerAction('left');
        }
        // Reset
        else {
            this.reset();
        }
    }
    
    /**
     * Déclenche l'action
     */
    async triggerAction(direction) {
        // Vibration
        if ('vibrate' in navigator) {
            navigator.vibrate(30);
        }
        
        // Animation de sortie
        const exitDistance = direction === 'left' ? 500 : -500;
        this.content.style.transition = 'transform 0.3s ease-out';
        this.content.style.transform = `translateX(${exitDistance}px)`;
        
        // Attendre l'animation
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Exécuter l'action
        const action = direction === 'left' 
            ? this.options.leftAction 
            : this.options.rightAction;
        
        if (action) {
            await action();
        }
    }
    
    /**
     * Reset la position
     */
    reset() {
        this.content.style.transition = 'transform 0.3s ease-out';
        this.content.style.transform = 'translateX(0)';
        
        setTimeout(() => {
            this.content.style.transition = '';
            this.swipeDistance = 0;
        }, 300);
    }
    
    /**
     * Détruit l'instance
     */
    destroy() {
        // Supprimer les event listeners
        // (dans une vraie app, il faudrait garder les références aux fonctions)
        this.element.classList.remove('swipe-action');
    }
}

console.log('✅ Module Swipe Gestures chargé');

