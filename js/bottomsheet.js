/* ============================================
   BOTTOM SHEET - Modal qui monte du bas (mobile)
   ============================================ */

class BottomSheet {
    constructor(options = {}) {
        this.options = {
            title: '',
            content: '',
            showHandle: true,
            closeOnBackdropClick: true,
            closeOnSwipeDown: true,
            ...options
        };
        
        this.sheet = null;
        this.backdrop = null;
        this.isOpen = false;
        this.startY = 0;
        this.currentY = 0;
        
        this.create();
    }
    
    /**
     * Crée les éléments du bottom sheet
     */
    create() {
        // Backdrop
        this.backdrop = document.createElement('div');
        this.backdrop.className = 'modal-backdrop hidden';
        
        // Sheet
        this.sheet = document.createElement('div');
        this.sheet.className = 'bottom-sheet hidden';
        
        let html = '';
        
        // Handle
        if (this.options.showHandle) {
            html += '<div class="bottom-sheet-handle"></div>';
        }
        
        // Header
        if (this.options.title) {
            html += `
                <div class="bottom-sheet-header">
                    <h3 class="modal-title">${this.options.title}</h3>
                </div>
            `;
        }
        
        // Body
        html += `<div class="bottom-sheet-body">${this.options.content}</div>`;
        
        this.sheet.innerHTML = html;
        
        // Events
        this.setupEvents();
    }
    
    /**
     * Configure les événements
     */
    setupEvents() {
        // Clic sur backdrop
        if (this.options.closeOnBackdropClick) {
            this.backdrop.addEventListener('click', () => this.close());
        }
        
        // Swipe down pour fermer
        if (this.options.closeOnSwipeDown) {
            const handle = this.sheet.querySelector('.bottom-sheet-handle');
            if (handle) {
                this.setupSwipeDown(handle);
            }
        }
    }
    
    /**
     * Configure le swipe down
     */
    setupSwipeDown(handle) {
        let startY = 0;
        let isDragging = false;
        
        handle.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            isDragging = true;
            this.sheet.style.transition = 'none';
        }, { passive: true });
        
        handle.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            const currentY = e.touches[0].clientY;
            const deltaY = currentY - startY;
            
            if (deltaY > 0) { // Swipe vers le bas uniquement
                this.sheet.style.transform = `translateY(${deltaY}px)`;
            }
        }, { passive: true });
        
        handle.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            
            const endY = e.changedTouches[0].clientY;
            const deltaY = endY - startY;
            
            isDragging = false;
            this.sheet.style.transition = '';
            
            if (deltaY > 100) { // Seuil de fermeture
                this.close();
            } else {
                this.sheet.style.transform = '';
            }
        });
    }
    
    /**
     * Ouvre le bottom sheet
     */
    open() {
        if (this.isOpen) return;
        
        // Ajouter au DOM
        document.body.appendChild(this.backdrop);
        document.body.appendChild(this.sheet);
        
        // Forcer un reflow
        void this.sheet.offsetHeight;
        
        // Afficher
        this.backdrop.classList.remove('hidden');
        this.sheet.classList.remove('hidden');
        
        // Empêcher le scroll du body
        document.body.style.overflow = 'hidden';
        
        this.isOpen = true;
        
        // Haptic
        Haptic.light();
    }
    
    /**
     * Ferme le bottom sheet
     */
    close() {
        if (!this.isOpen) return;
        
        this.sheet.classList.add('closing');
        
        setTimeout(() => {
            this.backdrop.classList.add('hidden');
            this.sheet.classList.add('hidden');
            this.sheet.classList.remove('closing');
            
            // Réactiver le scroll
            document.body.style.overflow = '';
            
            // Retirer du DOM
            this.backdrop.remove();
            this.sheet.remove();
            
            this.isOpen = false;
            
            // Haptic
            Haptic.light();
        }, 300);
    }
    
    /**
     * Met à jour le contenu
     */
    setContent(content) {
        const body = this.sheet.querySelector('.bottom-sheet-body');
        if (body) {
            body.innerHTML = content;
        }
    }
    
    /**
     * Met à jour le titre
     */
    setTitle(title) {
        const titleElement = this.sheet.querySelector('.modal-title');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }
    
    /**
     * Détruit l'instance
     */
    destroy() {
        this.close();
    }
}

console.log('✅ Module Bottom Sheet chargé');

