/* ============================================
   UI - Manipulation DOM & Rendu
   ============================================ */

// Variables globales pour le state
let allOrders = [];
let filteredOrders = [];
let currentFilter = 'En préparation'; // Par défaut : filtre "En préparation"
let currentSort = 'date-asc'; // date-asc, date-desc, name-asc, name-desc
let searchQuery = '';
let isEditMode = false;

/* ============================================
   CHARGEMENT ET AFFICHAGE DES COMMANDES
   ============================================ */

/**
 * Charge toutes les commandes depuis l'API
 */
async function loadOrders(showSkeletons = true) {
    console.log('🔄 Chargement des commandes...');
    
    const ordersGrid = document.getElementById('ordersGrid');
    hideEmptyState();
    
    // Afficher skeleton loaders au lieu du loader classique
    if (showSkeletons && ordersGrid) {
        SkeletonLoader.showSkeletons(ordersGrid, 6);
    } else {
        showLoader(true);
    }
    
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
        if (ordersGrid) {
            ordersGrid.innerHTML = '';
        }
        showEmptyState('Erreur de chargement', error.message);
        showToast(ERROR_MESSAGES.LOAD_ERROR, 'error');
    }
}

/**
 * Applique les filtres et le tri aux commandes
 */
function applyFiltersAndSort() {
    // Sauvegarder les filtres actuels
    PersistentFilters.save({
        status: currentFilter,
        search: searchQuery,
        sort: currentSort
    });
    
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
    
    // 3. Trier selon le type de tri sélectionné
    filteredOrders.sort((a, b) => {
        if (currentSort.startsWith('date-')) {
            // Tri par date de récupération
            const dateA = parseDateDDMMYYYY(a.Date_Recuperation || a.date_recuperation || '');
            const dateB = parseDateDDMMYYYY(b.Date_Recuperation || b.date_recuperation || '');
            
            if (currentSort === 'date-asc') {
                return dateA - dateB;
            } else {
                return dateB - dateA;
            }
        } else if (currentSort.startsWith('name-')) {
            // Tri par nom (prénom + nom)
            const nomA = ((a.Nom || a.nom || '') + ' ' + (a.Prenom || a.prenom || '')).toLowerCase().trim();
            const nomB = ((b.Nom || b.nom || '') + ' ' + (b.Prenom || b.prenom || '')).toLowerCase().trim();
            
            if (currentSort === 'name-asc') {
                return nomA.localeCompare(nomB, 'fr');
            } else {
                return nomB.localeCompare(nomA, 'fr');
            }
        }
        
        // Par défaut, tri par date croissante
        const dateA = parseDateDDMMYYYY(a.Date_Recuperation || a.date_recuperation || '');
        const dateB = parseDateDDMMYYYY(b.Date_Recuperation || b.date_recuperation || '');
        return dateA - dateB;
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
    
    // ✅ Charger et afficher les noms des compositions
    console.log('🎨 Appel de loadCompositionNamesInCards avec', filteredOrders.length, 'commandes');
    loadCompositionNamesInCards(filteredOrders);
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
    const compositionId = order.composition_id;
    
    // 🔍 Debug: afficher composition_id pour cette card
    console.log(`🔍 [createOrderCard] Card #${id}: composition_id = "${compositionId}"`);
    
    // Classe CSS du badge selon l'état
    const badgeClass = etat === ORDER_STATES.DELIVERED ? 'badge-delivered' :
                       etat === ORDER_STATES.READY ? 'badge-ready' : 'badge-pending';
    
    // Icône selon l'état
    const stateIcon = STATE_COLORS[etat]?.icon || '📦';
    
    // Icône de badge selon l'état
    const badgeIcon = etat === ORDER_STATES.DELIVERED ? Icons.get('check', 'icon-sm') :
                      etat === ORDER_STATES.READY ? Icons.get('ready', 'icon-sm') :
                      Icons.get('pending', 'icon-sm');
    
    card.innerHTML = `
        <div class="card-header">
            <div class="card-header-left">
                <div class="card-id">${Icons.get('hash', 'icon-xs')}${id}</div>
                <h3 class="card-name">
                    ${Icons.get('user', 'icon-md')}
                    ${prenom} ${nom}
                </h3>
            </div>
            <span class="card-badge ${badgeClass}">${badgeIcon} ${etat}</span>
        </div>
        
        <div class="card-body">
            <div class="card-info-item">
                <span class="card-info-icon icon-email-wrapper" aria-hidden="true">
                    ${Icons.get('email', 'icon-md')}
                </span>
                <span class="card-info-text">${email}</span>
            </div>
            <div class="card-info-item">
                <span class="card-info-icon icon-phone-wrapper" aria-hidden="true">
                    ${Icons.get('phone', 'icon-md')}
                </span>
                <span class="card-info-text">${telephone}</span>
            </div>
            <div class="card-info-item">
                <span class="card-info-icon icon-basket-wrapper" aria-hidden="true">
                    ${Icons.get('basket', 'icon-md')}
                </span>
                <span class="card-info-text">${nombrePaniers} panier(s)</span>
            </div>
            <div class="card-info-item">
                <span class="card-info-icon icon-calendar-wrapper" aria-hidden="true">
                    ${Icons.get('calendar', 'icon-md')}
                </span>
                <span class="card-info-text">
                    <span class="card-info-label">Récupération :</span> ${dateRecup || 'N/A'}
                </span>
            </div>
            ${compositionId ? `
            <div class="card-info-item">
                <span class="card-info-icon" aria-hidden="true">
                    🎨
                </span>
                <span class="card-info-text" id="comp-name-${id}">
                    <span class="card-info-label">Composition :</span> <span class="composition-name-loading">Chargement...</span>
                </span>
            </div>
            ` : ''}
        </div>
        
        <div class="card-footer">
            <button 
                type="button" 
                class="btn btn-secondary card-btn btn-edit"
                data-order-id="${id}"
                aria-label="Modifier la commande ${prenom} ${nom}"
            >
                ${Icons.get('edit', 'icon-sm')} Modifier
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
                ${Icons.get('delete', 'icon-sm')} Supprimer
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
        return `${Icons.get('ready', 'icon-sm')} Marquer Prêt`;
    } else if (currentState === ORDER_STATES.READY) {
        return `${Icons.get('delivered', 'icon-sm')} Marquer Livré`;
    } else {
        return `${Icons.get('check', 'icon-sm')} Livré`;
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
    
    // Charger les compositions
    loadCompositionsInSelect();
    
    // Initialiser la prévisualisation de composition
    setupCompositionPreview();
    
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
    
    // Charger les compositions
    loadCompositionsInSelect().then(() => {
        // Initialiser la prévisualisation de composition après chargement
        setupCompositionPreview();
        
        // Pré-sélectionner la composition après chargement
        const inputComposition = document.getElementById('inputComposition');
        if (inputComposition && order.composition_id) {
            inputComposition.value = order.composition_id;
            console.log('✅ Composition pré-sélectionnée:', order.composition_id);
            // Afficher la prévisualisation de la composition sélectionnée
            showCompositionPreview(order.composition_id);
        } else if (inputComposition) {
            console.log('ℹ️ Aucune composition associée (composition_id:', order.composition_id, ')');
        }
    });
    
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
    const preview = document.getElementById('compositionPreview');
    
    if (modal) {
        modal.classList.add('hidden');
    }
    
    // Masquer la prévisualisation de composition
    if (preview) {
        preview.classList.add('hidden');
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
        
        // ⚠️ CORRECTION : Toujours inclure composition_id (même si null ou undefined)
        // pour éviter qu'il soit perdu lors du changement d'état rapide
        const compositionId = order.composition_id || order.Composition_ID || null;
        updateData.composition_id = compositionId && compositionId.trim && compositionId.trim() !== '' 
            ? compositionId.trim() 
            : null;
        
        console.log('📤 Données envoyées à l\'API (format modal):', updateData);
        console.log('🔍 [handleQuickStateChange] composition_id:', {
            original: order.composition_id || order.Composition_ID,
            sanitized: updateData.composition_id
        });
        
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
    
    // 🔍 DEBUG : Vérifier le select composition
    const selectComposition = document.getElementById('inputComposition');
    console.log('🔍 Select composition element:', selectComposition);
    console.log('🔍 Select composition value:', selectComposition?.value);
    console.log('🔍 Select composition selectedIndex:', selectComposition?.selectedIndex);
    console.log('🔍 Select composition selectedOption:', selectComposition?.options[selectComposition?.selectedIndex]);
    
    // Récupérer les données du formulaire
    const formData = {
        prenom: document.getElementById('inputPrenom').value,
        nom: document.getElementById('inputNom').value,
        email: document.getElementById('inputEmail').value,
        telephone: document.getElementById('inputTelephone').value,
        nombrePaniers: document.getElementById('inputNombrePaniers').value,
        dateRecuperation: document.getElementById('inputDateRecuperation').value,
        composition_id: selectComposition?.value || null,
        etat: isEditMode ? document.getElementById('inputEtat').value : ORDER_STATES.PENDING
    };
    
    console.log('📋 Données du formulaire (avec composition_id):', formData);
    
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

// Exposer les fonctions nécessaires globalement (pour compatibilité avec anciens modules)
if (typeof window !== 'undefined') {
    window.loadOrders = loadOrders;
    window.renderOrders = renderOrders;
    window.applyFiltersAndSort = applyFiltersAndSort;
    // handleSearch, handleFilterChange, handleSortChange sont dans main.js
    window.openModalCreate = openModalCreate;
    window.openModalEdit = openModalEdit;
    window.closeModal = closeModal;
    window.handleFormSubmit = handleFormSubmit;
    window.handleQuickStateChange = handleQuickStateChange;
    window.handleDeleteOrder = handleDeleteOrder;
    window.closeDeleteModal = closeDeleteModal;
    window.confirmDeleteOrder = confirmDeleteOrder;
    window.showToast = showToast;
    window.updateStats = updateStats;
    window.updateChipCounts = updateChipCounts;
    
    // Variables globales exposées
    window.allOrders = allOrders;
    window.filteredOrders = filteredOrders;
    window.currentFilter = currentFilter;
    window.currentSort = currentSort;
    window.searchQuery = searchQuery;
}

/* ============================================
   COMPOSITIONS - Charger dans le formulaire
   ============================================ */

/**
 * Charge les compositions et les affiche dans le select
 */
async function loadCompositionsInSelect() {
    console.log('🔍 loadCompositionsInSelect() appelée');
    
    const select = document.getElementById('inputComposition');
    console.log('🔍 Select element:', select);
    
    if (!select) {
        console.error('❌ Select "inputComposition" non trouvé !');
        return Promise.resolve();
    }
    
    // Mettre un message de chargement
    select.innerHTML = '<option value="">⏳ Chargement...</option>';
    
    try {
        // Utiliser la fonction centralisée de config.js
        const allCompositions = await getCompositions();
        
        // Filtrer pour n'afficher que les compositions actives
        const compositions = allCompositions.filter(comp => {
            // Normaliser le champ actif (gérer string "true"/"false", boolean, 1/0)
            let isActive = false;
            if (comp.actif !== undefined && comp.actif !== null) {
                if (typeof comp.actif === 'string') {
                    isActive = comp.actif.toLowerCase() === 'true' || comp.actif === '1';
                } else if (typeof comp.actif === 'number') {
                    isActive = comp.actif === 1;
                } else if (typeof comp.actif === 'boolean') {
                    isActive = comp.actif === true;
                }
            }
            return isActive;
        });
        
        console.log(`✅ ${compositions.length} composition(s) active(s) à afficher (sur ${allCompositions.length} total)`);
        
        // Vider le select
        select.innerHTML = '';
        
        // Option par défaut
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = compositions.length > 0 
            ? '-- Sélectionner une composition --' 
            : 'Aucune composition active disponible';
        select.appendChild(defaultOption);
        
        // Ajouter les compositions actives
        compositions.forEach((comp, index) => {
            console.log(`  ${index + 1}. ${comp.nom} (${comp.id_compo || comp.id})`);
            
            const option = document.createElement('option');
            option.value = comp.id_compo || comp.id;
            
            // Afficher le nom et la période
            try {
                const debut = new Date(comp.date_debut).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
                const fin = new Date(comp.date_fin).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
                
                option.textContent = `${comp.nom} (${debut} - ${fin})`;
            } catch (e) {
                // Si erreur de date, afficher juste le nom
                option.textContent = comp.nom;
            }
            
            select.appendChild(option);
        });
        
        console.log('✅ Select peuplé avec', compositions.length, 'composition(s) active(s)');
        
        return Promise.resolve();
        
    } catch (error) {
        console.error('❌ Erreur chargement compositions:', error);
        console.error('Stack:', error.stack);
        select.innerHTML = '<option value="">❌ Erreur de chargement</option>';
        return Promise.reject(error);
    }
}

/**
 * Charge les noms des compositions et les affiche dans les cards
 * @param {Array} orders - Liste des commandes affichées
 */
async function loadCompositionNamesInCards(orders) {
    console.log('🎨 [loadCompositionNamesInCards] Reçu', orders.length, 'commandes');
    
    // Filtrer les commandes qui ont une composition_id
    const ordersWithComp = orders.filter(order => {
        const hasComp = !!(order.composition_id);
        console.log(`  📦 Commande #${order.id || order.ID}: composition_id = "${order.composition_id}" (${hasComp ? 'OUI' : 'NON'})`);
        return hasComp;
    });
    
    if (ordersWithComp.length === 0) {
        console.log('ℹ️ Aucune commande avec composition_id');
        return;
    }
    
    console.log(`🎨 Chargement des noms de ${ordersWithComp.length} compositions...`);
    
    try {
        // Récupérer toutes les compositions
        const compositions = await getCompositions();
        console.log('📋 Compositions disponibles:', compositions.length);
        
        // Créer un map id_compo → nom
        const compositionsMap = {};
        compositions.forEach(comp => {
            const key = comp.id_compo || comp.id;
            compositionsMap[key] = comp.nom;
            console.log(`  🗂️ Map: "${key}" → "${comp.nom}"`);
        });
        
        console.log('📋 Toutes les clés du mapping:', Object.keys(compositionsMap));
        
        // Mettre à jour chaque card
        ordersWithComp.forEach(order => {
            const id = order.id || order.ID;
            const compId = order.composition_id;
            const compNameElement = document.querySelector(`#comp-name-${id} .composition-name-loading`);
            
            console.log(`  🔍 Card #${id}: composition_id = "${compId}" (type: ${typeof compId})`);
            console.log(`  🔍 Recherche dans le mapping: compositionsMap["${compId}"] = ${compositionsMap[compId] ? `"${compositionsMap[compId]}"` : 'UNDEFINED'}`);
            
            if (compNameElement) {
                const compName = compositionsMap[compId];
                
                if (compName) {
                    compNameElement.textContent = compName;
                    compNameElement.classList.remove('composition-name-loading');
                    compNameElement.classList.add('composition-name-loaded');
                    console.log(`  ✅ Card #${id}: "${compId}" → "${compName}"`);
                } else {
                    // Si pas trouvé, afficher l'ID avec un warning
                    console.warn(`  ⚠️ Card #${id}: Composition "${compId}" non trouvée dans le mapping !`);
                    compNameElement.textContent = compId || 'Inconnue';
                    compNameElement.classList.remove('composition-name-loading');
                    compNameElement.classList.add('composition-name-error');
                }
            } else {
                console.warn(`  ⚠️ Card #${id}: Élément .composition-name-loading introuvable !`);
            }
        });
        
        console.log('✅ Noms de compositions chargés');
        
    } catch (error) {
        console.error('❌ Erreur chargement noms compositions:', error);
        // En cas d'erreur, afficher les IDs
        ordersWithComp.forEach(order => {
            const id = order.id || order.ID;
            const compNameElement = document.querySelector(`#comp-name-${id} .composition-name-loading`);
            if (compNameElement) {
                compNameElement.textContent = order.composition_id;
                compNameElement.classList.remove('composition-name-loading');
            }
        });
    }
}

/**
 * Affiche la visualisation de la composition sélectionnée
 * @param {String} compositionId - ID de la composition à afficher
 */
async function showCompositionPreview(compositionId) {
    const preview = document.getElementById('compositionPreview');
    const previewContent = document.getElementById('compositionPreviewContent');
    
    if (!preview || !previewContent) {
        console.warn('⚠️ Éléments de prévisualisation non trouvés');
        return;
    }
    
    // Si aucune composition sélectionnée, masquer la prévisualisation
    if (!compositionId || compositionId === '') {
        preview.classList.add('hidden');
        return;
    }
    
    try {
        // Récupérer toutes les compositions
        const compositions = await getCompositions();
        
        // Trouver la composition sélectionnée
        const selectedComposition = compositions.find(comp => 
            (comp.id_compo || comp.id) === compositionId
        );
        
        if (!selectedComposition) {
            console.warn('⚠️ Composition non trouvée:', compositionId);
            preview.classList.add('hidden');
            return;
        }
        
        // Parser composition_json si c'est une string
        let compositionData = selectedComposition.composition_json || selectedComposition.composition || {};
        if (typeof compositionData === 'string') {
            try {
                compositionData = JSON.parse(compositionData);
            } catch (e) {
                console.error('❌ Erreur parsing composition_json:', e);
                compositionData = {};
            }
        }
        
        // Calculer le total de fruits (gérer les deux formats)
        const totalFruits = Object.values(compositionData).reduce((sum, data) => {
            if (typeof data === 'object' && data !== null) {
                return sum + parseFloat(data.qty || 0);
            } else {
                return sum + parseFloat(data || 0);
            }
        }, 0);
        
        // Générer le HTML de la prévisualisation
        const fruitsList = Object.entries(compositionData)
            .map(([nom, data]) => {
                // Gérer la compatibilité avec l'ancien format
                let qty, unite;
                if (typeof data === 'object' && data !== null) {
                    // Nouveau format : {qty: 5, unite: 'piece'}
                    qty = data.qty || 0;
                    unite = data.unite || 'piece';
                } else {
                    // Ancien format : juste un nombre (par défaut 'piece')
                    qty = data || 0;
                    unite = 'piece';
                }
                
                const uniteLabel = unite === 'kg' ? 'kg' : 'pièce(s)';
                const qtyDisplay = unite === 'kg' ? qty.toFixed(1) : Math.round(qty);
                
                return `
                    <div class="composition-preview-fruit">
                        <span class="composition-preview-fruit-name">${nom || 'Fruit'}</span>
                        <span class="composition-preview-fruit-qty">×${qtyDisplay} ${uniteLabel}</span>
                    </div>
                `;
            })
            .join('');
        
        // Formater les dates
        let dateRange = '';
        try {
            if (selectedComposition.date_debut && selectedComposition.date_fin) {
                const debut = new Date(selectedComposition.date_debut).toLocaleDateString('fr-FR', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                });
                const fin = new Date(selectedComposition.date_fin).toLocaleDateString('fr-FR', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                });
                dateRange = `Du ${debut} au ${fin}`;
            }
        } catch (e) {
            console.warn('⚠️ Erreur formatage dates:', e);
        }
        
        previewContent.innerHTML = `
            <div class="composition-preview-info">
                <div class="composition-preview-name">${selectedComposition.nom || 'Sans nom'}</div>
                ${dateRange ? `<div class="composition-preview-dates">${dateRange}</div>` : ''}
                ${selectedComposition.actif ? '<div class="composition-preview-badge active">✓ Active</div>' : '<div class="composition-preview-badge inactive">⏸ Inactive</div>'}
            </div>
            <div class="composition-preview-fruits">
                <div class="composition-preview-fruits-header">
                    <span class="composition-preview-fruits-title">Fruits dans le panier</span>
                    <span class="composition-preview-fruits-total">${totalFruits} fruits</span>
                </div>
                <div class="composition-preview-fruits-list">
                    ${fruitsList || '<div class="composition-preview-empty">Aucun fruit défini</div>'}
                </div>
            </div>
        `;
        
        // Afficher la prévisualisation
        preview.classList.remove('hidden');
        
    } catch (error) {
        console.error('❌ Erreur affichage prévisualisation:', error);
        preview.classList.add('hidden');
    }
}

/**
 * Initialise les event listeners pour la prévisualisation de composition
 */
function setupCompositionPreview() {
    const selectComposition = document.getElementById('inputComposition');
    
    if (!selectComposition) {
        console.warn('⚠️ Select composition non trouvé pour la prévisualisation');
        return;
    }
    
    // Écouter les changements de sélection
    selectComposition.addEventListener('change', (e) => {
        const selectedId = e.target.value;
        showCompositionPreview(selectedId);
    });
    
    console.log('✅ Prévisualisation de composition initialisée');
}

// Exposer les fonctions globalement
window.loadCompositionsInSelect = loadCompositionsInSelect;
window.showCompositionPreview = showCompositionPreview;
window.setupCompositionPreview = setupCompositionPreview;
if (typeof loadCompositionNamesInCards !== 'undefined') {
    window.loadCompositionNamesInCards = loadCompositionNamesInCards;
}

