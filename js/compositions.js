/* ============================================
   COMPOSITIONS.JS - Gestion des Compositions
   VERSION: 2.0.2 (Fix JSON parsing empty responses)
   ============================================ */

/* ============================================
   CONFIGURATION & STATE
   ============================================ */

// API Configuration
const COMP_API_ENDPOINTS = {
    GET_ALL: 'https://n8n-seb.sandbox-jerem.com/webhook/compositions',
    CREATE: 'https://n8n-seb.sandbox-jerem.com/webhook/compositions/create',
    UPDATE: 'https://n8n-seb.sandbox-jerem.com/webhook/compositions/update',
    DELETE: 'https://n8n-seb.sandbox-jerem.com/webhook/compositions/delete',
    GET_ACTIVE: 'https://n8n-seb.sandbox-jerem.com/webhook/composition-active'
};

// State
let allCompositions = [];
let currentComposition = null; // Pour édition
let isDeleting = false; // Flag pour éviter doubles suppressions
let usedCompositionIds = new Set(); // IDs des compositions utilisées dans les commandes

// Filtres
let activeFilters = {
    activeOnly: false,
    date: null
};

/* ============================================
   INITIALISATION
   ============================================ */

document.addEventListener('DOMContentLoaded', initCompositions);

/**
 * Initialise l'application Compositions
 */
function initCompositions() {
    console.log('🎨 Initialisation Compositions...');
    
    // Vérifier les dépendances
    if (typeof Haptic === 'undefined') {
        console.warn('⚠️ Module Haptic non disponible');
    } else {
        console.log('✅ Module Haptic disponible');
    }
    
    // Initialiser Dark Mode
    try {
        if (typeof DarkMode !== 'undefined' && DarkMode.init) {
            DarkMode.init();
            const darkModeToggle = DarkMode.createToggleButton();
            document.body.appendChild(darkModeToggle);
            console.log('✅ Dark Mode initialisé');
        }
    } catch (error) {
        console.warn('⚠️ DarkMode non disponible:', error);
    }
    
    // Initialiser Pull to Refresh
    try {
        if (typeof PullToRefresh !== 'undefined') {
            new PullToRefresh(async () => {
                console.log('🔄 Pull to refresh compositions');
                await loadCompositions();
            });
            console.log('✅ Pull to Refresh initialisé');
        }
    } catch (error) {
        console.warn('⚠️ PullToRefresh non disponible:', error);
    }
    
    // Event listeners
    setupEventListeners();
    
    // Charger les compositions
    loadCompositions();
}

/**
 * Configure tous les event listeners
 */
function setupEventListeners() {
    // Boutons principaux
    document.getElementById('btnNewComp')?.addEventListener('click', () => {
        if (typeof Haptic !== 'undefined') Haptic.medium();
        openCompModal();
    });
    
    document.getElementById('btnRefreshComp')?.addEventListener('click', () => {
        if (typeof Haptic !== 'undefined') Haptic.light();
        loadCompositions();
    });
    
    // Filtres
    document.getElementById('toggleActiveOnly')?.addEventListener('change', (e) => {
        if (typeof Haptic !== 'undefined') Haptic.light();
        activeFilters.activeOnly = e.target.checked;
        renderCompositions();
    });
    
    document.getElementById('filterDate')?.addEventListener('change', (e) => {
        if (typeof Haptic !== 'undefined') Haptic.light();
        activeFilters.date = e.target.value || null;
        document.getElementById('btnClearDate').style.display = e.target.value ? 'inline-flex' : 'none';
        renderCompositions();
    });
    
    document.getElementById('btnClearDate')?.addEventListener('click', () => {
        if (typeof Haptic !== 'undefined') Haptic.light();
        document.getElementById('filterDate').value = '';
        activeFilters.date = null;
        document.getElementById('btnClearDate').style.display = 'none';
        renderCompositions();
    });
    
    // Modal
    document.getElementById('modalCompClose')?.addEventListener('click', closeCompModal);
    document.getElementById('modalCompCancel')?.addEventListener('click', closeCompModal);
    document.querySelector('#modalComp .modal-backdrop')?.addEventListener('click', closeCompModal);
    
    // Formulaire
    document.getElementById('compForm')?.addEventListener('submit', handleCompFormSubmit);
    document.getElementById('btnAddFruit')?.addEventListener('click', addFruitRow);
    
    // Génération auto de l'ID depuis le nom
    document.getElementById('inputCompNom')?.addEventListener('input', (e) => {
        const idInput = document.getElementById('inputCompId');
        // Ne générer l'ID que si on est en mode création (pas d'ID original)
        if (!document.getElementById('compIdOriginal').value) {
            idInput.value = generateIdFromName(e.target.value);
        }
    });
    
    // Modal suppression
    document.getElementById('btnCancelDeleteComp')?.addEventListener('click', closeDeleteCompModal);
    document.querySelector('#modalConfirmDeleteComp .modal-backdrop')?.addEventListener('click', closeDeleteCompModal);
    document.getElementById('btnConfirmDeleteComp')?.addEventListener('click', confirmDeleteComposition);
    
    // Escape key pour fermer modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!document.getElementById('modalComp').classList.contains('hidden')) {
                closeCompModal();
            }
            if (!document.getElementById('modalConfirmDeleteComp').classList.contains('hidden')) {
                closeDeleteCompModal();
            }
        }
    });
}

/* ============================================
   API CALLS
   ============================================ */

/**
 * Charge toutes les compositions depuis l'API
 * @param {Object} filters - Filtres optionnels (actif, date)
 */
async function loadCompositions(filters = {}) {
    console.log('📥 Chargement des compositions...', filters);
    
    // Afficher le loader
    showLoader();
    hideEmptyState();
    
    try {
        // Construire l'URL avec les query params
        let url = COMP_API_ENDPOINTS.GET_ALL;
        const params = new URLSearchParams();
        
        if (filters.actif !== undefined) {
            params.append('actif', filters.actif);
        }
        if (filters.date) {
            params.append('date', filters.date);
        }
        if (filters.id) {
            params.append('id', filters.id);
        }
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        console.log('📡 Fetch:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erreur API:', errorText);
            throw new Error(`Erreur API: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('✅ Données reçues:', data);
        
        // 🔍 DEBUG : Analyser le type exact de data.compositions
        if (data.compositions) {
            console.log('🔍 Type de data.compositions:', typeof data.compositions);
            console.log('🔍 Est un Array ?', Array.isArray(data.compositions));
            console.log('🔍 Contenu:', data.compositions);
            
            // 🔧 FIX : Gérer le double wrapping n8n
            // Si data.compositions est un objet avec une propriété compositions (array)
            if (!Array.isArray(data.compositions) && 
                data.compositions.compositions && 
                Array.isArray(data.compositions.compositions)) {
                console.log('🔧 Détecté: Double wrapping n8n - Correction...');
                // Remplacer data.compositions par le vrai array
                data.compositions = data.compositions.compositions;
                console.log('✅ Corrigé: data.compositions est maintenant un array de', data.compositions.length);
            }
        }
        
        // Gérer différents formats de réponse n8n
        let rawCompositions = [];
        
        // IMPORTANT : Vérifier Array.isArray AVANT typeof object (car array est un objet en JS)
        
        if (Array.isArray(data)) {
            // Format: [...]
            console.log('📦 Format: Array direct');
            rawCompositions = data;
        } else if (data.compositions && Array.isArray(data.compositions)) {
            // Format: { compositions: [...] }
            console.log('📦 Format: Wrapper compositions (array)');
            rawCompositions = data.compositions;
        } else if (data.data && Array.isArray(data.data)) {
            // Format: { data: [...] }
            console.log('📦 Format: Wrapper data (array)');
            rawCompositions = data.data;
        } else if (data.compositions && typeof data.compositions === 'object' && !Array.isArray(data.compositions)) {
            // Format: { compositions: { "id1": {...}, "id2": {...} } }
            console.log('📦 Format: Wrapper compositions (objet) - Conversion en array');
            rawCompositions = Object.entries(data.compositions).map(([key, value]) => {
                if (value && typeof value === 'object' && value.id) {
                    return value;
                }
                return { id: key, ...value };
            });
        } else if (typeof data === 'object' && !Array.isArray(data)) {
            // Format: { "id1": {...}, "id2": {...} } (sans wrapper)
            console.log('📦 Format: Objet racine - Conversion en array');
            rawCompositions = Object.entries(data).map(([key, value]) => {
                if (value && typeof value === 'object' && value.id) {
                    return value;
                }
                return { id: key, ...value };
            });
        } else {
            console.warn('⚠️ Format de réponse inattendu:', data);
            rawCompositions = [];
        }
        
        // Normaliser les données (gérer id_compo et composition_json string)
        allCompositions = rawCompositions.map(comp => {
            const normalized = { ...comp };
            
            // Utiliser id_compo comme id principal si présent
            if (comp.id_compo && !comp.id) {
                normalized.id = comp.id_compo;
            } else if (comp.id_compo) {
                // Garder id_compo comme id principal, id devient db_id
                normalized.id = comp.id_compo;
                normalized.db_id = comp.id;
            }
            
            // Parser composition_json si c'est une string
            if (typeof comp.composition_json === 'string') {
                try {
                    normalized.composition_json = JSON.parse(comp.composition_json);
                    console.log(`📦 Parsed JSON pour ${normalized.id}:`, normalized.composition_json);
                } catch (error) {
                    console.error(`❌ Erreur parsing JSON pour ${comp.id}:`, error);
                    normalized.composition_json = {};
                }
            }
            
            return normalized;
        });
        
        console.log(`✅ ${allCompositions.length} compositions chargées`);
        
        // Charger les commandes pour identifier les compositions utilisées
        await loadUsedCompositions();
        
        // Mettre à jour l'interface
        updateStats();
        renderCompositions();
        
        // Toast de succès
        showNotification(`${allCompositions.length} composition(s) chargée(s) ✅`, 'success');
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement:', error);
        showNotification('Erreur lors du chargement des compositions', 'error');
        allCompositions = [];
        renderCompositions();
    } finally {
        hideLoader();
    }
}

/**
 * Crée une nouvelle composition
 * @param {Object} compData - Données de la composition
 * @returns {Promise<Object>} - Composition créée
 */
async function createComposition(compData) {
    console.log('➕ Création composition:', compData);
    
    // Adapter le format pour n8n (id → id_compo)
    // ✅ Convertir composition_json en string JSON (n8n attend une string, pas un objet)
    const payload = {
        id_compo: compData.id,
        nom: compData.nom,
        date_debut: compData.date_debut,
        date_fin: compData.date_fin,
        actif: compData.actif,
        composition_json: typeof compData.composition_json === 'string' 
            ? compData.composition_json 
            : JSON.stringify(compData.composition_json || {})
    };
    
    console.log('📤 Payload envoyé:', payload);
    
    const response = await fetch(COMP_API_ENDPOINTS.CREATE, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur création:', errorText);
        throw new Error(`Erreur ${response.status}: ${errorText}`);
    }
    
    // Gérer réponse vide ou non-JSON
    const responseText = await response.text();
    
    if (!responseText || responseText.trim() === '') {
        console.log('✅ Réponse vide - Création réussie');
        return { success: true, id: compData.id_compo };
    }
    
    let result;
    try {
        result = JSON.parse(responseText);
        console.log('✅ Composition créée:', result);
    } catch (error) {
        console.warn('⚠️ Réponse non-JSON:', responseText);
        return { success: true, id: compData.id_compo, message: responseText };
    }
    
    return result.composition || result;
}

/**
 * Met à jour une composition existante
 * @param {String} id - ID de la composition (id_compo)
 * @param {Object} compData - Données à mettre à jour
 * @returns {Promise<Object>} - Composition mise à jour
 */
async function updateComposition(id, compData) {
    console.log('✏️ Mise à jour composition:', id, compData);
    
    // Adapter le format pour n8n
    // ✅ Convertir composition_json en string JSON (n8n attend une string, pas un objet)
    const payload = {
        id_compo: id,
        nom: compData.nom,
        date_debut: compData.date_debut,
        date_fin: compData.date_fin,
        actif: compData.actif,
        composition_json: typeof compData.composition_json === 'string' 
            ? compData.composition_json 
            : JSON.stringify(compData.composition_json || {})
    };
    
    console.log('📤 Payload UPDATE:', payload);
    
    const response = await fetch(COMP_API_ENDPOINTS.UPDATE, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur mise à jour:', errorText);
        throw new Error(`Erreur ${response.status}: ${errorText}`);
    }
    
    // Vérifier si la réponse a du contenu
    const contentType = response.headers.get('content-type');
    const responseText = await response.text();
    
    console.log('📄 Content-Type:', contentType);
    console.log('📄 Response body:', responseText);
    
    // Si la réponse est vide, considérer comme succès
    if (!responseText || responseText.trim() === '') {
        console.log('✅ Réponse vide - Mise à jour réussie');
        return { success: true, id: id };
    }
    
    // Parser le JSON
    let result;
    try {
        result = JSON.parse(responseText);
        console.log('✅ Composition mise à jour:', result);
    } catch (error) {
        console.warn('⚠️ Réponse non-JSON:', responseText);
        // Si ce n'est pas du JSON mais status 200, considérer comme succès
        return { success: true, id: id, message: responseText };
    }
    
    return result.composition || result;
}

/**
 * Supprime une composition
 * @param {String} id - ID de la composition (id_compo)
 */
async function deleteComposition(id) {
    console.log('🗑️ Suppression composition:', id);
    console.log('🔗 URL DELETE:', COMP_API_ENDPOINTS.DELETE);
    
    // Essayer avec POST et les données dans le body (format standard)
    const url = `${COMP_API_ENDPOINTS.DELETE}?id_compo=${encodeURIComponent(id)}`;
    console.log('🔗 URL complète avec query:', url);
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id_compo: id })
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Array.from(response.headers.entries()));
    
    // Lire le body de la réponse pour debug
    const responseText = await response.text();
    console.log('📄 Response body:', responseText);
    
    if (!response.ok) {
        console.error('❌ Erreur suppression:', responseText);
        
        // Erreur 409 = conflit (composition utilisée par des commandes)
        if (response.status === 409) {
            throw new Error('Cette composition est utilisée par des commandes existantes et ne peut pas être supprimée.');
        }
        
        throw new Error(`Erreur ${response.status}: ${responseText}`);
    }
    
    console.log('✅ Composition supprimée');
    return true;
}

/**
 * Charge les commandes pour identifier les compositions utilisées
 */
async function loadUsedCompositions() {
    try {
        console.log('🔍 Chargement des commandes pour identifier les compositions utilisées...');
        
        const response = await fetch('https://n8n-seb.sandbox-jerem.com/webhook/orders', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            console.warn('⚠️ Impossible de charger les commandes:', response.status);
            return;
        }
        
        const data = await response.json();
        
        // Parser selon la structure n8n
        let orders = [];
        if (Array.isArray(data) && data.length > 0 && data[0].data && Array.isArray(data[0].data)) {
            orders = data[0].data;
        } else if (data.data && Array.isArray(data.data)) {
            orders = data.data;
        } else if (Array.isArray(data)) {
            orders = data;
        }
        
        // Extraire les composition_id uniques
        usedCompositionIds.clear();
        orders.forEach(order => {
            if (order.composition_id) {
                usedCompositionIds.add(order.composition_id);
            }
        });
        
        console.log(`✅ ${usedCompositionIds.size} composition(s) utilisée(s):`, Array.from(usedCompositionIds));
        
    } catch (error) {
        console.warn('⚠️ Erreur chargement commandes (non bloquant):', error);
        // Ne pas bloquer si on ne peut pas charger les commandes
    }
}

/* ============================================
   UI - RENDERING
   ============================================ */

/**
 * Met à jour les statistiques dans le header
 */
function updateStats() {
    const total = allCompositions.length;
    const active = allCompositions.filter(c => c.actif).length;
    const inactive = total - active;
    
    document.getElementById('statTotalComp').textContent = total;
    document.getElementById('statActiveComp').textContent = active;
    document.getElementById('statInactiveComp').textContent = inactive;
}

/**
 * Affiche les compositions filtrées
 */
function renderCompositions() {
    const grid = document.getElementById('compositionsGrid');
    
    if (!grid) {
        console.error('❌ Grid non trouvé');
        return;
    }
    
    // Filtrer les compositions
    let filtered = [...allCompositions];
    
    if (activeFilters.activeOnly) {
        filtered = filtered.filter(c => c.actif);
    }
    
    if (activeFilters.date) {
        const filterDate = new Date(activeFilters.date);
        filtered = filtered.filter(c => {
            const debut = new Date(c.date_debut);
            const fin = new Date(c.date_fin);
            return filterDate >= debut && filterDate <= fin;
        });
    }
    
    console.log(`🔍 Compositions filtrées: ${filtered.length}/${allCompositions.length}`);
    
    // Afficher empty state si aucune composition
    if (filtered.length === 0) {
        grid.innerHTML = '';
        showEmptyState();
        return;
    }
    
    hideEmptyState();
    
    // Trier par date de début (plus récent en premier)
    filtered.sort((a, b) => new Date(b.date_debut) - new Date(a.date_debut));
    
    // Générer les cards
    grid.innerHTML = filtered.map(comp => renderCompositionCard(comp)).join('');
    
    // Animer l'apparition
    const cards = grid.querySelectorAll('.comp-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 50}ms`;
        card.classList.add('fade-in');
    });
}

/**
 * Génère le HTML d'une card composition
 * @param {Object} comp - Données de la composition
 * @returns {String} - HTML de la card
 */
function renderCompositionCard(comp) {
    // Sécurité : vérifier que comp existe et a les champs requis
    if (!comp || !comp.id) {
        console.warn('⚠️ Composition invalide:', comp);
        return '';
    }
    
    // Préparer la liste des fruits (avec protection undefined)
    const composition = comp.composition_json || comp.composition || {};
    const fruits = Object.entries(composition)
        .map(([nom, qty]) => `
            <li class="comp-fruit-item">
                <span class="comp-fruit-name">${nom || 'Fruit'}</span>
                <span class="comp-fruit-qty">×${qty || 0}</span>
            </li>
        `)
        .join('');
    
    // Total de fruits
    const totalFruits = Object.values(composition).reduce((sum, qty) => sum + parseInt(qty || 0), 0);
    
    // Formater les dates (avec valeurs par défaut)
    const dateRange = formatDateRange(
        comp.date_debut || new Date().toISOString(), 
        comp.date_fin || new Date().toISOString()
    );
    
    // Vérifier si la composition est utilisée
    const isUsed = usedCompositionIds.has(comp.id) || usedCompositionIds.has(comp.id_compo);
    
    // Badge actif/inactif + utilisé
    let statusBadge = '';
    if (isUsed) {
        statusBadge = '<span class="comp-status-badge used">🔒 Utilisée</span>';
    } else if (comp.actif) {
        statusBadge = '<span class="comp-status-badge active">✅ Active</span>';
    } else {
        statusBadge = '<span class="comp-status-badge inactive">⏸️ Inactive</span>';
    }
    
    // Nom de la composition (avec fallback)
    const nomComp = comp.nom || comp.id || 'Sans nom';
    
    // Icônes SVG
    const editIcon = `<svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M18.5 2.5C18.8978 2.1022 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.1022 21.5 2.5C21.8978 2.8978 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.1022 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
    
    const deleteIcon = `<svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
    
    // Échapper les guillemets dans les attributs (convertir en string d'abord)
    const safeId = String(comp.id || comp.id_compo || '').replace(/'/g, "\\'");
    const safeName = String(nomComp || '').replace(/'/g, "\\'");
    
    return `
        <div class="comp-card" data-comp-id="${safeId}" role="listitem">
            <div class="comp-card-header">
                <h3 class="comp-card-title">${nomComp}</h3>
                ${statusBadge}
            </div>
            
            <div class="comp-card-body">
                <p class="comp-dates">${dateRange}</p>
                
                <ul class="comp-fruits-list">
                    ${fruits || '<li style="color: var(--text-secondary);">Aucun fruit défini</li>'}
                </ul>
                
                <p class="comp-total">
                    <strong>${totalFruits} fruits</strong> par panier
                </p>
            </div>
            
            <div class="comp-card-actions">
                <button 
                    type="button" 
                    class="btn-icon-comp edit" 
                    onclick="editComposition('${safeId}')"
                    aria-label="Modifier la composition ${safeName}"
                >
                    ${editIcon}
                    <span>Modifier</span>
                </button>
                <button 
                    type="button" 
                    class="btn-icon-comp delete ${isUsed ? 'disabled' : ''}" 
                    onclick="${isUsed ? 'void(0)' : `handleDeleteComposition('${safeId}')`}"
                    aria-label="${isUsed ? 'Cette composition est utilisée et ne peut pas être supprimée' : `Supprimer la composition ${safeName}`}"
                    ${isUsed ? 'disabled title="Cette composition est utilisée par des commandes et ne peut pas être supprimée"' : ''}
                >
                    ${deleteIcon}
                    <span>Supprimer</span>
                </button>
            </div>
        </div>
    `;
}

/* ============================================
   UI - MODAL COMPOSITION
   ============================================ */

/**
 * Ouvre le modal de création/édition
 * @param {Object|null} comp - Composition à éditer (null pour création)
 */
function openCompModal(comp = null) {
    const modal = document.getElementById('modalComp');
    const title = document.getElementById('modalCompTitle');
    const submitBtn = document.getElementById('submitCompText');
    const form = document.getElementById('compForm');
    
    // Reset form
    form.reset();
    clearFormErrors();
    
    // Réinitialiser les fruits
    document.getElementById('fruitsContainer').innerHTML = '';
    
    if (comp) {
        // MODE ÉDITION
        console.log('✏️ Édition composition:', comp);
        title.textContent = 'Modifier la Composition';
        submitBtn.textContent = 'Enregistrer';
        currentComposition = comp;
        
        // Remplir le formulaire
        document.getElementById('compIdOriginal').value = comp.id;
        document.getElementById('inputCompId').value = comp.id;
        document.getElementById('inputCompId').readOnly = true; // ID non modifiable en édition
        document.getElementById('inputCompNom').value = comp.nom;
        document.getElementById('inputCompDateDebut').value = formatDateTimeLocal(comp.date_debut);
        document.getElementById('inputCompDateFin').value = formatDateTimeLocal(comp.date_fin);
        document.getElementById('inputCompActif').checked = comp.actif;
        
        // Ajouter les fruits
        const composition = comp.composition_json || comp.composition || {};
        Object.entries(composition).forEach(([nom, qty]) => {
            addFruitRow(nom, qty);
        });
        
    } else {
        // MODE CRÉATION
        console.log('➕ Nouvelle composition');
        title.textContent = 'Nouvelle Composition';
        submitBtn.textContent = 'Créer';
        currentComposition = null;
        
        document.getElementById('compIdOriginal').value = '';
        document.getElementById('inputCompId').readOnly = false;
        document.getElementById('inputCompActif').checked = true;
        
        // Ajouter une première ligne de fruit vide
        addFruitRow();
    }
    
    // Afficher le modal
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('show'), 10);
    
    // Focus sur le premier champ
    setTimeout(() => {
        if (!comp) {
            document.getElementById('inputCompNom')?.focus();
        }
    }, 100);
}

/**
 * Ferme le modal composition
 */
function closeCompModal() {
    const modal = document.getElementById('modalComp');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.classList.add('hidden');
        document.getElementById('compForm').reset();
        clearFormErrors();
        currentComposition = null;
    }, 200);
}

/**
 * Ajoute une ligne de fruit dans le formulaire
 * @param {String} nom - Nom du fruit (optionnel)
 * @param {Number} qty - Quantité (optionnel)
 */
function addFruitRow(nom = '', qty = '') {
    const container = document.getElementById('fruitsContainer');
    const index = container.children.length;
    
    const row = document.createElement('div');
    row.className = 'comp-fruit-row';
    row.dataset.index = index;
    
    row.innerHTML = `
        <div class="comp-fruit-input-group">
            <div class="form-group" style="margin: 0;">
                <input 
                    type="text" 
                    class="form-input fruit-name" 
                    placeholder="Nom du fruit"
                    value="${nom}"
                    data-index="${index}"
                    required
                >
            </div>
            <div class="form-group" style="margin: 0;">
                <input 
                    type="number" 
                    class="form-input fruit-qty" 
                    placeholder="Qté"
                    value="${qty}"
                    min="1"
                    max="100"
                    data-index="${index}"
                    required
                >
            </div>
        </div>
        <button 
            type="button" 
            class="btn-remove-fruit" 
            onclick="removeFruitRow(${index})"
            aria-label="Retirer ce fruit"
            title="Retirer"
        >
            <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        </button>
    `;
    
    container.appendChild(row);
    
    // Focus sur le champ nom si vide
    if (!nom) {
        setTimeout(() => {
            row.querySelector('.fruit-name')?.focus();
        }, 50);
    }
}

/**
 * Retire une ligne de fruit
 * @param {Number} index - Index de la ligne à retirer
 */
function removeFruitRow(index) {
    if (typeof Haptic !== 'undefined') Haptic.light();
    
    const row = document.querySelector(`.comp-fruit-row[data-index="${index}"]`);
    if (row) {
        row.style.animation = 'slideUp 0.2s ease-out';
        setTimeout(() => row.remove(), 200);
    }
}

/**
 * Gère la soumission du formulaire composition
 * @param {Event} e - Event submit
 */
async function handleCompFormSubmit(e) {
    e.preventDefault();
    
    if (typeof Haptic !== 'undefined') Haptic.medium();
    
    console.log('📝 Soumission formulaire composition');
    
    // Récupérer les données
    const formData = getCompFormData();
    
    // Valider
    const errors = validateCompForm(formData);
    
    if (errors.length > 0) {
        console.warn('⚠️ Erreurs de validation:', errors);
        displayFormErrors(errors);
        showNotification('Veuillez corriger les erreurs dans le formulaire', 'error');
        if (typeof Haptic !== 'undefined') Haptic.error();
        return;
    }
    
    // Afficher le spinner
    const submitBtn = document.getElementById('modalCompSubmit');
    const submitText = document.getElementById('submitCompText');
    const submitSpinner = document.getElementById('submitCompSpinner');
    
    submitBtn.disabled = true;
    submitText.classList.add('hidden');
    submitSpinner.classList.remove('hidden');
    
    try {
        if (currentComposition) {
            // MODE ÉDITION
            await updateComposition(currentComposition.id, formData);
            showNotification('Composition mise à jour avec succès ! ✅', 'success');
            if (typeof Haptic !== 'undefined') Haptic.success();
        } else {
            // MODE CRÉATION
            await createComposition(formData);
            showNotification('Composition créée avec succès ! ✅', 'success');
            if (typeof Haptic !== 'undefined') Haptic.success();
        }
        
        // Fermer le modal
        closeCompModal();
        
        // Recharger les compositions
        await loadCompositions();
        
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
        showNotification(`Erreur: ${error.message}`, 'error');
        if (typeof Haptic !== 'undefined') Haptic.error();
    } finally {
        // Masquer le spinner
        submitBtn.disabled = false;
        submitText.classList.remove('hidden');
        submitSpinner.classList.add('hidden');
    }
}

/**
 * Récupère les données du formulaire
 * @returns {Object} - Données de la composition
 */
function getCompFormData() {
    const id = document.getElementById('inputCompId').value.trim();
    const nom = document.getElementById('inputCompNom').value.trim();
    const dateDebut = document.getElementById('inputCompDateDebut').value;
    const dateFin = document.getElementById('inputCompDateFin').value;
    const actif = document.getElementById('inputCompActif').checked;
    
    // Récupérer les fruits
    const composition = {};
    const fruitRows = document.querySelectorAll('.comp-fruit-row');
    
    fruitRows.forEach(row => {
        const nameInput = row.querySelector('.fruit-name');
        const qtyInput = row.querySelector('.fruit-qty');
        
        if (nameInput && qtyInput) {
            const fruitName = nameInput.value.trim();
            const fruitQty = parseInt(qtyInput.value);
            
            if (fruitName && fruitQty > 0) {
                composition[fruitName] = fruitQty;
            }
        }
    });
    
    return {
        id,
        nom,
        date_debut: new Date(dateDebut).toISOString(),
        date_fin: new Date(dateFin).toISOString(),
        actif,
        composition_json: composition
    };
}

/**
 * Valide le formulaire composition
 * @param {Object} data - Données à valider
 * @returns {Array} - Liste des erreurs
 */
function validateCompForm(data) {
    const errors = [];
    
    // ID
    if (!data.id) {
        errors.push({ field: 'inputCompId', message: 'L\'identifiant est requis' });
    } else if (!/^comp-[a-z0-9-]+$/.test(data.id)) {
        errors.push({ field: 'inputCompId', message: 'Format invalide (ex: comp-ete-2025)' });
    } else if (!currentComposition && allCompositions.some(c => c.id === data.id)) {
        errors.push({ field: 'inputCompId', message: 'Cet identifiant existe déjà' });
    }
    
    // Nom
    if (!data.nom) {
        errors.push({ field: 'inputCompNom', message: 'Le nom est requis' });
    } else if (data.nom.length < 3) {
        errors.push({ field: 'inputCompNom', message: 'Le nom doit faire au moins 3 caractères' });
    }
    
    // Dates
    const debut = new Date(data.date_debut);
    const fin = new Date(data.date_fin);
    
    if (!data.date_debut) {
        errors.push({ field: 'inputCompDateDebut', message: 'La date de début est requise' });
    }
    
    if (!data.date_fin) {
        errors.push({ field: 'inputCompDateFin', message: 'La date de fin est requise' });
    }
    
    if (data.date_debut && data.date_fin && fin <= debut) {
        errors.push({ field: 'inputCompDateFin', message: 'La date de fin doit être après la date de début' });
    }
    
    // Composition
    const fruitsCount = Object.keys(data.composition_json).length;
    
    if (fruitsCount === 0) {
        errors.push({ field: 'errorFruits', message: 'Au moins 1 fruit est requis' });
    }
    
    for (const [fruit, qty] of Object.entries(data.composition_json)) {
        if (!fruit || fruit.length < 2) {
            errors.push({ field: 'errorFruits', message: `Nom de fruit invalide: "${fruit}"` });
        }
        if (!qty || qty <= 0) {
            errors.push({ field: 'errorFruits', message: `Quantité invalide pour ${fruit}` });
        }
        if (qty > 100) {
            errors.push({ field: 'errorFruits', message: `Quantité trop élevée pour ${fruit} (max 100)` });
        }
    }
    
    return errors;
}

/**
 * Affiche les erreurs de validation dans le formulaire
 * @param {Array} errors - Liste des erreurs
 */
function displayFormErrors(errors) {
    // Effacer les erreurs précédentes
    clearFormErrors();
    
    errors.forEach(error => {
        const errorSpan = document.getElementById(error.field === 'errorFruits' ? 'errorFruits' : `error${error.field.replace('input', '')}`);
        if (errorSpan) {
            errorSpan.textContent = error.message;
            errorSpan.style.display = 'block';
        }
        
        // Ajouter classe error sur l'input
        const input = document.getElementById(error.field);
        if (input) {
            input.classList.add('error');
        }
    });
}

/**
 * Efface les erreurs du formulaire
 */
function clearFormErrors() {
    document.querySelectorAll('.form-error').forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });
    
    document.querySelectorAll('.form-input.error').forEach(el => {
        el.classList.remove('error');
    });
}

/* ============================================
   UI - ACTIONS (Edit, Delete)
   ============================================ */

/**
 * Édite une composition
 * @param {String} id - ID de la composition
 */
function editComposition(id) {
    if (typeof Haptic !== 'undefined') Haptic.medium();
    
    console.log('✏️ Édition composition:', id);
    
    const comp = allCompositions.find(c => c.id === id);
    
    if (!comp) {
        console.error('❌ Composition non trouvée:', id);
        showNotification('Composition non trouvée', 'error');
        return;
    }
    
    openCompModal(comp);
}

/**
 * Ouvre le modal de confirmation de suppression
 * @param {String} id - ID de la composition
 */
function handleDeleteComposition(id) {
    if (typeof Haptic !== 'undefined') Haptic.medium();
    
    console.log('🗑️ Demande suppression:', id);
    
    const comp = allCompositions.find(c => c.id === id);
    
    if (!comp) {
        console.error('❌ Composition non trouvée:', id);
        showNotification('Composition non trouvée', 'error');
        return;
    }
    
    // Stocker l'ID dans le modal
    document.getElementById('modalConfirmDeleteComp').dataset.compId = id;
    
    // Afficher les détails
    const details = document.getElementById('deleteCompDetails');
    details.innerHTML = `
        <strong>${comp.nom}</strong><br>
        <small>${formatDateRange(comp.date_debut, comp.date_fin)}</small>
    `;
    
    // Afficher le modal
    const modal = document.getElementById('modalConfirmDeleteComp');
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('show'), 10);
}

/**
 * Ferme le modal de suppression
 */
function closeDeleteCompModal() {
    const modal = document.getElementById('modalConfirmDeleteComp');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.classList.add('hidden');
        delete modal.dataset.compId;
    }, 200);
}

/**
 * Confirme et exécute la suppression
 */
async function confirmDeleteComposition() {
    if (isDeleting) {
        console.warn('⚠️ Suppression déjà en cours');
        return;
    }
    
    const modal = document.getElementById('modalConfirmDeleteComp');
    const compId = modal.dataset.compId;
    
    if (!compId) {
        console.error('❌ Aucun ID de composition trouvé');
        closeDeleteCompModal();
        return;
    }
    
    if (typeof Haptic !== 'undefined') Haptic.heavy();
    
    isDeleting = true;
    
    // Afficher le spinner
    const deleteBtn = document.getElementById('btnConfirmDeleteComp');
    const deleteText = document.getElementById('deleteCompText');
    const deleteSpinner = document.getElementById('deleteCompSpinner');
    
    deleteBtn.disabled = true;
    deleteText.classList.add('hidden');
    deleteSpinner.classList.remove('hidden');
    
    try {
        await deleteComposition(compId);
        
        showNotification('Composition supprimée avec succès ! ✅', 'success');
        if (typeof Haptic !== 'undefined') Haptic.success();
        
        // Fermer le modal
        closeDeleteCompModal();
        
        // Recharger les compositions
        await loadCompositions();
        
    } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error);
        showNotification(`Erreur: ${error.message}`, 'error');
        if (typeof Haptic !== 'undefined') Haptic.error();
    } finally {
        // Masquer le spinner
        deleteBtn.disabled = false;
        deleteText.classList.remove('hidden');
        deleteSpinner.classList.add('hidden');
        isDeleting = false;
    }
}

/* ============================================
   HELPERS
   ============================================ */

/**
 * Génère un ID depuis un nom
 * @param {String} nom - Nom de la composition
 * @returns {String} - ID généré
 */
function generateIdFromName(nom) {
    if (!nom) return '';
    
    // Convertir en minuscules, retirer accents, remplacer espaces par tirets
    return 'comp-' + nom
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 30);
}

/**
 * Formate une plage de dates en français
 * @param {String} debut - Date ISO de début
 * @param {String} fin - Date ISO de fin
 * @returns {String} - Plage formatée
 */
function formatDateRange(debut, fin) {
    const dateDebut = new Date(debut);
    const dateFin = new Date(fin);
    
    const optionsShort = { day: 'numeric', month: 'short' };
    const optionsFull = { day: 'numeric', month: 'short', year: 'numeric' };
    
    const debutStr = dateDebut.toLocaleDateString('fr-FR', 
        dateDebut.getFullYear() === dateFin.getFullYear() ? optionsShort : optionsFull
    );
    const finStr = dateFin.toLocaleDateString('fr-FR', optionsFull);
    
    return `Du ${debutStr} au ${finStr}`;
}

/**
 * Formate une date ISO pour input datetime-local
 * @param {String} isoDate - Date ISO
 * @returns {String} - Date au format yyyy-MM-ddThh:mm
 */
function formatDateTimeLocal(isoDate) {
    const date = new Date(isoDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Affiche un toast de notification
 * @param {String} message - Message à afficher
 * @param {String} type - Type (success, error, warning, info)
 */
function showNotification(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    
    if (!container) {
        console.warn('⚠️ Toast container non trouvé');
        return;
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Animation d'entrée
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto-suppression après 5s
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

/**
 * Affiche le loader
 */
function showLoader() {
    document.getElementById('loaderComp')?.classList.remove('hidden');
}

/**
 * Masque le loader
 */
function hideLoader() {
    document.getElementById('loaderComp')?.classList.add('hidden');
}

/**
 * Affiche l'empty state
 */
function showEmptyState() {
    document.getElementById('emptyStateComp')?.classList.remove('hidden');
}

/**
 * Masque l'empty state
 */
function hideEmptyState() {
    document.getElementById('emptyStateComp')?.classList.add('hidden');
}

// Export des fonctions pour le HTML (onclick)
window.editComposition = editComposition;
window.handleDeleteComposition = handleDeleteComposition;
window.removeFruitRow = removeFruitRow;

console.log('✅ compositions.js chargé - VERSION 2.0.2');

