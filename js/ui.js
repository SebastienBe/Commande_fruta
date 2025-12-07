/* ============================================
   UI - Manipulation DOM & Rendu
   ============================================ */

// Variables globales pour le state
let allOrders = [];
let filteredOrders = [];
let currentFilter = 'all';
let currentSort = 'asc'; // asc ou desc
let searchQuery = '';
let isEditMode = false;

/* ============================================
   CHARGEMENT ET AFFICHAGE DES COMMANDES
   ============================================ */

/**
 * Charge toutes les commandes depuis l'API
 */
async function loadOrders() {
    console.log('🔄 Chargement des commandes...');
    
    showLoader(true);
    hideEmptyState();
    
    try {
        const rawOrders = await getOrders();
        
        // ✅ FILTRE : Ignorer les commandes corrompues (sans Prenom/Nom)
        allOrders = rawOrders.filter(order => {
            const prenom = order.Prenom || order.prenom;
            const nom = order.Nom || order.nom;
            
            // Si Prenom ET Nom sont vides/null, ignorer la commande
            if (!prenom && !nom) {
                console.warn('⚠️ Commande corrompue ignorée (ID:', order.id, ')');
                return false;
            }
            
            return true;
        });
        
        console.log(`🧹 ${rawOrders.length - allOrders.length} commande(s) corrompue(s) filtrée(s)`);
        console.log(`✅ ${allOrders.length} commande(s) valide(s) conservée(s)`);
        
        // Appliquer les filtres et tris
        applyFiltersAndSort();
        
        // Afficher les commandes
        renderOrders();
        
        // Mettre à jour les statistiques
        updateStats();
        
        // Mettre à jour les compteurs des chips
        updateChipCounts();
        
        showLoader(false);
        
        if (allOrders.length === 0) {
            showEmptyState('Aucune commande', 'Il n\'y a pas encore de commande. Créez-en une pour commencer !');
        }
        
    } catch (error) {
        console.error('❌ Erreur chargement:', error);
        showLoader(false);
        showEmptyState('Erreur de chargement', error.message);
        showToast(ERROR_MESSAGES.LOAD_ERROR, 'error');
    }
}

/**
 * Applique les filtres et le tri aux commandes
 */
function applyFiltersAndSort() {
    // 1. Filtrer par état
    if (currentFilter === 'all') {
        filteredOrders = [...allOrders];
    } else {
        filteredOrders = allOrders.filter(order => {
            const etat = order.etat || order.Etat || order.status || '';
            return etat === currentFilter;
        });
    }
    
    // 2. Filtrer par recherche
    if (searchQuery.trim().length >= 2) {
        const query = searchQuery.toLowerCase();
        filteredOrders = filteredOrders.filter(order => {
            const prenom = (order.Prenom || order.prenom || '').toLowerCase();
            const nom = (order.Nom || order.nom || '').toLowerCase();
            const email = (order.Email || order.email || '').toLowerCase();
            const telephone = (order.Telephone || order.telephone || '').toLowerCase();
            
            return prenom.includes(query) || 
                   nom.includes(query) || 
                   email.includes(query) || 
                   telephone.includes(query);
        });
    }
    
    // 3. Trier par date de récupération
    filteredOrders.sort((a, b) => {
        const dateA = parseDateDDMMYYYY(a.Date_Recuperation || a.date_recuperation || '');
        const dateB = parseDateDDMMYYYY(b.Date_Recuperation || b.date_recuperation || '');
        
        if (currentSort === 'asc') {
            return dateA - dateB;
        } else {
            return dateB - dateA;
        }
    });
    
    console.log(`📊 Filtres appliqués: ${filteredOrders.length}/${allOrders.length} commandes`);
}

/**
 * Affiche toutes les commandes filtrées
 */
function renderOrders() {
    const container = document.getElementById('ordersGrid');
    
    if (!container) {
        console.error('❌ Container #ordersGrid introuvable');
        return;
    }
    
    // Vider le container
    container.innerHTML = '';
    
    if (filteredOrders.length === 0) {
        if (searchQuery.trim().length >= 2) {
            showEmptyState('Aucun résultat', `Aucune commande ne correspond à "${searchQuery}"`);
        } else if (currentFilter !== 'all') {
            showEmptyState('Aucune commande', `Aucune commande avec l'état "${currentFilter}"`);
        }
        return;
    }
    
    hideEmptyState();
    
    // Créer un fragment pour optimiser les performances
    const fragment = document.createDocumentFragment();
    
    filteredOrders.forEach(order => {
        const card = createOrderCard(order);
        fragment.appendChild(card);
    });
    
    container.appendChild(fragment);
    
    console.log(`✅ ${filteredOrders.length} commande(s) affichée(s)`);
}

/**
 * Crée une card de commande
 * @param {Object} order - Données de la commande
 * @returns {HTMLElement} - Card DOM
 */
function createOrderCard(order) {
    const card = document.createElement('article');
    card.className = 'order-card';
    card.setAttribute('role', 'listitem');
    card.setAttribute('data-order-id', order.id || order.ID);
    
    // Extraction des données avec mapping flexible
    const id = order.id || order.ID || 'N/A';
    const prenom = order.Prenom || order.prenom || '';
    const nom = order.Nom || order.nom || '';
    const email = order.Email || order.email || '';
    const telephone = formatTelephone(order.Telephone || order.telephone || '');
    const nombrePaniers = order.Nombre_Paniers || order.nombre_paniers || order.NombrePaniers || 0;
    const dateRecup = order.Date_Recuperation || order.date_recuperation || '';
    const etat = order.etat || order.Etat || order.status || ORDER_STATES.PENDING;
    
    // Classe CSS du badge selon l'état
    const badgeClass = etat === ORDER_STATES.DELIVERED ? 'badge-delivered' :
                       etat === ORDER_STATES.READY ? 'badge-ready' : 'badge-pending';
    
    // Icône selon l'état
    const stateIcon = STATE_COLORS[etat]?.icon || '📦';
    
    card.innerHTML = `
        <div class="card-header">
            <div class="card-header-left">
                <div class="card-id">#${id}</div>
                <h3 class="card-name">
                    <span class="card-name-icon">👤</span>
                    ${prenom} ${nom}
                </h3>
            </div>
            <span class="card-badge ${badgeClass}">${stateIcon} ${etat}</span>
        </div>
        
        <div class="card-body">
            <div class="card-info-item">
                <span class="card-info-icon" aria-hidden="true">📧</span>
                <span class="card-info-text">${email}</span>
            </div>
            <div class="card-info-item">
                <span class="card-info-icon" aria-hidden="true">📞</span>
                <span class="card-info-text">${telephone}</span>
            </div>
            <div class="card-info-item">
                <span class="card-info-icon" aria-hidden="true">🛒</span>
                <span class="card-info-text">${nombrePaniers} panier(s)</span>
            </div>
            <div class="card-info-item">
                <span class="card-info-icon" aria-hidden="true">📅</span>
                <span class="card-info-text">
                    <span class="card-info-label">Récupération :</span> ${dateRecup || 'N/A'}
                </span>
            </div>
        </div>
        
        <div class="card-footer">
            <button 
                type="button" 
                class="btn btn-secondary card-btn btn-edit"
                data-order-id="${id}"
                aria-label="Modifier la commande ${prenom} ${nom}"
            >
                ✏️ Modifier
            </button>
            <button 
                type="button" 
                class="btn btn-primary card-btn btn-change-state"
                data-order-id="${id}"
                data-current-state="${etat}"
                aria-label="Changer l'état de la commande"
            >
                ${getNextStateLabel(etat)}
            </button>
            <button 
                type="button" 
                class="btn btn-danger card-btn btn-delete"
                data-order-id="${id}"
                aria-label="Supprimer la commande ${prenom} ${nom}"
            >
                🗑️ Supprimer
            </button>
        </div>
    `;
    
    // Event listeners
    const btnEdit = card.querySelector('.btn-edit');
    const btnChangeState = card.querySelector('.btn-change-state');
    const btnDelete = card.querySelector('.btn-delete');
    
    btnEdit.addEventListener('click', () => handleEditOrder(order));
    btnChangeState.addEventListener('click', () => handleQuickStateChange(order));
    btnDelete.addEventListener('click', () => handleDeleteOrder(order));
    
    return card;
}

/**
 * Retourne le label du prochain état
 * @param {string} currentState - État actuel
 * @returns {string} - Label du bouton
 */
function getNextStateLabel(currentState) {
    if (currentState === ORDER_STATES.PENDING) {
        return '→ Marquer Prêt';
    } else if (currentState === ORDER_STATES.READY) {
        return '→ Marquer Livré';
    } else {
        return '✅ Livré';
    }
}

/**
 * Retourne le prochain état
 * @param {string} currentState - État actuel
 * @returns {string} - Prochain état
 */
function getNextState(currentState) {
    if (currentState === ORDER_STATES.PENDING) {
        return ORDER_STATES.READY;
    } else if (currentState === ORDER_STATES.READY) {
        return ORDER_STATES.DELIVERED;
    } else {
        return ORDER_STATES.DELIVERED; // Déjà livré
    }
}

/* ============================================
   GESTION DU MODAL
   ============================================ */

/**
 * Ouvre le modal en mode création
 */
function openModalCreate() {
    isEditMode = false;
    
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const submitText = document.getElementById('submitText');
    const form = document.getElementById('orderForm');
    const groupEtat = document.getElementById('groupEtat');
    
    if (!modal || !form) return;
    
    // Réinitialiser le formulaire
    form.reset();
    clearAllFormErrors();
    
    // Masquer le champ État (création)
    if (groupEtat) groupEtat.style.display = 'none';
    
    // Textes du modal
    if (modalTitle) modalTitle.textContent = 'Nouvelle Commande';
    if (submitText) submitText.textContent = 'Créer';
    
    // Définir la date minimale (aujourd'hui)
    const inputDate = document.getElementById('inputDateRecuperation');
    if (inputDate) {
        const today = new Date().toISOString().split('T')[0];
        inputDate.min = today;
        inputDate.value = today;
    }
    
    // Afficher le modal
    modal.classList.remove('hidden');
    
    // Focus sur le premier champ
    setTimeout(() => {
        const inputPrenom = document.getElementById('inputPrenom');
        if (inputPrenom) inputPrenom.focus();
    }, 100);
    
    console.log('✅ Modal ouvert (mode création)');
}

/**
 * Ouvre le modal en mode édition
 * @param {Object} order - Commande à éditer
 */
function openModalEdit(order) {
    isEditMode = true;
    
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const submitText = document.getElementById('submitText');
    const form = document.getElementById('orderForm');
    const groupEtat = document.getElementById('groupEtat');
    
    if (!modal || !form) return;
    
    // Pré-remplir le formulaire
    document.getElementById('orderId').value = order.id || order.ID || '';
    document.getElementById('inputPrenom').value = order.Prenom || order.prenom || '';
    document.getElementById('inputNom').value = order.Nom || order.nom || '';
    document.getElementById('inputEmail').value = order.Email || order.email || '';
    document.getElementById('inputTelephone').value = formatTelephone(order.Telephone || order.telephone || '');
    document.getElementById('inputNombrePaniers').value = order.Nombre_Paniers || order.nombre_paniers || 1;
    
    // Date de récupération (convertir DD/MM/YYYY → YYYY-MM-DD)
    const dateRecup = order.Date_Recuperation || order.date_recuperation || '';
    if (dateRecup) {
        const dateForInput = convertDateToInputFormat(dateRecup);
        document.getElementById('inputDateRecuperation').value = dateForInput;
    }
    
    // État (afficher le champ)
    if (groupEtat) {
        groupEtat.style.display = 'block';
        document.getElementById('inputEtat').value = order.etat || order.Etat || ORDER_STATES.PENDING;
    }
    
    // Textes du modal
    if (modalTitle) modalTitle.textContent = 'Modifier la Commande';
    if (submitText) submitText.textContent = 'Enregistrer';
    
    clearAllFormErrors();
    
    // Afficher le modal
    modal.classList.remove('hidden');
    
    console.log('✅ Modal ouvert (mode édition)', order);
}

/**
 * Ferme le modal
 */
function closeModal() {
    const modal = document.getElementById('modal');
    const form = document.getElementById('orderForm');
    
    if (modal) {
        modal.classList.add('hidden');
    }
    
    if (form) {
        form.reset();
        clearAllFormErrors();
    }
    
    isEditMode = false;
    
    console.log('✅ Modal fermé');
}

/* ============================================
   GESTION DES ACTIONS
   ============================================ */

/**
 * Gère le clic sur "Modifier"
 * @param {Object} order - Commande à éditer
 */
function handleEditOrder(order) {
    openModalEdit(order);
}

/**
 * Gère le changement rapide d'état
 * @param {Object} order - Commande concernée
 */
async function handleQuickStateChange(order) {
    const currentState = order.etat || order.Etat || ORDER_STATES.PENDING;
    const nextState = getNextState(currentState);
    
    // Si déjà livré, ne rien faire
    if (currentState === ORDER_STATES.DELIVERED) {
        showToast('Cette commande est déjà livrée', 'info');
        return;
    }
    
    console.log(`🔄 Changement d'état: ${currentState} → ${nextState}`);
    console.log('📦 Données complètes de la commande:', order);
    
    try {
        // ✅ CORRECTION V3 : Utiliser le MÊME FORMAT que le modal (minuscules/camelCase)
        const updateData = {
            id: order.id || order.ID,
            etat: nextState
        };
        
        // Extraire les valeurs avec les différents casings possibles
        const prenom = order.Prenom || order.prenom;
        const nom = order.Nom || order.nom;
        const email = order.Email || order.email;
        const telephone = order.Telephone || order.telephone;
        const nombrePaniers = order.Nombre_Paniers || order.nombre_paniers;
        const dateRecup = order.Date_Recuperation || order.date_recuperation;
        const dateCreation = order.Date_Creation || order.date_creation;
        
        // ⭐ Envoyer avec le MÊME FORMAT que le modal (minuscules/camelCase)
        // pour être compatible avec le workflow n8n actuel
        if (prenom) updateData.prenom = prenom;                    // ← minuscule
        if (nom) updateData.nom = nom;                             // ← minuscule
        if (email) updateData.email = email;                       // ← minuscule
        if (telephone) updateData.telephone = telephone;           // ← minuscule
        if (nombrePaniers !== null && nombrePaniers !== undefined) updateData.nombrePaniers = nombrePaniers;  // ← camelCase
        if (dateRecup) updateData.dateRecuperation = dateRecup;    // ← camelCase
        if (dateCreation) updateData.dateCreation = dateCreation;  // ← camelCase
        
        console.log('📤 Données envoyées à l\'API (format modal):', updateData);
        
        await updateOrder(order.id || order.ID, updateData);
        
        showToast(SUCCESS_MESSAGES.STATE_CHANGED, 'success');
        
        // Recharger les commandes
        await loadOrders();
        
    } catch (error) {
        console.error('❌ Erreur changement d\'état:', error);
        showToast(ERROR_MESSAGES.UPDATE_ERROR, 'error');
    }
}

/**
 * Gère le clic sur "Supprimer"
 * @param {Object} order - Commande à supprimer
 */
function handleDeleteOrder(order) {
    const modal = document.getElementById('modalConfirmDelete');
    const details = document.getElementById('deleteOrderDetails');
    const btnConfirm = document.getElementById('btnConfirmDelete');
    
    if (!modal || !details) return;
    
    // Afficher les détails de la commande
    const prenom = order.Prenom || order.prenom || '';
    const nom = order.Nom || order.nom || '';
    const id = order.id || order.ID;
    
    details.innerHTML = `
        <strong>Commande #${id}</strong><br>
        ${prenom} ${nom}
    `;
    
    // Stocker l'ID de la commande pour la suppression
    btnConfirm.setAttribute('data-order-id', id);
    
    // Afficher le modal
    modal.classList.remove('hidden');
    
    console.log('🗑️ Modal de suppression ouvert pour commande #', id);
}

/**
 * Ferme le modal de confirmation de suppression
 */
function closeDeleteModal() {
    const modal = document.getElementById('modalConfirmDelete');
    if (modal) {
        modal.classList.add('hidden');
    }
    console.log('✅ Modal de suppression fermé');
}

/**
 * Confirme et exécute la suppression
 */
async function confirmDeleteOrder() {
    const btnConfirm = document.getElementById('btnConfirmDelete');
    const deleteText = document.getElementById('deleteText');
    const deleteSpinner = document.getElementById('deleteSpinner');
    const orderId = btnConfirm.getAttribute('data-order-id');
    
    if (!orderId) {
        console.error('❌ ID de commande manquant');
        return;
    }
    
    // Vérifier si une suppression est déjà en cours
    if (btnConfirm.disabled) {
        console.warn('⚠️ Suppression déjà en cours, action ignorée');
        return;
    }
    
    console.log(`🗑️ Suppression confirmée pour commande #${orderId}`);
    
    // Afficher le spinner
    btnConfirm.disabled = true;
    if (deleteText) deleteText.classList.add('hidden');
    if (deleteSpinner) deleteSpinner.classList.remove('hidden');
    
    try {
        await deleteOrder(orderId);
        
        showToast('Commande supprimée avec succès ✅', 'success');
        
        // Fermer le modal
        closeDeleteModal();
        
        // Recharger les commandes
        await loadOrders();
        
    } catch (error) {
        console.error('❌ Erreur suppression:', error);
        showToast('Erreur lors de la suppression de la commande ❌', 'error');
    } finally {
        // Réinitialiser le bouton
        btnConfirm.disabled = false;
        if (deleteText) deleteText.classList.remove('hidden');
        if (deleteSpinner) deleteSpinner.classList.add('hidden');
    }
}

/**
 * Gère la soumission du formulaire
 * @param {Event} event - Événement submit
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    console.log('📝 Soumission du formulaire...');
    
    const form = event.target;
    
    // Récupérer les données du formulaire
    const formData = {
        prenom: document.getElementById('inputPrenom').value,
        nom: document.getElementById('inputNom').value,
        email: document.getElementById('inputEmail').value,
        telephone: document.getElementById('inputTelephone').value,
        nombrePaniers: document.getElementById('inputNombrePaniers').value,
        dateRecuperation: document.getElementById('inputDateRecuperation').value,
        etat: isEditMode ? document.getElementById('inputEtat').value : ORDER_STATES.PENDING
    };
    
    // Valider le formulaire
    const validation = validateOrderForm(formData);
    
    if (!validation.valid) {
        console.log('❌ Validation échouée:', validation.errors);
        displayFormErrors(validation.errors);
        showToast(ERROR_MESSAGES.VALIDATION_ERROR, 'error');
        return;
    }
    
    // Nettoyer les données
    const cleanData = sanitizeFormData(formData);
    
    // Convertir la date YYYY-MM-DD → DD/MM/YYYY
    cleanData.dateRecuperation = formatDateForAPI(cleanData.dateRecuperation);
    
    // Afficher le spinner
    setFormLoading(true);
    
    try {
        if (isEditMode) {
            // Mode édition
            const orderId = document.getElementById('orderId').value;
            await updateOrder(orderId, cleanData);
            showToast(SUCCESS_MESSAGES.ORDER_UPDATED, 'success');
        } else {
            // Mode création
            await createOrder(cleanData);
            showToast(SUCCESS_MESSAGES.ORDER_CREATED, 'success');
        }
        
        // Fermer le modal
        closeModal();
        
        // Recharger les commandes
        await loadOrders();
        
    } catch (error) {
        console.error('❌ Erreur soumission:', error);
        showToast(isEditMode ? ERROR_MESSAGES.UPDATE_ERROR : ERROR_MESSAGES.CREATE_ERROR, 'error');
    } finally {
        setFormLoading(false);
    }
}

/* ============================================
   STATISTIQUES & COMPTEURS
   ============================================ */

/**
 * Met à jour les statistiques dans le header
 */
function updateStats() {
    const statTotal = document.getElementById('statTotal');
    const statPending = document.getElementById('statPending');
    const statReady = document.getElementById('statReady');
    const statDelivered = document.getElementById('statDelivered');
    
    if (!statTotal) return;
    
    const stats = {
        total: allOrders.length,
        pending: allOrders.filter(o => (o.etat || o.Etat) === ORDER_STATES.PENDING).length,
        ready: allOrders.filter(o => (o.etat || o.Etat) === ORDER_STATES.READY).length,
        delivered: allOrders.filter(o => (o.etat || o.Etat) === ORDER_STATES.DELIVERED).length
    };
    
    statTotal.textContent = stats.total;
    if (statPending) statPending.textContent = stats.pending;
    if (statReady) statReady.textContent = stats.ready;
    if (statDelivered) statDelivered.textContent = stats.delivered;
    
    console.log('📊 Stats mises à jour:', stats);
}

/**
 * Met à jour les compteurs des chips de filtre
 */
function updateChipCounts() {
    const chipCountAll = document.getElementById('chipCountAll');
    const chipCountPending = document.getElementById('chipCountPending');
    const chipCountReady = document.getElementById('chipCountReady');
    const chipCountDelivered = document.getElementById('chipCountDelivered');
    
    if (!chipCountAll) return;
    
    const counts = {
        all: allOrders.length,
        pending: allOrders.filter(o => (o.etat || o.Etat) === ORDER_STATES.PENDING).length,
        ready: allOrders.filter(o => (o.etat || o.Etat) === ORDER_STATES.READY).length,
        delivered: allOrders.filter(o => (o.etat || o.Etat) === ORDER_STATES.DELIVERED).length
    };
    
    chipCountAll.textContent = counts.all;
    if (chipCountPending) chipCountPending.textContent = counts.pending;
    if (chipCountReady) chipCountReady.textContent = counts.ready;
    if (chipCountDelivered) chipCountDelivered.textContent = counts.delivered;
}

/* ============================================
   UTILS UI
   ============================================ */

/**
 * Affiche/masque le loader
 * @param {boolean} show - true pour afficher
 */
function showLoader(show) {
    const loader = document.getElementById('loader');
    if (loader) {
        if (show) {
            loader.classList.remove('hidden');
        } else {
            loader.classList.add('hidden');
        }
    }
}

/**
 * Affiche l'empty state
 * @param {string} title - Titre
 * @param {string} description - Description
 */
function showEmptyState(title, description) {
    const emptyState = document.getElementById('emptyState');
    if (!emptyState) return;
    
    const titleEl = emptyState.querySelector('.empty-title');
    const descEl = emptyState.querySelector('.empty-description');
    
    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = description;
    
    emptyState.classList.remove('hidden');
}

/**
 * Masque l'empty state
 */
function hideEmptyState() {
    const emptyState = document.getElementById('emptyState');
    if (emptyState) {
        emptyState.classList.add('hidden');
    }
}

/**
 * Affiche un toast
 * @param {string} message - Message à afficher
 * @param {string} type - Type: success, error, warning, info
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = type === 'success' ? '✅' : 
                 type === 'error' ? '❌' : 
                 type === 'warning' ? '⚠️' : 'ℹ️';
    
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
        <button type="button" class="toast-close" aria-label="Fermer">✕</button>
    `;
    
    container.appendChild(toast);
    
    // Event close
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => toast.remove());
    
    // Auto-remove après 5s
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, UI_CONFIG.TOAST_DURATION);
    
    console.log(`🔔 Toast ${type}:`, message);
}

/**
 * Affiche les erreurs du formulaire
 * @param {Object} errors - Objet des erreurs { field: errorMessage }
 */
function displayFormErrors(errors) {
    Object.keys(errors).forEach(field => {
        const errorSpan = document.getElementById(`error${field.charAt(0).toUpperCase() + field.slice(1)}`);
        const input = document.getElementById(`input${field.charAt(0).toUpperCase() + field.slice(1)}`);
        
        if (errorSpan) {
            errorSpan.textContent = errors[field];
        }
        
        if (input) {
            input.classList.add('error');
        }
    });
}

/**
 * Efface toutes les erreurs du formulaire
 */
function clearAllFormErrors() {
    const errorSpans = document.querySelectorAll('.form-error');
    const inputs = document.querySelectorAll('.form-input, .form-select');
    
    errorSpans.forEach(span => span.textContent = '');
    inputs.forEach(input => input.classList.remove('error', 'success'));
}

/**
 * Active/désactive le loading du bouton submit
 * @param {boolean} loading - true pour activer
 */
function setFormLoading(loading) {
    const submitBtn = document.getElementById('modalSubmit');
    const submitText = document.getElementById('submitText');
    const submitSpinner = document.getElementById('submitSpinner');
    
    if (!submitBtn) return;
    
    if (loading) {
        submitBtn.disabled = true;
        if (submitText) submitText.classList.add('hidden');
        if (submitSpinner) submitSpinner.classList.remove('hidden');
    } else {
        submitBtn.disabled = false;
        if (submitText) submitText.classList.remove('hidden');
        if (submitSpinner) submitSpinner.classList.add('hidden');
    }
}

/**
 * Parse une date DD/MM/YYYY en objet Date
 * @param {string} dateString - Date au format DD/MM/YYYY
 * @returns {Date} - Objet Date
 */
function parseDateDDMMYYYY(dateString) {
    if (!dateString || typeof dateString !== 'string') {
        return new Date(0); // Date très ancienne pour tri
    }
    
    const [day, month, year] = dateString.split('/');
    if (!day || !month || !year) {
        return new Date(0);
    }
    
    return new Date(`${year}-${month}-${day}`);
}

/**
 * Convertit une date DD/MM/YYYY en YYYY-MM-DD
 * @param {string} dateString - Date DD/MM/YYYY
 * @returns {string} - Date YYYY-MM-DD
 */
function convertDateToInputFormat(dateString) {
    if (!dateString) return '';
    
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
        const [day, month, year] = dateString.split('/');
        return `${year}-${month}-${day}`;
    }
    
    return dateString;
}

console.log('✅ Module UI chargé');

