/* ============================================
   LONG PRESS - Menu contextuel sur appui long
   ============================================ */

class LongPress {
    constructor(element, actions, options = {}) {
        this.element = element;
        this.actions = actions; // Array d'objets {icon, label, callback, color}
        this.options = {
            duration: 500, // Durée de l'appui long
            ...options
        };
        
        this.timer = null;
        this.menu = null;
        this.isMenuOpen = false;
        
        this.init();
    }
    
    /**
     * Initialise le long press
     */
    init() {
        this.element.addEventListener('touchstart', (e) => {
            this.startLongPress(e);
        }, { passive: true });
        
        this.element.addEventListener('touchend', () => {
            this.cancelLongPress();
        });
        
        this.element.addEventListener('touchmove', () => {
            this.cancelLongPress();
        });
        
        // Pour desktop (clic droit)
        this.element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showMenu(e.clientX, e.clientY);
        });
    }
    
    /**
     * Démarre le timer de long press
     */
    startLongPress(e) {
        const touch = e.touches[0];
        const x = touch.clientX;
        const y = touch.clientY;
        
        this.timer = setTimeout(() => {
            Haptic.heavy(); // Vibration forte pour le long press
            this.showMenu(x, y);
        }, this.options.duration);
    }
    
    /**
     * Annule le long press
     */
    cancelLongPress() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
    
    /**
     * Affiche le menu contextuel
     */
    showMenu(x, y) {
        // Fermer le menu existant
        this.closeMenu();
        
        // Créer le menu
        this.menu = document.createElement('div');
        this.menu.className = 'context-menu';
        
        // Ajouter les actions
        this.actions.forEach((action, index) => {
            if (action.divider) {
                const divider = document.createElement('div');
                divider.className = 'context-menu-divider';
                this.menu.appendChild(divider);
                return;
            }
            
            const item = document.createElement('div');
            item.className = 'context-menu-item';
            if (action.danger) {
                item.classList.add('danger');
            }
            
            item.innerHTML = `
                <span class="context-menu-icon">${action.icon}</span>
                <span class="context-menu-label">${action.label}</span>
            `;
            
            item.addEventListener('click', async () => {
                Haptic.light();
                this.closeMenu();
                if (action.callback) {
                    await action.callback();
                }
            });
            
            this.menu.appendChild(item);
        });
        
        // Positionner et afficher
        document.body.appendChild(this.menu);
        this.positionMenu(x, y);
        this.isMenuOpen = true;
        
        // Fermer sur clic extérieur
        setTimeout(() => {
            document.addEventListener('click', this.handleOutsideClick.bind(this), { once: true });
        }, 100);
    }
    
    /**
     * Positionne le menu
     */
    positionMenu(x, y) {
        const menuRect = this.menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Ajuster X
        let left = x;
        if (left + menuRect.width > viewportWidth) {
            left = viewportWidth - menuRect.width - 10;
        }
        
        // Ajuster Y
        let top = y;
        if (top + menuRect.height > viewportHeight) {
            top = viewportHeight - menuRect.height - 10;
        }
        
        this.menu.style.left = `${left}px`;
        this.menu.style.top = `${top}px`;
    }
    
    /**
     * Gère le clic extérieur
     */
    handleOutsideClick(e) {
        if (this.menu && !this.menu.contains(e.target)) {
            this.closeMenu();
        }
    }
    
    /**
     * Ferme le menu
     */
    closeMenu() {
        if (this.menu) {
            this.menu.remove();
            this.menu = null;
            this.isMenuOpen = false;
        }
    }
    
    /**
     * Détruit l'instance
     */
    destroy() {
        this.cancelLongPress();
        this.closeMenu();
    }
}

/**
 * Factory pour créer facilement un long press sur une card
 */
function createCardLongPress(cardElement, order, handlers) {
    const actions = [
        {
            icon: '✏️',
            label: 'Modifier',
            callback: () => handlers.onEdit(order)
        },
        {
            icon: '📋',
            label: 'Copier les infos',
            callback: () => handlers.onCopy(order)
        },
        { divider: true },
        {
            icon: '✓',
            label: 'Marquer comme prêt',
            callback: () => handlers.onMarkReady(order)
        },
        {
            icon: '🚚',
            label: 'Marquer comme livré',
            callback: () => handlers.onMarkDelivered(order)
        },
        { divider: true },
        {
            icon: '🗑️',
            label: 'Supprimer',
            danger: true,
            callback: () => handlers.onDelete(order)
        }
    ];
    
    return new LongPress(cardElement, actions);
}

console.log('✅ Module Long Press chargé');

