/* ============================================
   DARK MODE - Gestion du thème sombre/clair
   ============================================ */

const DarkMode = {
    STORAGE_KEY: 'theme-preference',
    
    /**
     * Initialise le dark mode
     */
    init() {
        // Charger la préférence sauvegardée ou utiliser celle du système
        const savedTheme = localStorage.getItem(this.STORAGE_KEY);
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
        this.setTheme(theme, false);
        
        // Écouter les changements de préférence système
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(this.STORAGE_KEY)) {
                this.setTheme(e.matches ? 'dark' : 'light', false);
            }
        });
    },
    
    /**
     * Change le thème
     * @param {string} theme - 'light' ou 'dark'
     * @param {boolean} save - Sauvegarder la préférence
     */
    setTheme(theme, save = true) {
        document.documentElement.setAttribute('data-theme', theme);
        
        if (save) {
            localStorage.setItem(this.STORAGE_KEY, theme);
        }
        
        // Mettre à jour l'icône du bouton
        this.updateToggleButton();
        
        // Vibration légère sur changement manuel
        if (save && 'vibrate' in navigator) {
            navigator.vibrate(10);
        }
    },
    
    /**
     * Toggle entre light et dark
     */
    toggle() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    },
    
    /**
     * Obtient le thème actuel
     * @returns {string} 'light' ou 'dark'
     */
    getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    },
    
    /**
     * Met à jour l'icône du bouton toggle
     */
    updateToggleButton() {
        const button = document.getElementById('darkModeToggle');
        if (!button) return;
        
        const icon = button.querySelector('.theme-icon');
        const theme = this.getCurrentTheme();
        
        if (icon) {
            icon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    },
    
    /**
     * Crée le bouton toggle de dark mode
     * @returns {HTMLElement}
     */
    createToggleButton() {
        const button = document.createElement('button');
        button.id = 'darkModeToggle';
        button.className = 'dark-mode-toggle';
        button.setAttribute('aria-label', 'Changer de thème');
        button.innerHTML = `
            <span class="theme-icon">${this.getCurrentTheme() === 'dark' ? '☀️' : '🌙'}</span>
        `;
        
        button.addEventListener('click', () => this.toggle());
        
        return button;
    }
};

console.log('✅ Module Dark Mode chargé');

