/* ============================================
   MAIN - Initialisation & Event Listeners
   ============================================ */

// Debounce timer pour la recherche
let searchDebounceTimer = null;

// Instances globales
let pullToRefreshInstance = null;

/* ============================================
   INITIALISATION
   ============================================ */

/**
 * Initialise l'application au chargement du DOM
 */
function initApp() {
    console.log('🚀 Initialisation de l\'application...');
    
    // Vérifier que tous les modules sont chargés
    if (typeof API_ENDPOINTS === 'undefined') {
        console.error('❌ Module config.js non chargé');
        return;
    }
    
    if (typeof getOrders === 'undefined') {
        console.error('❌ Module api.js non chargé');
        return;
    }
    
    if (typeof validateOrderForm === 'undefined') {
        console.error('❌ Module validation.js non chargé');
        return;
    }
    
    if (typeof loadOrders === 'undefined') {
        console.error('❌ Module ui.js non chargé');
        return;
    }
    
    // 🎨 Initialiser le dark mode
    DarkMode.init();
    const darkModeToggle = DarkMode.createToggleButton();
    document.body.appendChild(darkModeToggle);
    console.log('🌙 Dark mode initialisé');
    
    // 🔄 Initialiser le pull to refresh
    pullToRefreshInstance = new PullToRefresh(async () => {
        console.log('🔄 Pull to refresh déclenché');
        await loadOrders(false); // Ne pas afficher les skeletons sur refresh
        showToast('✅ Commandes actualisées', 'success');
    });
    console.log('🔄 Pull to refresh initialisé');
    
    // 📱 Ajouter le haptic feedback aux boutons
    initHapticFeedback();
    
    // 💾 Charger les filtres persistants
    const savedFilters = PersistentFilters.load();
    if (savedFilters) {
        console.log('💾 Filtres sauvegardés chargés:', savedFilters);
        if (savedFilters.status) currentFilter = savedFilters.status;
        if (savedFilters.search) searchQuery = savedFilters.search;
        if (savedFilters.sort) {
            // Compatibilité avec l'ancien format (asc/desc)
            if (savedFilters.sort === 'asc' || savedFilters.sort === 'desc') {
                currentSort = `date-${savedFilters.sort}`;
            } else {
                currentSort = savedFilters.sort;
            }
        }
    } else {
        // Si aucun filtre sauvegardé, activer "En préparation" par défaut
        currentFilter = 'En préparation';
        currentSort = 'date-asc'; // Tri par défaut : date croissante
        console.log('🔧 Filtre par défaut activé: En préparation');
    }
    
    // Initialiser les event listeners
    initEventListeners();
    
    // Initialiser le menu mobile
    setupMobileMenu();
    
    // Appliquer les filtres sauvegardés à l'UI ou activer le filtre par défaut
    if (savedFilters) {
        PersistentFilters.applyToUI();
    } else {
        // Activer visuellement le chip "En préparation"
        activateFilterChip('En préparation');
    }
    
    // Initialiser l'affichage du bouton de tri
    updateSortButton();
    
    // Charger les commandes initiales avec skeleton loaders
    loadOrders(true);
    
    console.log('✅ Application initialisée avec succès');
}

/**
 * Ajoute le haptic feedback aux boutons
 */
function initHapticFeedback() {
    // Haptic feedback contextuels selon le type de bouton
    document.addEventListener('click', (e) => {
        // Bouton de suppression - vibration forte et distinctive
        if (e.target.closest('.btn-delete, .btn-danger')) {
            Haptic.heavy();
            return;
        }
        
        // Bouton principal (changement d'état, validation)
        if (e.target.closest('.btn-primary, .btn-change-state')) {
            Haptic.medium();
            return;
        }
        
        // FAB (nouvelle commande) - vibration moyenne
        if (e.target.closest('.fab')) {
            Haptic.medium();
            return;
        }
        
        // Chips (filtres) - vibration légère mais perceptible
        if (e.target.closest('.chip')) {
            Haptic.light();
            return;
        }
        
        // Autres boutons - vibration légère
        if (e.target.closest('.btn')) {
            Haptic.light();
        }
    }, { passive: true });
    
    console.log('📳 Haptic feedback initialisé (intensité améliorée)');
}

/**
 * Initialise tous les event listeners
 */
function initEventListeners() {
    console.log('🎯 Initialisation des event listeners...');
    
    // === FAB (Floating Action Button) ===
    const btnNewOrder = document.getElementById('btnNewOrder');
    if (btnNewOrder) {
        btnNewOrder.addEventListener('click', () => {
            console.log('🆕 Clic sur Nouvelle Commande');
            openModalCreate();
        });
    }
    
    // === MODAL ===
    const modal = document.getElementById('modal');
    const modalClose = document.getElementById('modalClose');
    const modalCancel = document.getElementById('modalCancel');
    const modalBackdrop = modal?.querySelector('.modal-backdrop');
    const orderForm = document.getElementById('orderForm');
    
    // Fermer le modal
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    
    if (modalCancel) {
        modalCancel.addEventListener('click', closeModal);
    }
    
    // Fermer en cliquant sur le backdrop
    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', closeModal);
    }
    
    // Fermer avec ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });
    
    // Soumission du formulaire
    if (orderForm) {
        orderForm.addEventListener('submit', handleFormSubmit);
    }
    
    // === MODAL DE CONFIRMATION SUPPRESSION ===
    const modalConfirmDelete = document.getElementById('modalConfirmDelete');
    const btnCancelDelete = document.getElementById('btnCancelDelete');
    const btnConfirmDelete = document.getElementById('btnConfirmDelete');
    const modalBackdropDelete = modalConfirmDelete?.querySelector('.modal-backdrop');
    
    // Fermer le modal de suppression
    if (btnCancelDelete) {
        btnCancelDelete.addEventListener('click', closeDeleteModal);
    }
    
    // Confirmer la suppression
    if (btnConfirmDelete) {
        btnConfirmDelete.addEventListener('click', confirmDeleteOrder);
    }
    
    // Fermer en cliquant sur le backdrop
    if (modalBackdropDelete) {
        modalBackdropDelete.addEventListener('click', closeDeleteModal);
    }
    
    // Fermer avec ESC (déjà géré globalement, mais spécifique pour ce modal)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalConfirmDelete && !modalConfirmDelete.classList.contains('hidden')) {
            closeDeleteModal();
        }
    });
    
    // === RECHERCHE ===
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    
    if (searchInput) {
        // Input avec debounce
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value;
            
            // Afficher/masquer le bouton clear
            if (searchClear) {
                if (query.length > 0) {
                    searchClear.classList.remove('hidden');
                } else {
                    searchClear.classList.add('hidden');
                }
            }
            
            // Debounce pour éviter trop de rerenders
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                handleSearch(query);
            }, UI_CONFIG.SEARCH_DEBOUNCE);
        });
    }
    
    if (searchClear) {
        searchClear.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
                searchClear.classList.add('hidden');
                handleSearch('');
            }
        });
    }
    
    // === FILTRES (CHIPS) ===
    const filterChips = document.querySelectorAll('.filters-chips .chip');
    
    filterChips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            const filter = e.currentTarget.getAttribute('data-filter');
            handleFilterChange(filter, e.currentTarget);
        });
    });
    
    // === ACTIONS BAR ===
    const btnSort = document.getElementById('btnSort');
    const sortMenu = document.getElementById('sortMenu');
    const btnRefresh = document.getElementById('btnRefresh');
    
    // Menu déroulant de tri
    if (btnSort && sortMenu) {
        // Ouvrir/fermer le menu
        btnSort.addEventListener('click', (e) => {
            e.stopPropagation();
            const isExpanded = btnSort.getAttribute('aria-expanded') === 'true';
            btnSort.setAttribute('aria-expanded', !isExpanded);
            sortMenu.classList.toggle('hidden');
            
            if (typeof Haptic !== 'undefined') Haptic.light();
        });
        
        // Gérer les clics sur les options du menu
        const sortMenuItems = sortMenu.querySelectorAll('.sort-menu-item');
        sortMenuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const sortType = item.getAttribute('data-sort');
                handleSortChange(sortType);
                sortMenu.classList.add('hidden');
                btnSort.setAttribute('aria-expanded', 'false');
                
                if (typeof Haptic !== 'undefined') Haptic.medium();
            });
        });
        
        // Fermer le menu si on clique ailleurs
        document.addEventListener('click', (e) => {
            if (!btnSort.contains(e.target) && !sortMenu.contains(e.target)) {
                sortMenu.classList.add('hidden');
                btnSort.setAttribute('aria-expanded', 'false');
            }
        });
        
        // Initialiser l'affichage du bouton
        updateSortButton();
    }
    
    if (btnRefresh) {
        btnRefresh.addEventListener('click', handleRefresh);
    }
    
    // === VALIDATION EN TEMPS RÉEL ===
    const formInputs = document.querySelectorAll('.form-input, .form-select');
    
    formInputs.forEach(input => {
        // Validation au blur (perte de focus)
        input.addEventListener('blur', (e) => {
            validateSingleField(e.target);
        });
        
        // Effacer l'erreur au focus
        input.addEventListener('focus', (e) => {
            clearSingleFieldError(e.target);
        });
    });
    
    // === FORMATAGE AUTOMATIQUE DU TÉLÉPHONE ===
    const inputTelephone = document.getElementById('inputTelephone');
    if (inputTelephone) {
        inputTelephone.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\s/g, ''); // Retirer espaces
            
            // Limiter à 10 chiffres
            if (value.length > 10) {
                value = value.substring(0, 10);
            }
            
            // Ajouter des espaces tous les 2 chiffres
            if (value.length >= 2) {
                value = value.match(/.{1,2}/g).join(' ');
            }
            
            e.target.value = value;
        });
    }
    
    console.log('✅ Event listeners initialisés');
}

/**
 * Configure le menu mobile (hamburger)
 */
function setupMobileMenu() {
    const menuToggle = document.getElementById('mobileMenuToggle');
    const menuClose = document.getElementById('mobileMenuClose');
    const menu = document.getElementById('mobileMenu');
    const menuOverlay = document.getElementById('mobileMenuOverlay');
    
    if (!menuToggle || !menu || !menuClose) {
        console.warn('⚠️ Éléments du menu mobile introuvables');
        return;
    }
    
    // Ouvrir le menu
    menuToggle.addEventListener('click', () => {
        openMobileMenu();
        if (typeof Haptic !== 'undefined') Haptic.medium();
    });
    
    // Fermer le menu
    menuClose.addEventListener('click', () => {
        closeMobileMenu();
        if (typeof Haptic !== 'undefined') Haptic.light();
    });
    
    // Fermer en cliquant sur l'overlay
    if (menuOverlay) {
        menuOverlay.addEventListener('click', () => {
            closeMobileMenu();
        });
    }
    
    // Fermer avec la touche Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menu.getAttribute('aria-hidden') === 'false') {
            closeMobileMenu();
        }
    });
}

/**
 * Ouvre le menu mobile
 */
function openMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    const menuToggle = document.getElementById('mobileMenuToggle');
    
    if (menu && menuToggle) {
        menu.setAttribute('aria-hidden', 'false');
        menuToggle.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden'; // Empêcher le scroll du body
    }
}

/**
 * Ferme le menu mobile
 */
function closeMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    const menuToggle = document.getElementById('mobileMenuToggle');
    
    if (menu && menuToggle) {
        menu.setAttribute('aria-hidden', 'true');
        menuToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = ''; // Réactiver le scroll
    }
}

// Exposer globalement pour les liens onclick
window.closeMobileMenu = closeMobileMenu;

/* ============================================
   HANDLERS
   ============================================ */

/**
 * Active visuellement un chip de filtre
 * @param {string} filter - Filtre à activer
 */
function activateFilterChip(filter) {
    const allChips = document.querySelectorAll('.filters-chips .chip');
    allChips.forEach(chip => {
        const chipFilter = chip.getAttribute('data-filter');
        if (chipFilter === filter) {
            chip.classList.add('chip-active');
            chip.setAttribute('aria-pressed', 'true');
        } else {
            chip.classList.remove('chip-active');
            chip.setAttribute('aria-pressed', 'false');
        }
    });
}

/**
 * Gère le changement de filtre
 * @param {string} filter - Filtre sélectionné
 * @param {HTMLElement} chipElement - Élément chip cliqué
 */
function handleFilterChange(filter, chipElement) {
    console.log(`🔍 Filtre changé: ${filter}`);
    
    // Mettre à jour l'état actif des chips
    const allChips = document.querySelectorAll('.filters-chips .chip');
    allChips.forEach(chip => {
        chip.classList.remove('chip-active');
        chip.setAttribute('aria-pressed', 'false');
    });
    
    chipElement.classList.add('chip-active');
    chipElement.setAttribute('aria-pressed', 'true');
    
    // Appliquer le filtre
    currentFilter = filter;
    applyFiltersAndSort();
    renderOrders();
}

/**
 * Gère la recherche
 * @param {string} query - Terme de recherche
 */
function handleSearch(query) {
    console.log(`🔍 Recherche: "${query}"`);
    
    searchQuery = query;
    applyFiltersAndSort();
    renderOrders();
}

/**
 * Met à jour l'affichage du bouton de tri
 */
function updateSortButton() {
    const btnSort = document.getElementById('btnSort');
    const sortIcon = document.getElementById('sortIcon');
    const sortText = document.getElementById('sortText');
    const sortMenu = document.getElementById('sortMenu');
    
    if (!btnSort || !sortIcon || !sortText) return;
    
    // Mettre à jour l'icône et le texte selon le tri actuel
    let icon = '📅↑';
    let text = 'Trier';
    
    if (currentSort === 'date-asc') {
        icon = '📅↑';
        text = 'Date ↑';
    } else if (currentSort === 'date-desc') {
        icon = '📅↓';
        text = 'Date ↓';
    } else if (currentSort === 'name-asc') {
        icon = '👤 A-Z';
        text = 'Nom A-Z';
    } else if (currentSort === 'name-desc') {
        icon = '👤 Z-A';
        text = 'Nom Z-A';
    }
    
    sortIcon.textContent = icon;
    sortText.textContent = text;
    
    // Mettre à jour les checkmarks dans le menu
    if (sortMenu) {
        const menuItems = sortMenu.querySelectorAll('.sort-menu-item');
        menuItems.forEach(item => {
            const check = item.querySelector('.sort-menu-check');
            if (item.getAttribute('data-sort') === currentSort) {
                item.classList.add('active');
                if (check) check.style.display = 'inline';
            } else {
                item.classList.remove('active');
                if (check) check.style.display = 'none';
            }
        });
    }
}

/**
 * Gère le changement de tri
 * @param {string} sortType - Type de tri (date-asc, date-desc, name-asc, name-desc)
 */
function handleSortChange(sortType) {
    currentSort = sortType;
    
    console.log(`🔄 Tri changé: ${sortType}`);
    
    updateSortButton();
    applyFiltersAndSort();
    renderOrders();
}

/**
 * Gère le tri (toggle asc/desc) - Fonction legacy pour compatibilité
 */
function handleSort() {
    // Si c'est un tri par date, basculer entre asc et desc
    if (currentSort.startsWith('date-')) {
        currentSort = currentSort === 'date-asc' ? 'date-desc' : 'date-asc';
    } else {
        // Sinon, passer à date-asc par défaut
        currentSort = 'date-asc';
    }
    
    handleSortChange(currentSort);
}

/**
 * Gère le rafraîchissement
 */
async function handleRefresh() {
    console.log('🔄 Rafraîchissement manuel...');
    
    const btnRefresh = document.getElementById('btnRefresh');
    if (btnRefresh) {
        btnRefresh.disabled = true;
        btnRefresh.innerHTML = '<span aria-hidden="true">⏳</span><span>Actualisation...</span>';
    }
    
    try {
        await loadOrders();
        showToast('Liste actualisée !', 'success');
    } catch (error) {
        showToast('Erreur lors de l\'actualisation', 'error');
    } finally {
        if (btnRefresh) {
            btnRefresh.disabled = false;
            btnRefresh.innerHTML = '<span aria-hidden="true">🔄</span><span>Actualiser</span>';
        }
    }
}

/* ============================================
   VALIDATION EN TEMPS RÉEL
   ============================================ */

/**
 * Valide un seul champ au blur
 * @param {HTMLInputElement} input - Champ à valider
 */
function validateSingleField(input) {
    const name = input.name;
    const value = input.value;
    
    let result = { valid: true, error: '' };
    
    // Valider selon le champ
    switch (name) {
        case 'prenom':
            result = validatePrenom(value);
            break;
        case 'nom':
            result = validateNom(value);
            break;
        case 'email':
            result = validateEmail(value);
            break;
        case 'telephone':
            result = validateTelephone(value);
            break;
        case 'nombrePaniers':
            result = validateNombrePaniers(value);
            break;
        case 'dateRecuperation':
            result = validateDateRecuperation(value);
            break;
        case 'etat':
            result = validateEtat(value);
            break;
    }
    
    // Afficher l'erreur ou la validation
    const errorSpanId = `error${name.charAt(0).toUpperCase() + name.slice(1)}`;
    const errorSpan = document.getElementById(errorSpanId);
    
    if (!result.valid) {
        input.classList.add('error');
        input.classList.remove('success');
        if (errorSpan) {
            errorSpan.textContent = result.error;
        }
    } else {
        input.classList.remove('error');
        input.classList.add('success');
        if (errorSpan) {
            errorSpan.textContent = '';
        }
    }
}

/**
 * Efface l'erreur d'un seul champ
 * @param {HTMLInputElement} input - Champ concerné
 */
function clearSingleFieldError(input) {
    const name = input.name;
    const errorSpanId = `error${name.charAt(0).toUpperCase() + name.slice(1)}`;
    const errorSpan = document.getElementById(errorSpanId);
    
    input.classList.remove('error');
    if (errorSpan) {
        errorSpan.textContent = '';
    }
}

/* ============================================
   DIAGNOSTIC & DEBUG
   ============================================ */

/**
 * Fonction de test disponible dans la console
 */
window.testApp = function() {
    console.log('🧪 Test de l\'application');
    console.log('========================');
    console.log('API Endpoints:', API_ENDPOINTS);
    console.log('Orders States:', ORDER_STATES);
    console.log('All Orders:', allOrders.length);
    console.log('Filtered Orders:', filteredOrders.length);
    console.log('Current Filter:', currentFilter);
    console.log('Current Sort:', currentSort);
    console.log('Search Query:', searchQuery);
    console.log('========================');
    console.log('✅ Test terminé');
};

/**
 * Test de connectivité API
 */
window.testAPI = async function() {
    console.log('🧪 Test de l\'API...');
    
    try {
        console.log('📡 Appel GET /webhook/orders');
        const orders = await getOrders();
        console.log(`✅ ${orders.length} commande(s) récupérée(s)`);
        console.log('Première commande:', orders[0]);
        
        return orders;
    } catch (error) {
        console.error('❌ Erreur API:', error);
    }
};

/**
 * Vider le cache et recharger
 */
window.clearCacheAndReload = function() {
    console.log('🗑️ Vidage du cache...');
    clearCache();
    console.log('🔄 Rechargement...');
    loadOrders();
};

/* ============================================
   DÉMARRAGE
   ============================================ */

// Attendre que le DOM soit chargé
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // DOM déjà chargé
    initApp();
}

// Exposer les fonctions utiles pour le debugging
window.toggleDarkMode = () => DarkMode.toggle();
window.triggerHaptic = (type = 'medium') => Haptic[type]();

// Log de bienvenue
console.log('%c🍎 Paniers Fruits - Gestion Commandes', 'color: #4CAF50; font-size: 20px; font-weight: bold;');
console.log('%cVersion 2.0 - Mobile-First Enhanced', 'color: #666; font-size: 12px;');
console.log('%c✨ Nouvelles fonctionnalités:', 'color: #FF9800; font-weight: bold;');
console.log('  🌙 Dark Mode | 🔄 Pull to Refresh | 📳 Haptic Feedback');
console.log('  💾 Filtres Persistants | ⚡ Skeleton Loaders | 🎨 Animations');
console.log('%cFonctions disponibles dans la console:', 'color: #2196F3; font-weight: bold;');
console.log('  • testApp() - Affiche l\'état de l\'application');
console.log('  • testAPI() - Teste la connexion à l\'API');
console.log('  • clearCacheAndReload() - Vide le cache et recharge');
console.log('  • loadOrders() - Recharge les commandes');
console.log('  • openModalCreate() - Ouvre le modal de création');
console.log('  • toggleDarkMode() - Toggle le dark mode');
console.log('  • triggerHaptic(type) - Test vibration (light/medium/heavy/success/error)');

