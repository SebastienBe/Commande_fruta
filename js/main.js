/* ============================================
   MAIN - Initialisation & Event Listeners
   ============================================ */

// Debounce timer pour la recherche
let searchDebounceTimer = null;

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
    
    // Initialiser les event listeners
    initEventListeners();
    
    // Charger les commandes initiales
    loadOrders();
    
    console.log('✅ Application initialisée avec succès');
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
    const btnRefresh = document.getElementById('btnRefresh');
    
    if (btnSort) {
        btnSort.addEventListener('click', handleSort);
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

/* ============================================
   HANDLERS
   ============================================ */

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
 * Gère le tri (toggle asc/desc)
 */
function handleSort() {
    currentSort = currentSort === 'asc' ? 'desc' : 'asc';
    
    const btnSort = document.getElementById('btnSort');
    if (btnSort) {
        const icon = currentSort === 'asc' ? '📅↑' : '📅↓';
        btnSort.innerHTML = `<span aria-hidden="true">${icon}</span><span>Trier</span>`;
    }
    
    console.log(`🔄 Tri changé: ${currentSort}`);
    
    applyFiltersAndSort();
    renderOrders();
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

// Log de bienvenue
console.log('%c🍎 Paniers Fruits - Gestion Commandes', 'color: #4CAF50; font-size: 20px; font-weight: bold;');
console.log('%cVersion 1.0 - Mobile-First', 'color: #666; font-size: 12px;');
console.log('%cFonctions disponibles dans la console:', 'color: #2196F3; font-weight: bold;');
console.log('  • testApp() - Affiche l\'état de l\'application');
console.log('  • testAPI() - Teste la connexion à l\'API');
console.log('  • clearCacheAndReload() - Vide le cache et recharge');
console.log('  • loadOrders() - Recharge les commandes');
console.log('  • openModalCreate() - Ouvre le modal de création');

