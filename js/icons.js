/* ============================================
   ICONS SVG - Bibliothèque d'icônes flat design
   ============================================ */

const Icons = {
    /**
     * Retourne le SVG d'une icône
     * @param {string} name - Nom de l'icône
     * @param {string} className - Classes CSS additionnelles
     * @returns {string} - HTML SVG
     */
    get(name, className = '') {
        const icon = this.library[name];
        if (!icon) {
            console.warn(`Icône "${name}" non trouvée`);
            return '';
        }
        return icon.replace('{{class}}', className);
    },
    
    /**
     * Bibliothèque d'icônes SVG
     */
    library: {
        // Fruits & Food
        basket: `<svg class="icon {{class}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 9H21M3 9L5 19H19L21 9M3 9L5 4H19L21 9M9 13V16M15 13V16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="9" cy="6" r="1" fill="currentColor"/>
            <circle cx="12" cy="5" r="1" fill="currentColor"/>
            <circle cx="15" cy="6" r="1" fill="currentColor"/>
        </svg>`,
        
        apple: `<svg class="icon {{class}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3C8 3 5 6 5 10C5 14 8 21 12 21C16 21 19 14 19 10C19 6 16 3 12 3Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            <path d="M12 3V2M12 2C11 2 10 2.5 9.5 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M10 7C10 7 11 9 13 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>`,
        
        // User & Contact
        user: `<svg class="icon {{class}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2"/>
            <path d="M6 21C6 17.6863 8.68629 15 12 15C15.3137 15 18 17.6863 18 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>`,
        
        users: `<svg class="icon {{class}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="9" cy="7" r="3" stroke="currentColor" stroke-width="2"/>
            <path d="M3 21C3 17.6863 5.68629 15 9 15C12.3137 15 15 17.6863 15 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M16 11C17.6569 11 19 9.65685 19 8C19 6.34315 17.6569 5 16 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M18 15C20.2091 15 22 16.7909 22 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>`,
        
        email: `<svg class="icon {{class}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="2"/>
            <path d="M3 7L12 13L21 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
        
        phone: `<svg class="icon {{class}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 5C3 3.89543 3.89543 3 5 3H8.27924C8.70967 3 9.09181 3.27543 9.22792 3.68377L10.7257 8.17721C10.8831 8.64932 10.6694 9.16531 10.2243 9.38787L7.96701 10.5165C9.06925 12.9612 11.0388 14.9308 13.4835 16.033L14.6121 13.7757C14.8347 13.3306 15.3507 13.1169 15.8228 13.2743L20.3162 14.7721C20.7246 14.9082 21 15.2903 21 15.7208V19C21 20.1046 20.1046 21 19 21H18C9.71573 21 3 14.2843 3 6V5Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        </svg>`,
        
        // Calendar & Time
        calendar: `<svg class="icon {{class}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="6" width="18" height="15" rx="2" stroke="currentColor" stroke-width="2"/>
            <path d="M3 10H21M8 3V6M16 3V6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <circle cx="8" cy="14" r="1" fill="currentColor"/>
            <circle cx="12" cy="14" r="1" fill="currentColor"/>
            <circle cx="16" cy="14" r="1" fill="currentColor"/>
        </svg>`,
        
        clock: `<svg class="icon {{class}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
            <path d="M12 7V12L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>`,
        
        // Actions
        edit: `<svg class="icon {{class}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 4H4C2.89543 4 2 4.89543 2 6V20C2 21.1046 2.89543 22 4 22H18C19.1046 22 20 21.1046 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M18.5 2.50023C19.3284 1.67181 20.6716 1.67181 21.5 2.50023C22.3284 3.32865 22.3284 4.67188 21.5 5.5003L12 15.0003L8 16.0003L9 12.0003L18.5 2.50023Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
        
        delete: `<svg class="icon {{class}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6H21M5 6V20C5 21.1046 5.89543 22 7 22H17C18.1046 22 19 21.1046 19 20V6M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M10 11V17M14 11V17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>`,
        
        plus: `<svg class="icon {{class}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>`,
        
        check: `<svg class="icon {{class}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
        
        close: `<svg class="icon {{class}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>`,
        
        // Navigation
        search: `<svg class="icon {{class}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/>
            <path d="M16 16L21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>`,
        
        filter: `<svg class="icon {{class}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 6H20M6 12H18M9 18H15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>`,
        
        sort: `<svg class="icon {{class}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 6L8 18M8 18L4 14M8 18L12 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M16 18L16 6M16 6L20 10M16 6L12 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
        
        refresh: `<svg class="icon {{class}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 2V8M21 8H15M21 8L18 5C16.5 3.5 14.5 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
        
        // Status
        pending: `<svg class="icon {{class}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
            <path d="M12 7V12L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>`,
        
        ready: `<svg class="icon {{class}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
            <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
        
        delivered: `<svg class="icon {{class}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 3H1.5L3 11H21L22 6H6M3 11L4 16H20L21 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="7" cy="20" r="2" stroke="currentColor" stroke-width="2"/>
            <circle cx="17" cy="20" r="2" stroke="currentColor" stroke-width="2"/>
        </svg>`,
        
        // Theme
        sun: `<svg class="icon {{class}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/>
            <path d="M12 2V4M12 20V22M22 12H20M4 12H2M19.07 4.93L17.66 6.34M6.34 17.66L4.93 19.07M19.07 19.07L17.66 17.66M6.34 6.34L4.93 4.93" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>`,
        
        moon: `<svg class="icon {{class}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
        
        // Alert
        info: `<svg class="icon {{class}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
            <path d="M12 16V12M12 8H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>`,
        
        warning: `<svg class="icon {{class}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 20H22L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            <path d="M12 9V13M12 17H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>`,
        
        error: `<svg class="icon {{class}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
            <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>`,
        
        success: `<svg class="icon {{class}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
            <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
        
        // Numbers
        hash: `<svg class="icon {{class}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 8H20M4 16H20M9 3L7 21M17 3L15 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>`,
        
        // Loader
        loader: `<svg class="icon icon-spin {{class}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2V6M12 18V22M6 12H2M22 12H18M19.07 19.07L16.24 16.24M19.07 4.93L16.24 7.76M4.93 19.07L7.76 16.24M4.93 4.93L7.76 7.76" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>`,
    }
};

console.log('✅ Module Icons SVG chargé');

