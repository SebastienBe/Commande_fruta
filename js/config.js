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

// Log de confirmation du chargement de la configuration
console.log('✅ Configuration chargée:', {
    API_BASE_URL,
    ENDPOINTS: Object.keys(API_ENDPOINTS).length,
    STATES: Object.keys(ORDER_STATES).length
});

