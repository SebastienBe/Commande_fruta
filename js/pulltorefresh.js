/* ============================================
   PULL TO REFRESH - Tirer pour actualiser
   ============================================ */

class PullToRefresh {
    constructor(onRefresh) {
        this.onRefresh = onRefresh;
        this.startY = 0;
        this.pullDistance = 0;
        this.threshold = 80; // Distance minimum pour trigger
        this.isRefreshing = false;
        this.isPulling = false;
        
        this.container = null;
        this.indicator = null;
        
        this.init();
    }
    
    /**
     * Initialise le pull to refresh
     */
    init() {
        // Créer l'indicateur
        this.indicator = document.createElement('div');
        this.indicator.className = 'pull-to-refresh-indicator';
        this.indicator.innerHTML = '<div class="pull-to-refresh-spinner"></div>';
        
        // Insérer au début du body
        document.body.insertBefore(this.indicator, document.body.firstChild);
        
        // Écouter les événements touch
        this.setupTouchListeners();
    }
    
    /**
     * Configure les listeners touch
     */
    setupTouchListeners() {
        let touchStartY = 0;
        let isAtTop = false;
        
        document.addEventListener('touchstart', (e) => {
            // Vérifier si on est en haut de la page
            isAtTop = window.scrollY === 0;
            if (isAtTop && !this.isRefreshing) {
                touchStartY = e.touches[0].clientY;
                this.startY = touchStartY;
            }
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            if (!isAtTop || this.isRefreshing) return;
            
            const touchY = e.touches[0].clientY;
            this.pullDistance = Math.max(0, touchY - this.startY);
            
            if (this.pullDistance > 0) {
                this.isPulling = true;
                this.updateIndicator();
            }
        }, { passive: true });
        
        document.addEventListener('touchend', () => {
            if (this.isPulling && this.pullDistance >= this.threshold && !this.isRefreshing) {
                this.triggerRefresh();
            } else {
                this.reset();
            }
        });
    }
    
    /**
     * Met à jour la position de l'indicateur
     */
    updateIndicator() {
        const progress = Math.min(this.pullDistance / this.threshold, 1);
        const translateY = Math.min(this.pullDistance * 0.4, 60);
        
        this.indicator.classList.add('pulling');
        this.indicator.style.setProperty('--pull-distance', `${translateY}px`);
        this.indicator.style.opacity = progress;
        
        // Rotation du spinner selon la progression
        const spinner = this.indicator.querySelector('.pull-to-refresh-spinner');
        if (spinner) {
            spinner.style.transform = `rotate(${progress * 360}deg)`;
        }
    }
    
    /**
     * Déclenche le refresh
     */
    async triggerRefresh() {
        this.isRefreshing = true;
        this.indicator.classList.add('refreshing');
        this.indicator.classList.remove('pulling');
        
        // Vibration
        if ('vibrate' in navigator) {
            navigator.vibrate(20);
        }
        
        try {
            await this.onRefresh();
        } catch (error) {
            console.error('Erreur lors du refresh:', error);
        } finally {
            setTimeout(() => {
                this.reset();
            }, 500);
        }
    }
    
    /**
     * Reset l'état
     */
    reset() {
        this.isPulling = false;
        this.isRefreshing = false;
        this.pullDistance = 0;
        
        this.indicator.classList.remove('pulling', 'refreshing');
        this.indicator.style.opacity = '0';
        this.indicator.style.setProperty('--pull-distance', '0px');
        
        const spinner = this.indicator.querySelector('.pull-to-refresh-spinner');
        if (spinner) {
            spinner.style.transform = 'rotate(0deg)';
        }
    }
    
    /**
     * Détruit l'instance
     */
    destroy() {
        if (this.indicator) {
            this.indicator.remove();
        }
    }
}

console.log('✅ Module Pull to Refresh chargé');

