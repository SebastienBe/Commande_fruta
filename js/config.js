/* ============================================
   CONFIGURATION - API & Constantes
   ============================================ */

/**
 * Configuration de l'API n8n
 * Backend : https://n8n-seb.sandbox-jerem.com
 */
const API_BASE_URL = 'https://n8n-seb.sandbox-jerem.com/webhook/orders';

const API_ENDPOINTS = {
    GET_ORDERS: API_BASE_URL,                    // GET - Récupérer toutes les commandes
    CREATE_ORDER: `${API_BASE_URL}/create`,      // POST - Créer une nouvelle commande
    UPDATE_ORDER: `${API_BASE_URL}/update`,      // POST - Mettre à jour une commande
    DELETE_ORDER: `${API_BASE_URL}/delete`       // POST - Supprimer une commande
};

/**
 * États possibles des commandes
 * Utilisé pour les filtres et la validation
 */
const ORDER_STATES = {
    PENDING: 'En préparation',
    READY: 'Prêt',
    DELIVERED: 'Livré'
};

/**
 * Configuration des couleurs pour les badges d'état
 * Mapping avec les variables CSS
 */
const STATE_COLORS = {
    [ORDER_STATES.PENDING]: {
        bg: 'var(--status-pending)',
        text: '#000',
        icon: '🔧'
    },
    [ORDER_STATES.READY]: {
        bg: 'var(--status-ready)',
        text: '#fff',
        icon: '✅'
    },
    [ORDER_STATES.DELIVERED]: {
        bg: 'var(--status-delivered)',
        text: '#fff',
        icon: '📦'
    }
};

/**
 * Configuration de la validation des champs
 */
const VALIDATION_RULES = {
    prenom: {
        minLength: 2,
        maxLength: 50,
        pattern: /^[a-zA-ZÀ-ÿ\s'-]+$/,
        errorMessage: 'Le prénom doit contenir au moins 2 caractères (lettres uniquement)'
    },
    nom: {
        minLength: 2,
        maxLength: 50,
        pattern: /^[a-zA-ZÀ-ÿ\s'-]+$/,
        errorMessage: 'Le nom doit contenir au moins 2 caractères (lettres uniquement)'
    },
    email: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        errorMessage: 'Format d\'email invalide (ex: nom@exemple.fr)'
    },
    telephone: {
        pattern: /^0[67]\d{8}$/,  // Format nettoyé (sans espaces)
        displayPattern: /^0[67]( \d{2}){4}$/,  // Format affiché avec espaces
        errorMessage: 'Format de téléphone invalide (ex: 06 12 34 56 78)'
    },
    nombrePaniers: {
        min: 1,
        max: 50,
        errorMessage: 'Le nombre de paniers doit être entre 1 et 50'
    },
    dateRecuperation: {
        minDate: () => new Date().setHours(0, 0, 0, 0),  // Aujourd'hui minimum
        errorMessage: 'La date de récupération doit être aujourd\'hui ou dans le futur'
    }
};

/**
 * Configuration de l'interface
 */
const UI_CONFIG = {
    // Durée d'affichage des toasts (en ms)
    TOAST_DURATION: 5000,
    
    // Délai de debounce pour la recherche (en ms)
    SEARCH_DEBOUNCE: 300,
    
    // Nombre maximum de commandes à afficher par page (pour Phase 2)
    ORDERS_PER_PAGE: 50,
    
    // Clé LocalStorage pour le cache
    STORAGE_KEY: 'paniers_orders_cache',
    
    // Clé LocalStorage pour les préférences utilisateur
    PREFERENCES_KEY: 'paniers_user_preferences'
};

/**
 * Messages d'erreur par défaut
 */
const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Impossible de contacter le serveur. Vérifiez votre connexion internet.',
    API_ERROR: 'Une erreur est survenue lors de la communication avec le serveur.',
    VALIDATION_ERROR: 'Veuillez corriger les erreurs dans le formulaire.',
    LOAD_ERROR: 'Erreur lors du chargement des commandes.',
    CREATE_ERROR: 'Erreur lors de la création de la commande.',
    UPDATE_ERROR: 'Erreur lors de la mise à jour de la commande.',
    DELETE_ERROR: 'Erreur lors de la suppression de la commande.'
};

/**
 * Messages de succès par défaut
 */
const SUCCESS_MESSAGES = {
    ORDER_CREATED: 'Commande créée avec succès ! ✅',
    ORDER_UPDATED: 'Commande mise à jour avec succès ! ✅',
    ORDER_DELETED: 'Commande supprimée avec succès ! ✅',
    STATE_CHANGED: 'État de la commande modifié ! ✅'
};

/**
 * Configuration du mode offline (Phase 2)
 */
const OFFLINE_CONFIG = {
    ENABLED: true,
    SYNC_INTERVAL: 30000,  // 30 secondes
    MAX_RETRY: 3
};

// Export des constantes pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        API_BASE_URL,
        API_ENDPOINTS,
        ORDER_STATES,
        STATE_COLORS,
        VALIDATION_RULES,
        UI_CONFIG,
        ERROR_MESSAGES,
        SUCCESS_MESSAGES,
        OFFLINE_CONFIG
    };
}

/* ============================================
   COMPOSITIONS - API Partagée
   ============================================ */

const COMP_API_URL = 'https://n8n-seb.sandbox-jerem.com/webhook/compositions';

// Cache global des compositions
let cachedCompositions = [];
let compositionsCacheTime = 0;
const COMPOSITIONS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Récupère les compositions (avec cache)
 * @returns {Promise<Array>} Liste des compositions
 */
async function getCompositions() {
    // Vérifier le cache
    const now = Date.now();
    if (cachedCompositions.length > 0 && (now - compositionsCacheTime) < COMPOSITIONS_CACHE_DURATION) {
        console.log('📦 Compositions depuis le cache:', cachedCompositions.length);
        return cachedCompositions;
    }
    
    console.log('📡 Fetch compositions depuis API...');
    
    try {
        const response = await fetch(COMP_API_URL);
        
        if (!response.ok) {
            throw new Error(`Erreur ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log('🔍 [getCompositions] Données brutes reçues:', JSON.stringify(data).substring(0, 500));
        
        // Parser les données (gérer les différents formats)
        let compositions = [];
        
        if (data.compositions && data.compositions.compositions && Array.isArray(data.compositions.compositions)) {
            compositions = data.compositions.compositions;
            console.log('📋 Format: data.compositions.compositions');
        } else if (data.compositions && Array.isArray(data.compositions)) {
            compositions = data.compositions;
            console.log('📋 Format: data.compositions');
        } else if (Array.isArray(data)) {
            compositions = data;
            console.log('📋 Format: Array direct');
        }
        
        // 🔍 Debug: afficher les id_compo de chaque composition
        console.log('🔍 [getCompositions] id_compo dans les compositions:');
        compositions.forEach((comp, idx) => {
            console.log(`  ${idx + 1}. "${comp.nom}": id_compo = "${comp.id_compo}", id = ${comp.id}`);
        });
        
        // Mettre en cache
        cachedCompositions = compositions;
        compositionsCacheTime = now;
        
        console.log('✅ Compositions chargées:', compositions.length);
        
        return compositions;
        
    } catch (error) {
        console.error('❌ Erreur chargement compositions:', error);
        return [];
    }
}

// Log de confirmation du chargement de la configuration
console.log('✅ Configuration chargée:', {
    API_BASE_URL,
    ENDPOINTS: Object.keys(API_ENDPOINTS).length,
    STATES: Object.keys(ORDER_STATES).length,
    COMP_API_URL
});

