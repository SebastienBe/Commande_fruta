/* ============================================
   API - Gestion des appels n8n
   ============================================ */

/**
 * Fonction générique pour effectuer des appels API
 * @param {string} url - URL de l'endpoint
 * @param {string} method - Méthode HTTP (GET, POST, PUT, DELETE)
 * @param {Object|null} data - Données à envoyer (pour POST/PUT)
 * @returns {Promise<Object>} - Réponse de l'API
 */
async function fetchAPI(url, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        mode: 'cors',
        credentials: 'omit'
    };
    
    if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
    }
    
    console.log(`🌐 ${method} ${url}`, data || '');
    console.log('📤 Headers:', options.headers);
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        options.signal = controller.signal;
        
        const response = await fetch(url, options);
        
        clearTimeout(timeoutId);
        
        console.log('📡 Réponse reçue:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            headers: Array.from(response.headers.entries())
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ HTTP Error:', {
                status: response.status,
                body: errorText.substring(0, 200)
            });
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Lire le body comme texte d'abord
        const text = await response.text();
        
        if (!text || text.trim() === '') {
            console.warn('⚠️ Réponse vide');
            return null;
        }
        
        // Parser le JSON
        let result;
        try {
            result = JSON.parse(text);
            console.log('✅ JSON parsé avec succès');
        } catch (parseError) {
            console.error('❌ Erreur parsing JSON:', parseError.message);
            throw new Error('La réponse n\'est pas du JSON valide');
        }
        
        return result;
        
    } catch (error) {
        console.error('❌ Erreur fetchAPI:', error);
        
        // Gestion des erreurs spécifiques
        if (error.name === 'AbortError') {
            throw new Error('Délai d\'attente dépassé (10s)');
        } else if (error.message.includes('Failed to fetch')) {
            throw new Error('Impossible de contacter le serveur. Vérifiez votre connexion internet.');
        }
        
        throw error;
    }
}

/**
 * Récupère toutes les commandes depuis l'API
 * @returns {Promise<Array>} - Tableau des commandes
 */
async function getOrders() {
    console.log('📦 Récupération des commandes...');
    
    try {
        const response = await fetchAPI(API_ENDPOINTS.GET_ORDERS, 'GET');
        
        console.log('🔍 Type de réponse:', typeof response, Array.isArray(response) ? 'Array' : 'Object');
        console.log('🔍 Réponse brute:', JSON.stringify(response).substring(0, 300) + '...');
        
        if (!response) {
            console.warn('⚠️ Réponse vide');
            return [];
        }
        
        // Extraire les commandes selon la structure de la réponse
        let orders = [];
        
        // ⭐ CAS 1 : Array contenant un objet wrapper avec .data (structure n8n spécifique)
        // Exemple: [{ success: true, count: 32, data: [...] }]
        if (Array.isArray(response) && response.length > 0 && response[0].data && Array.isArray(response[0].data)) {
            orders = response[0].data;
            console.log(`📋 Format: Array[0].data (n8n wrapper) - ${orders.length} items`);
        }
        // CAS 2 : Objet avec propriété .data
        // Exemple: { success: true, data: [...] }
        else if (response.data && Array.isArray(response.data)) {
            orders = response.data;
            console.log(`📋 Format: Objet.data - ${orders.length} items`);
        }
        // CAS 3 : Objet avec success=true et .data
        else if (response.success && response.data) {
            orders = Array.isArray(response.data) ? response.data : [];
            console.log(`📋 Format: success + data - ${orders.length} items`);
        }
        // CAS 4 : Tableau direct
        // Exemple: [{ id: 1, ... }, { id: 2, ... }]
        else if (Array.isArray(response)) {
            orders = response;
            console.log(`📋 Format: Tableau direct - ${orders.length} items`);
        }
        // CAS 5 : Recherche automatique d'un tableau dans les propriétés
        else {
            console.warn('⚠️ Format inconnu, recherche d\'un tableau...');
            
            for (const key of Object.keys(response)) {
                if (Array.isArray(response[key])) {
                    orders = response[key];
                    console.log(`✅ Tableau trouvé dans "${key}" - ${orders.length} items`);
                    break;
                }
            }
        }
        
        console.log(`✅ ${orders.length} commande(s) extraite(s)`);
        
        // Afficher la première commande pour vérifier
        if (orders.length > 0) {
            console.log('🔍 Première commande:', orders[0]);
        }
        
        // Sauvegarder dans le cache (mode offline)
        if (OFFLINE_CONFIG.ENABLED && orders.length > 0) {
            saveOrdersToCache(orders);
        }
        
        return orders;
        
    } catch (error) {
        console.error('❌ Erreur getOrders:', error);
        
        // Fallback: charger depuis le cache
        if (OFFLINE_CONFIG.ENABLED) {
            console.log('💾 Tentative de chargement depuis le cache...');
            const cachedOrders = loadOrdersFromCache();
            if (cachedOrders && cachedOrders.length > 0) {
                console.log(`✅ ${cachedOrders.length} commande(s) chargée(s) depuis le cache`);
                return cachedOrders;
            }
        }
        
        throw error;
    }
}

/**
 * Crée une nouvelle commande
 * @param {Object} orderData - Données de la commande
 * @returns {Promise<Object>} - Commande créée
 */
async function createOrder(orderData) {
    console.log('➕ Création d\'une nouvelle commande...', orderData);
    
    try {
        // Ajouter la date de création (aujourd'hui)
        const today = new Date();
        const dateCreation = formatDateForAPI(today);
        
        const data = {
            Prenom: orderData.prenom,
            Nom: orderData.nom,
            Email: orderData.email,
            Telephone: orderData.telephone,
            Date_Recuperation: orderData.dateRecuperation,
            Nombre_Paniers: parseInt(orderData.nombrePaniers, 10),
            Date_Creation: dateCreation,
            etat: orderData.etat || ORDER_STATES.PENDING
        };
        
        const result = await fetchAPI(API_ENDPOINTS.CREATE_ORDER, 'POST', data);
        
        console.log('✅ Commande créée avec succès:', result);
        
        return result;
        
    } catch (error) {
        console.error('❌ Erreur createOrder:', error);
        throw error;
    }
}

/**
 * Met à jour une commande existante
 * @param {string|number} orderId - ID de la commande
 * @param {Object} updateData - Données à mettre à jour
 * @returns {Promise<Object>} - Commande mise à jour
 */
async function updateOrder(orderId, updateData) {
    console.log(`🔄 Mise à jour de la commande #${orderId}...`, updateData);
    
    try {
        const data = {
            id: orderId,
            ...updateData
        };
        
        const result = await fetchAPI(API_ENDPOINTS.UPDATE_ORDER, 'POST', data);
        
        console.log('✅ Commande mise à jour avec succès:', result);
        
        return result;
        
    } catch (error) {
        console.error('❌ Erreur updateOrder:', error);
        throw error;
    }
}

/**
 * Supprime une commande
 * @param {string|number} orderId - ID de la commande
 * @returns {Promise<Object>}
 */
async function deleteOrder(orderId) {
    console.log(`🗑️ Suppression de la commande #${orderId}...`);
    
    try {
        const data = {
            id: orderId
        };
        
        const result = await fetchAPI(API_ENDPOINTS.DELETE_ORDER, 'POST', data);
        
        console.log('✅ Commande supprimée avec succès:', result);
        
        return result;
        
    } catch (error) {
        console.error('❌ Erreur deleteOrder:', error);
        throw error;
    }
}

/* ============================================
   CACHE / OFFLINE MODE (LocalStorage)
   ============================================ */

/**
 * Sauvegarde les commandes dans le cache LocalStorage
 * @param {Array} orders - Tableau des commandes
 */
function saveOrdersToCache(orders) {
    try {
        const cacheData = {
            orders,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        
        localStorage.setItem(UI_CONFIG.STORAGE_KEY, JSON.stringify(cacheData));
        console.log('💾 Commandes sauvegardées dans le cache');
        
    } catch (error) {
        console.error('❌ Erreur sauvegarde cache:', error);
    }
}

/**
 * Charge les commandes depuis le cache LocalStorage
 * @returns {Array|null} - Tableau des commandes ou null
 */
function loadOrdersFromCache() {
    try {
        const cached = localStorage.getItem(UI_CONFIG.STORAGE_KEY);
        
        if (!cached) {
            console.log('ℹ️ Aucun cache disponible');
            return null;
        }
        
        const cacheData = JSON.parse(cached);
        
        // Vérifier l'âge du cache (max 1 heure)
        const cacheAge = Date.now() - new Date(cacheData.timestamp).getTime();
        const maxAge = 60 * 60 * 1000; // 1 heure en millisecondes
        
        if (cacheAge > maxAge) {
            console.log('⚠️ Cache expiré (> 1 heure)');
            return null;
        }
        
        console.log(`💾 Cache chargé (${cacheData.orders.length} commandes, âge: ${Math.round(cacheAge / 1000)}s)`);
        
        return cacheData.orders;
        
    } catch (error) {
        console.error('❌ Erreur lecture cache:', error);
        return null;
    }
}

/**
 * Vide le cache
 */
function clearCache() {
    try {
        localStorage.removeItem(UI_CONFIG.STORAGE_KEY);
        console.log('🗑️ Cache vidé');
    } catch (error) {
        console.error('❌ Erreur vidage cache:', error);
    }
}

/* ============================================
   UTILS
   ============================================ */

/**
 * Formate une date pour l'API (DD/MM/YYYY)
 * @param {Date|string} date - Date à formater
 * @returns {string} - Date au format DD/MM/YYYY
 */
function formatDateForAPI(date) {
    let d;
    
    if (typeof date === 'string') {
        // Si c'est déjà au format DD/MM/YYYY, le retourner tel quel
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
            return date;
        }
        
        // Si c'est au format YYYY-MM-DD (input type="date")
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            const [year, month, day] = date.split('-');
            return `${day}/${month}/${year}`;
        }
        
        d = new Date(date);
    } else {
        d = date;
    }
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}/${month}/${year}`;
}

// Export des fonctions pour les tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fetchAPI,
        getOrders,
        createOrder,
        updateOrder,
        deleteOrder,
        saveOrdersToCache,
        loadOrdersFromCache,
        clearCache,
        formatDateForAPI
    };
}

console.log('✅ Module API chargé');

