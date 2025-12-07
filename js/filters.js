/* ============================================
   PERSISTENT FILTERS - Mémorisation des filtres
   ============================================ */

const PersistentFilters = {
    STORAGE_KEY: 'order-filters',
    
    /**
     * Sauvegarde les filtres actuels
     * @param {Object} filters - {status: string, search: string, sort: string}
     */
    save(filters) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filters));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des filtres:', error);
        }
    },
    
    /**
     * Charge les filtres sauvegardés
     * @returns {Object|null}
     */
    load() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch (error) {
            console.error('Erreur lors du chargement des filtres:', error);
            return null;
        }
    },
    
    /**
     * Supprime les filtres sauvegardés
     */
    clear() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
        } catch (error) {
            console.error('Erreur lors de la suppression des filtres:', error);
        }
    },
    
    /**
     * Applique les filtres sauvegardés aux éléments UI
     */
    applyToUI() {
        const filters = this.load();
        if (!filters) return;
        
        // Appliquer le statut
        if (filters.status) {
            const statusChips = document.querySelectorAll('.chip[data-state]');
            statusChips.forEach(chip => {
                if (chip.dataset.state === filters.status) {
                    chip.classList.add('chip-active');
                } else {
                    chip.classList.remove('chip-active');
                }
            });
        }
        
        // Appliquer la recherche
        if (filters.search) {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = filters.search;
            }
        }
        
        // Appliquer le tri
        if (filters.sort) {
            const sortSelect = document.getElementById('sortSelect');
            if (sortSelect) {
                sortSelect.value = filters.sort;
            }
        }
        
        return filters;
    }
};

console.log('✅ Module Filtres Persistants chargé');

