/* ============================================
   STATISTIQUES MENSUELLES - Logique Frontend
   ============================================ */

// ===== CONFIGURATION =====
const STATS_API_BASE = 'https://n8n-seb.sandbox-jerem.com/webhook';
const STATS_API_ENDPOINTS = {
    GET: `${STATS_API_BASE}/stats`,
    RECALCULATE: `${STATS_API_BASE}/post-stats`,
    UPDATE: `${STATS_API_BASE}/stats/update`
};

// Couleurs pour les fruits (cohérentes sur tous les graphiques) - Utilisé comme fallback
const FRUIT_COLORS = {
    'ananas': '#FFD700',
    'kiwis': '#90EE90',
    'kiwi': '#90EE90',
    'mangues': '#FFA500',
    'mangue': '#FFA500',
    'bananes': '#FFFF00',
    'banane': '#FFFF00',
    'pommes': '#FF6347',
    'pomme': '#FF6347',
    'oranges': '#FF8C00',
    'orange': '#FF8C00',
    'peches': '#FFB6C1',
    'peche': '#FFB6C1',
    'abricots': '#FFA07A',
    'abricot': '#FFA07A',
    'cerises': '#DC143C',
    'cerise': '#DC143C',
    'raisin': '#9370DB',
    'raisins': '#9370DB',
    'grenade': '#FF1493',
    'grenades': '#FF1493',
    'mandarine': '#FFA500',
    'mandarines': '#FFA500',
    'figue': '#8B4513',
    'figues': '#8B4513',
    'datte': '#8B4513',
    'dattes': '#8B4513',
    'pasteque': '#32CD32',
    'pasteques': '#32CD32',
    'melon': '#FFD700',
    'melons': '#FFD700',
    'prune': '#9370DB',
    'prunes': '#9370DB',
    'fraise': '#FF69B4',
    'fraises': '#FF69B4',
    'poire': '#90EE90',
    'poires': '#90EE90',
    'nashi': '#FFE4B5'
};

/**
 * Génère une palette de couleurs harmonieuses
 * @param {Number} count - Nombre de couleurs à générer
 * @returns {Array<String>} - Tableau de couleurs hexadécimales
 */
function generateColorPalette(count) {
    if (count === 0) return [];
    if (count === 1) return ['#4CAF50'];
    
    const colors = [];
    
    // Palette de couleurs vives et distinctes
    const baseColors = [
        '#FF6B6B', // Rouge
        '#4ECDC4', // Turquoise
        '#45B7D1', // Bleu
        '#FFA07A', // Saumon
        '#98D8C8', // Vert menthe
        '#F7DC6F', // Jaune
        '#BB8FCE', // Violet
        '#85C1E2', // Bleu clair
        '#F8B739', // Orange
        '#52BE80', // Vert
        '#EC7063', // Rose
        '#5DADE2', // Bleu ciel
        '#F4D03F', // Jaune doré
        '#AF7AC5', // Mauve
        '#48C9B0', // Vert émeraude
        '#F1948A', // Rose saumon
        '#7FB3D3', // Bleu acier
        '#F9E79F', // Jaune pâle
        '#A569BD', // Violet foncé
        '#76D7C4'  // Turquoise clair
    ];
    
    // Si on a moins de couleurs que demandé, utiliser les couleurs de base
    if (count <= baseColors.length) {
        return baseColors.slice(0, count);
    }
    
    // Si on a besoin de plus de couleurs, générer des variations
    const palette = [...baseColors];
    
    for (let i = baseColors.length; i < count; i++) {
        // Générer des couleurs supplémentaires en variant la saturation et la luminosité
        const hue = (i * 137.508) % 360; // Angle d'or pour répartition uniforme
        const saturation = 60 + (i % 3) * 15; // Entre 60% et 90%
        const lightness = 50 + (i % 4) * 10; // Entre 50% et 80%
        
        // Convertir HSL en RGB puis en hex
        const hslToRgb = (h, s, l) => {
            s /= 100;
            l /= 100;
            const c = (1 - Math.abs(2 * l - 1)) * s;
            const x = c * (1 - Math.abs((h / 60) % 2 - 1));
            const m = l - c / 2;
            let r = 0, g = 0, b = 0;
            
            if (0 <= h && h < 60) {
                r = c; g = x; b = 0;
            } else if (60 <= h && h < 120) {
                r = x; g = c; b = 0;
            } else if (120 <= h && h < 180) {
                r = 0; g = c; b = x;
            } else if (180 <= h && h < 240) {
                r = 0; g = x; b = c;
            } else if (240 <= h && h < 300) {
                r = x; g = 0; b = c;
            } else if (300 <= h && h < 360) {
                r = c; g = 0; b = x;
            }
            
            r = Math.round((r + m) * 255);
            g = Math.round((g + m) * 255);
            b = Math.round((b + m) * 255);
            
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        };
        
        palette.push(hslToRgb(hue, saturation, lightness));
    }
    
    return palette;
}

/**
 * Obtient une couleur unique pour un produit selon sa position dans la liste
 * @param {Number} index - Index du produit dans la liste triée (0 = premier)
 * @param {Number} totalCount - Nombre total de produits
 * @returns {String} - Couleur hexadécimale
 */
function getColorByProductIndex(index, totalCount) {
    const palette = generateColorPalette(totalCount);
    return palette[index] || '#CCCCCC';
}

// ===== STATE =====
let currentStats = [];
let currentYear = new Date().getFullYear();
let currentMonth = null; // null = toute l'année
let barChart = null;
let pieChart = null;
let compositionsChart = null; // Graphique des compositions par mois
let sortColumn = null;
let sortDirection = 'asc';
let currentTab = 'dataviz'; // Onglet actif

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', initStats);

/**
 * Initialise l'application Statistiques
 */
function initStats() {
    console.log('📊 Initialisation Statistiques...');
    
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
    
    // Initialiser le menu mobile
    setupMobileMenu();
    
    // Initialiser les filtres
    setupFilters();
    
    // Initialiser les graphiques Chart.js
    setupCharts();
    
    // Initialiser les event listeners
    setupEventListeners();
    
    // Initialiser les onglets
    setupTabs();
    
    // Recalculer et charger les statistiques au chargement
    recalculateStats(true); // true = recalcul automatique (sans confirmation)
}

/**
 * Configure les filtres (année/mois)
 */
function setupFilters() {
    // Remplir le select année (année actuelle ± 5 ans)
    const yearSelect = document.getElementById('filterYear');
    const currentYearNum = new Date().getFullYear();
    
    for (let year = currentYearNum - 5; year <= currentYearNum + 2; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === currentYearNum) {
            option.selected = true;
            currentYear = year;
        }
        yearSelect.appendChild(option);
    }
    
    // Pré-sélectionner le mois actuel par défaut
    const monthSelect = document.getElementById('filterMonth');
    const currentMonthNum = new Date().getMonth() + 1;
    if (monthSelect) {
        monthSelect.value = currentMonthNum;
        currentMonth = currentMonthNum;
    }
}

/**
 * Configure les event listeners
 */
function setupEventListeners() {
    // Filtre année
    document.getElementById('filterYear').addEventListener('change', (e) => {
        currentYear = parseInt(e.target.value);
        if (typeof Haptic !== 'undefined') Haptic.light();
        // Recalculer puis recharger les stats
        recalculateStats(true); // true = recalcul automatique (sans confirmation)
        // Mettre à jour le graphique des compositions si l'onglet est actif
        if (currentTab === 'compositions') {
            updateCompositionsChart();
        }
    });
    
    // Filtre mois
    document.getElementById('filterMonth').addEventListener('change', (e) => {
        currentMonth = e.target.value ? parseInt(e.target.value) : null;
        if (typeof Haptic !== 'undefined') Haptic.light();
        // Recalculer puis recharger les stats
        recalculateStats(true); // true = recalcul automatique (sans confirmation)
        // Mettre à jour le graphique des compositions si l'onglet est actif
        if (currentTab === 'compositions') {
            updateCompositionsChart();
        }
    });
    
    // Navigation mois précédent
    document.getElementById('btnPrevMonth').addEventListener('click', () => {
        navigateMonth(-1);
    });
    
    // Navigation mois suivant
    document.getElementById('btnNextMonth').addEventListener('click', () => {
        navigateMonth(1);
    });
    
    // Bouton recalculer (manuel - avec confirmation)
    document.getElementById('btnRecalculate').addEventListener('click', () => {
        if (typeof Haptic !== 'undefined') Haptic.medium();
        recalculateStats(false); // false = recalcul manuel (avec confirmation)
    });
    
    // Bouton export CSV
    document.getElementById('btnExportCSV').addEventListener('click', () => {
        if (typeof Haptic !== 'undefined') Haptic.light();
        exportCSV();
    });
    
    // Tri tableau (sera configuré dynamiquement dans renderTable via setupTableSortListeners)
    // Les listeners sont ajoutés automatiquement quand le tableau est rendu
}

/**
 * Configure les onglets du dashboard
 */
function setupTabs() {
    const tabs = document.querySelectorAll('.stats-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabName = e.currentTarget.getAttribute('data-tab');
            switchTab(tabName);
            if (typeof Haptic !== 'undefined') Haptic.light();
        });
    });
}

/**
 * Change d'onglet
 * @param {String} tabName - Nom de l'onglet (dataviz, details, compositions)
 */
function switchTab(tabName) {
    // Mettre à jour l'état actif des onglets
    const tabs = document.querySelectorAll('.stats-tab');
    const panels = document.querySelectorAll('.stats-tab-panel');
    
    tabs.forEach(tab => {
        const isActive = tab.getAttribute('data-tab') === tabName;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', isActive);
    });
    
    panels.forEach(panel => {
        const isActive = panel.id === `panel${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`;
        panel.classList.toggle('active', isActive);
        panel.setAttribute('aria-hidden', !isActive);
    });
    
    currentTab = tabName;
    
    // Si on passe à l'onglet compositions, initialiser le graphique
    if (tabName === 'compositions') {
        updateCompositionsChart();
    }
    
    console.log(`📑 Onglet changé: ${tabName}`);
}

/**
 * Navigue vers le mois précédent ou suivant
 * @param {Number} direction - -1 pour précédent, 1 pour suivant
 */
function navigateMonth(direction) {
    if (typeof Haptic !== 'undefined') Haptic.light();
    
    // Si aucun mois n'est sélectionné, commencer par le mois actuel
    if (currentMonth === null) {
        currentMonth = new Date().getMonth() + 1;
    }
    
    // Calculer le nouveau mois
    let newMonth = currentMonth + direction;
    let newYear = currentYear;
    
    // Gérer les changements d'année
    if (newMonth < 1) {
        newMonth = 12;
        newYear -= 1;
    } else if (newMonth > 12) {
        newMonth = 1;
        newYear += 1;
    }
    
    // Vérifier que la nouvelle année est dans la plage disponible
    const yearSelect = document.getElementById('filterYear');
    const availableYears = Array.from(yearSelect.options).map(opt => parseInt(opt.value));
    
    if (!availableYears.includes(newYear)) {
        // Si l'année n'est pas disponible, ne pas naviguer
        console.warn(`⚠️ Année ${newYear} hors de la plage disponible`);
        if (typeof Haptic !== 'undefined') Haptic.error();
        return;
    }
    
    // Mettre à jour les variables globales
    currentYear = newYear;
    currentMonth = newMonth;
    
    // Mettre à jour les selects
    yearSelect.value = newYear;
    const monthSelect = document.getElementById('filterMonth');
    monthSelect.value = newMonth;
    
    console.log(`📅 Navigation: ${direction > 0 ? 'suivant' : 'précédent'} -> ${newYear}-${String(newMonth).padStart(2, '0')}`);
    
    // Recharger les stats
    recalculateStats(true); // true = recalcul automatique (sans confirmation)
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

// ===== API CALLS =====

/**
 * Charge les statistiques depuis l'API
 * @param {Number} year - Année
 * @param {Number|null} month - Mois (null = toute l'année)
 */
async function loadStats(year = currentYear, month = currentMonth) {
    showLoading();
    
    try {
        console.log(`📥 Chargement stats: année=${year}, mois=${month || 'tous'}`);
        
        // Construire l'URL avec format "YYYY-MM" ou "YYYY" seulement
        let url = STATS_API_ENDPOINTS.GET;
        if (month) {
            // Format "YYYY-MM" (ex: "2025-06")
            const moisStr = `${year}-${String(month).padStart(2, '0')}`;
            url += `?mois=${moisStr}`;
            console.log(`🔍 Filtre mois: ${moisStr}`);
        } else {
            // Format "YYYY" seulement - filtre par année
            url += `?annee=${year}`;
            console.log(`🔍 Filtre année: ${year}`);
        }
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response URL:', url);
        
        if (!response.ok) {
            throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
        
        // Vérifier si la réponse est vide
        const responseText = await response.text();
        console.log('📄 Response text:', responseText.substring(0, 200));
        
        if (!responseText || responseText.trim() === '') {
            console.warn('⚠️ Réponse vide');
            currentStats = [];
            updateUI();
            return;
        }
        
        // Parser le JSON
        let data;
        try {
            data = JSON.parse(responseText);
            console.log('✅ Données reçues:', data);
        } catch (parseError) {
            console.error('❌ Erreur parsing JSON:', parseError);
            throw new Error('Réponse invalide du serveur');
        }
        
        // Parser les données selon la structure n8n
        let stats = [];
        
        // Format 1 : Array direct (format actuel de n8n)
        if (Array.isArray(data)) {
            stats = data;
            console.log('📋 Format détecté: Array direct');
        }
        // Format 2 : Objet avec {count, stats}
        else if (data.stats && Array.isArray(data.stats)) {
            stats = data.stats;
            console.log('📋 Format détecté: Objet avec stats');
        }
        // Format 3 : Objet unique (fallback)
        else if (data && typeof data === 'object') {
            stats = [data];
            console.log('📋 Format détecté: Objet unique');
        }
        
        console.log(`📊 ${stats.length} stat(s) trouvée(s) dans la réponse`);
        
        // Adapter au format de la DataTable (composition_id, mois, stats_json)
        currentStats = stats.map(stat => {
            // Extraire année et mois depuis le format "YYYY-MM"
            // Le format peut être dans stat.mois directement (ex: "2025-12")
            // ou dans stat.composition_id (ex: "stats-2025-12")
            let moisStr = stat.mois;
            if (!moisStr && stat.composition_id) {
                // Extraire depuis composition_id (ex: "stats-2025-12" -> "2025-12")
                moisStr = stat.composition_id.replace(/^stats-/, '');
            }
            
            if (!moisStr) {
                console.warn('⚠️ Impossible d\'extraire le mois de:', stat);
                moisStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
            }
            
            const [annee, mois] = moisStr.split('-').map(n => parseInt(n));
            console.log(`📅 Mois extrait: ${moisStr} -> année=${annee}, mois=${mois}`);
            
            // Parser stats_json (format DataTable)
            let fruitsSortis = {};
            if (stat.stats_json) {
                if (typeof stat.stats_json === 'string') {
                    try {
                        fruitsSortis = JSON.parse(stat.stats_json);
                    } catch (e) {
                        console.error('❌ Erreur parsing stats_json:', e, stat.stats_json);
                        fruitsSortis = {};
                    }
                } else {
                    fruitsSortis = stat.stats_json;
                }
            } else if (stat.fruits_sortis) {
                // Fallback sur l'ancien format
                if (typeof stat.fruits_sortis === 'string') {
                    try {
                        fruitsSortis = JSON.parse(stat.fruits_sortis);
                    } catch (e) {
                        fruitsSortis = {};
                    }
                } else {
                    fruitsSortis = stat.fruits_sortis;
                }
            }
            
            // Calculer total_fruits (gérer les deux formats : nombre ou objet {qty, unite})
            const totalFruits = Object.values(fruitsSortis).reduce((sum, data) => {
                if (typeof data === 'object' && data !== null) {
                    return sum + (parseFloat(data.qty) || 0);
                } else {
                    return sum + (parseFloat(data) || 0);
                }
            }, 0);
            
            // Utiliser paniers_total depuis la DataTable
            const nombreCommandes = parseInt(stat.paniers_total) || parseInt(stat.nombre_commandes) || 0;
            
            return {
                id: stat.composition_id || stat.id || `stats-${moisStr}`,
                annee: annee || new Date().getFullYear(),
                mois: mois || 1,
                nombre_commandes: nombreCommandes,
                fruits_sortis: fruitsSortis,
                total_fruits: totalFruits,
                derniere_maj: stat.updatedAt || stat.derniere_maj || new Date().toISOString()
            };
        });
        
        console.log(`✅ ${currentStats.length} statistique(s) chargée(s)`);
        
        // Mettre à jour l'interface
        updateUI();
        
    } catch (error) {
        console.error('❌ Erreur chargement stats:', error);
        showNotification('Erreur lors du chargement des statistiques', 'error');
        currentStats = [];
        updateUI();
    } finally {
        hideLoading();
    }
}

/**
 * Recalcule toutes les statistiques depuis les commandes
 */
/**
 * Recalcule toutes les statistiques depuis les commandes
 * @param {Boolean} auto - Si true, recalcul automatique sans confirmation. Si false, demande confirmation.
 */
async function recalculateStats(auto = false) {
    // Demander confirmation seulement si recalcul manuel (bouton)
    if (!auto) {
        if (!confirm('Recalculer toutes les statistiques depuis les commandes ?\n\nCette opération peut prendre quelques secondes.')) {
            return;
        }
    }
    
    showLoading();
    
    try {
        console.log(`🔄 Recalcul de toutes les stats depuis les commandes... (${auto ? 'automatique' : 'manuel'})`);
        
        // Utiliser le nouvel endpoint UPDATE
        const response = await fetch(STATS_API_ENDPOINTS.UPDATE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({}) // Pas besoin de paramètres, recalcule tout
        });
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('✅ Stats recalculées:', result);
        
        // Afficher notification seulement si recalcul manuel ou si erreur
        if (!auto) {
            showNotification(`Statistiques recalculées avec succès ! ✅\n${result.count || 0} mois mis à jour`, 'success');
            if (typeof Haptic !== 'undefined') Haptic.success();
        } else {
            console.log(`✅ Recalcul automatique réussi: ${result.count || 0} mois mis à jour`);
        }
        
        // Recharger les stats après recalcul
        await loadStats();
        
    } catch (error) {
        console.error('❌ Erreur recalcul:', error);
        showNotification('Erreur lors du recalcul des statistiques', 'error');
        if (typeof Haptic !== 'undefined') Haptic.error();
    } finally {
        hideLoading();
    }
}

// ===== DATA PROCESSING =====

/**
 * Agrège les statistiques pour calculer les KPIs
 * @returns {Promise<Object>} Données agrégées
 */
/**
 * Parse une date au format DD/MM/YYYY ou ISO et retourne un objet Date
 * @param {String} dateStr - Date au format DD/MM/YYYY ou ISO
 * @returns {Date|null} - Objet Date ou null si invalide
 */
function parseOrderDate(dateStr) {
    if (!dateStr) return null;
    
    try {
        // Format DD/MM/YYYY
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1; // Mois 0-indexed
                const year = parseInt(parts[2], 10);
                return new Date(year, month, day);
            }
        }
        
        // Format ISO (YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss)
        return new Date(dateStr);
    } catch (error) {
        console.warn('⚠️ Erreur parsing date:', dateStr, error);
        return null;
    }
}

async function aggregateStats() {
    // Charger le nombre de commandes (rows dans GET_ALL orders) filtrées par année/mois
    let nombreCommandes = 0;
    try {
        let allOrders = [];
        
        // Utiliser la fonction getOrders de api.js si disponible
        if (typeof getOrders === 'function') {
            allOrders = await getOrders();
        } else {
            // Fallback: charger directement depuis l'API
            const response = await fetch('https://n8n-seb.sandbox-jerem.com/webhook/orders');
            if (response.ok) {
                const data = await response.json();
                // Gérer différents formats de réponse n8n
                if (Array.isArray(data) && data.length > 0 && data[0].data && Array.isArray(data[0].data)) {
                    allOrders = data[0].data;
                } else if (data.data && Array.isArray(data.data)) {
                    allOrders = data.data;
                } else if (data.success && data.data && Array.isArray(data.data)) {
                    allOrders = data.data;
                } else if (Array.isArray(data)) {
                    allOrders = data;
                }
            }
        }
        
        // Filtrer les commandes selon l'année et le mois sélectionnés
        const filteredOrders = allOrders.filter(order => {
            const dateRecup = order.Date_Recuperation || order.date_recuperation || order.DateRecuperation || '';
            if (!dateRecup) return false;
            
            const date = parseOrderDate(dateRecup);
            if (!date || isNaN(date.getTime())) return false;
            
            const orderYear = date.getFullYear();
            const orderMonth = date.getMonth() + 1; // Mois 1-indexed
            
            // Filtrer par année
            if (orderYear !== currentYear) return false;
            
            // Filtrer par mois si un mois est sélectionné
            if (currentMonth !== null && orderMonth !== currentMonth) return false;
            
            return true;
        });
        
        nombreCommandes = filteredOrders.length;
        console.log(`📊 Nombre de commandes filtrées (année=${currentYear}, mois=${currentMonth || 'tous'}): ${nombreCommandes} sur ${allOrders.length} total`);
        
    } catch (error) {
        console.error('❌ Erreur chargement commandes pour KPI:', error);
    }
    
    if (currentStats.length === 0) {
        return {
            nombreCommandes,
            totalPaniers: 0,
            totalFruits: 0,
            topFruit: { nom: '-', quantite: 0 },
            fruitsParMois: [],
            repartitionFruits: {}
        };
    }
    
    // Total paniers (anciennement "totalCommandes")
    const totalPaniers = currentStats.reduce((sum, stat) => sum + (stat.nombre_commandes || 0), 0);
    
    // Total fruits et répartition
    const repartitionFruits = {};
    let totalFruits = 0;
    
    currentStats.forEach(stat => {
        const fruits = stat.fruits_sortis || {};
        Object.entries(fruits).forEach(([fruit, data]) => {
            const fruitKey = fruit.toLowerCase();
            // Gérer les deux formats : nombre ou objet {qty, unite}
            let qty;
            if (typeof data === 'object' && data !== null) {
                qty = parseFloat(data.qty) || 0;
            } else {
                qty = parseFloat(data) || 0;
            }
            repartitionFruits[fruitKey] = (repartitionFruits[fruitKey] || 0) + qty;
            totalFruits += qty;
        });
    });
    
    // Fruit le plus commandé
    const topFruitEntry = Object.entries(repartitionFruits).reduce((max, [fruit, qty]) => {
        return qty > max.quantite ? { nom: fruit, quantite: qty } : max;
    }, { nom: '-', quantite: 0 });
    
    // Données pour bar chart (par mois)
    const fruitsParMois = currentStats.map(stat => ({
        mois: stat.mois,
        annee: stat.annee,
        label: getMonthName(stat.mois),
        fruits: stat.fruits_sortis || {}
    }));
    
    return {
        nombreCommandes,
        totalPaniers,
        totalFruits,
        topFruit: topFruitEntry,
        fruitsParMois,
        repartitionFruits
    };
}

// ===== UI RENDERING =====

/**
 * Met à jour toute l'interface
 */
async function updateUI() {
    const aggregated = await aggregateStats();
    
    // Afficher/masquer empty state
    const emptyState = document.getElementById('statsEmptyState');
    const tableWrapper = document.querySelector('.stats-table-wrapper');
    
    if (currentStats.length === 0) {
        emptyState.classList.remove('hidden');
        tableWrapper.style.display = 'none';
    } else {
        emptyState.classList.add('hidden');
        tableWrapper.style.display = 'block';
    }
    
    // Mettre à jour les KPIs
    renderKPIs(aggregated);
    
    // Mettre à jour les graphiques
    updateBarChart(aggregated);
    updatePieChart(aggregated);
    
    // Mettre à jour le graphique des compositions si l'onglet est actif
    if (currentTab === 'compositions') {
        updateCompositionsChart();
    }
    
    // Mettre à jour le tableau
    renderTable();
}

/**
 * Affiche les KPIs
 * @param {Object} data - Données agrégées
 */
function renderKPIs(data) {
    // KPI Commandes (nombre de rows dans GET_ALL orders)
    document.getElementById('kpi-commandes').innerHTML = `
        <div class="kpi-icon">📦</div>
        <div class="kpi-value">${(data.nombreCommandes || 0).toLocaleString('fr-FR')}</div>
        <div class="kpi-label">Commandes</div>
    `;
    
    // KPI Nombre panier
    document.getElementById('kpi-paniers').innerHTML = `
        <div class="kpi-icon">🛒</div>
        <div class="kpi-value">${(data.totalPaniers || 0).toLocaleString('fr-FR')}</div>
        <div class="kpi-label">Nombre panier</div>
    `;
    
    // KPI Fruits
    document.getElementById('kpi-fruits').innerHTML = `
        <div class="kpi-icon">🍊</div>
        <div class="kpi-value">${data.totalFruits.toLocaleString('fr-FR')}</div>
        <div class="kpi-label">Fruits sortis</div>
    `;
    
    // KPI Top Fruit
    const topFruitName = data.topFruit.nom !== '-' 
        ? data.topFruit.nom.charAt(0).toUpperCase() + data.topFruit.nom.slice(1)
        : '-';
    document.getElementById('kpi-top').innerHTML = `
        <div class="kpi-icon">🏆</div>
        <div class="kpi-value">${topFruitName}</div>
        <div class="kpi-label">${data.topFruit.quantite.toLocaleString('fr-FR')} unités</div>
    `;
}

/**
 * Met à jour le graphique en barres groupées (plus lisible)
 * @param {Object} data - Données agrégées
 */
function updateBarChart(data) {
    if (!barChart) return;
    
    const fruitsParMois = data.fruitsParMois;
    if (fruitsParMois.length === 0) {
        barChart.data.labels = [];
        barChart.data.datasets = [];
        barChart.update('none');
        return;
    }
    
    // Extraire tous les fruits uniques et trier par quantité totale (décroissant)
    const fruitTotals = {};
    fruitsParMois.forEach(month => {
        Object.entries(month.fruits).forEach(([fruit, qty]) => {
            const fruitKey = fruit.toLowerCase();
            // Gérer les deux formats
            let qtyValue;
            if (typeof qty === 'object' && qty !== null) {
                qtyValue = parseFloat(qty.qty) || 0;
            } else {
                qtyValue = parseFloat(qty) || 0;
            }
            fruitTotals[fruitKey] = (fruitTotals[fruitKey] || 0) + qtyValue;
        });
    });
    
    // Trier les fruits par quantité totale (du plus vendu au moins vendu)
    const sortedFruits = Object.keys(fruitTotals).sort((a, b) => fruitTotals[b] - fruitTotals[a]);
    
    // Limiter à 8 fruits maximum pour la lisibilité
    const topFruits = sortedFruits.slice(0, 8);
    
    // Créer les datasets (1 par fruit, limité aux top fruits) avec couleurs uniques par produit
    const datasets = topFruits.map((fruit, index) => {
        const fruitKey = fruit.toLowerCase();
        const fruitName = fruit.charAt(0).toUpperCase() + fruit.slice(1);
        // Chaque produit a une couleur unique basée sur sa position dans la liste
        const color = getColorByProductIndex(index, topFruits.length);
        
        return {
            label: fruitName,
            data: fruitsParMois.map(month => {
                const data = month.fruits[fruit] || month.fruits[fruitKey];
                // Gérer les deux formats : nombre ou objet {qty, unite}
                if (typeof data === 'object' && data !== null) {
                    return parseFloat(data.qty) || 0;
                } else {
                    return parseFloat(data) || 0;
                }
            }),
            backgroundColor: color,
            borderColor: color,
            borderWidth: 2,
            borderRadius: 4,
            barThickness: 'flex',
            maxBarThickness: 50
        };
    });
    
    // Mettre à jour les labels (mois avec année si nécessaire)
    const labels = fruitsParMois.map(month => {
        const monthName = getMonthName(month.mois);
        const year = month.annee || new Date().getFullYear();
        // Afficher l'année seulement si on affiche plusieurs années
        const showYear = fruitsParMois.some(m => m.annee !== year);
        return showYear ? `${monthName} ${year}` : monthName;
    });
    
    barChart.data.labels = labels;
    barChart.data.datasets = datasets;
    barChart.update('active'); // Animation douce
}

/**
 * Met à jour le graphique en camembert
 * @param {Object} data - Données agrégées
 */
function updatePieChart(data) {
    if (!pieChart) return;
    
    const repartition = data.repartitionFruits;
    const fruits = Object.keys(repartition);
    
    if (fruits.length === 0) {
        pieChart.data.labels = [];
        pieChart.data.datasets = [];
        pieChart.update('none');
        return;
    }
    
    // Trier par quantité décroissante
    const sortedFruits = fruits.sort((a, b) => repartition[b] - repartition[a]);
    
    // Créer les données avec couleurs uniques par produit (basées sur la position dans la liste)
    const labels = sortedFruits.map(fruit => fruit.charAt(0).toUpperCase() + fruit.slice(1));
    const values = sortedFruits.map(fruit => repartition[fruit]);
    const colors = sortedFruits.map((fruit, index) => {
        // Chaque produit a une couleur unique basée sur sa position dans la liste
        return getColorByProductIndex(index, sortedFruits.length);
    });
    
    pieChart.data.labels = labels;
    pieChart.data.datasets = [{
        data: values,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#FFFFFF'
    }];
    pieChart.update('none');
}

/**
 * Met à jour le graphique des compositions par mois
 */
async function updateCompositionsChart() {
    // Vérifier si le graphique existe, sinon l'initialiser
    const compositionsCtx = document.getElementById('compositionsChart');
    if (!compositionsCtx) {
        console.warn('⚠️ Canvas compositionsChart introuvable');
        return;
    }
    
    // Si le graphique n'existe pas, l'initialiser
    if (!compositionsChart) {
        // Vérifier si un graphique existe déjà sur ce canvas et le détruire
        const existingChart = Chart.getChart(compositionsCtx);
        if (existingChart) {
            existingChart.destroy();
            compositionsChart = null;
        }
        
        compositionsChart = new Chart(compositionsCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: [],
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            padding: window.innerWidth < 480 ? 8 : 12,
                            usePointStyle: true,
                            font: {
                                size: window.innerWidth < 480 ? 9 : window.innerWidth < 768 ? 10 : 12
                            },
                            boxWidth: window.innerWidth < 480 ? 10 : 12
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            title: (items) => {
                                if (!items || items.length === 0) return '';
                                return `📅 ${items[0].label}`;
                            },
                            label: (context) => {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y || 0;
                                return `${label}: ${value.toLocaleString('fr-FR')} panier(s)`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: false,
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: window.innerWidth < 480 ? 8 : window.innerWidth < 768 ? 9 : 11
                            },
                            maxRotation: window.innerWidth < 480 ? 45 : 0,
                            minRotation: 0
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            font: {
                                size: window.innerWidth < 480 ? 8 : window.innerWidth < 768 ? 9 : 11
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    }
                }
            }
        });
        console.log('✅ Graphique compositions initialisé dans updateCompositionsChart');
    }
    
    const emptyState = document.getElementById('compositionsEmptyState');
    const chartContainer = document.getElementById('compositionsChartContainer');
    
    try {
        // Charger les commandes filtrées
        let allOrders = [];
        if (typeof getOrders === 'function') {
            allOrders = await getOrders();
        } else {
            const response = await fetch('https://n8n-seb.sandbox-jerem.com/webhook/orders');
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data) && data.length > 0 && data[0].data && Array.isArray(data[0].data)) {
                    allOrders = data[0].data;
                } else if (data.data && Array.isArray(data.data)) {
                    allOrders = data.data;
                } else if (Array.isArray(data)) {
                    allOrders = data;
                }
            }
        }
        
        // Filtrer les commandes selon l'année et le mois sélectionnés
        const filteredOrders = allOrders.filter(order => {
            const dateRecup = order.Date_Recuperation || order.date_recuperation || order.DateRecuperation || '';
            if (!dateRecup) return false;
            
            const date = parseOrderDate(dateRecup);
            if (!date || isNaN(date.getTime())) return false;
            
            const orderYear = date.getFullYear();
            const orderMonth = date.getMonth() + 1;
            
            if (orderYear !== currentYear) return false;
            if (currentMonth !== null && orderMonth !== currentMonth) return false;
            
            return true;
        });
        
        if (filteredOrders.length === 0) {
            if (emptyState) emptyState.classList.remove('hidden');
            if (chartContainer) chartContainer.style.display = 'none';
            compositionsChart.data.labels = [];
            compositionsChart.data.datasets = [];
            compositionsChart.update('none');
            return;
        }
        
        if (emptyState) emptyState.classList.add('hidden');
        if (chartContainer) chartContainer.style.display = 'block';
        
        // Grouper par mois et par composition_id
        const dataByMonth = {};
        
        filteredOrders.forEach(order => {
            const dateRecup = order.Date_Recuperation || order.date_recuperation || order.DateRecuperation || '';
            const date = parseOrderDate(dateRecup);
            if (!date) return;
            
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const moisKey = `${year}-${String(month).padStart(2, '0')}`;
            
            const compositionId = order.composition_id || order.compositionId || 'Sans composition';
            const nombrePaniers = parseInt(order.Nombre_Paniers || order.nombrePaniers || order.nombre_paniers || 1);
            
            if (!dataByMonth[moisKey]) {
                dataByMonth[moisKey] = {};
            }
            
            if (!dataByMonth[moisKey][compositionId]) {
                dataByMonth[moisKey][compositionId] = 0;
            }
            
            dataByMonth[moisKey][compositionId] += nombrePaniers;
        });
        
        // Trier les mois
        const sortedMonths = Object.keys(dataByMonth).sort();
        
        // Extraire toutes les compositions uniques
        const allCompositions = new Set();
        Object.values(dataByMonth).forEach(compositions => {
            Object.keys(compositions).forEach(compId => allCompositions.add(compId));
        });
        
        const compositionsList = Array.from(allCompositions).sort();
        
        // Créer les datasets (un par composition)
        const datasets = compositionsList.map((compId, index) => {
            const color = getColorByProductIndex(index, compositionsList.length);
            
            return {
                label: compId,
                data: sortedMonths.map(mois => dataByMonth[mois][compId] || 0),
                backgroundColor: color,
                borderColor: color,
                borderWidth: 2,
                borderRadius: 4
            };
        });
        
        // Créer les labels (noms des mois)
        const labels = sortedMonths.map(mois => {
            const [year, month] = mois.split('-');
            return getMonthName(parseInt(month)) + ' ' + year;
        });
        
        // Mettre à jour le graphique
        compositionsChart.data.labels = labels;
        compositionsChart.data.datasets = datasets;
        compositionsChart.update('active');
        
        console.log('✅ Graphique compositions mis à jour:', { labels: labels.length, datasets: datasets.length });
        
    } catch (error) {
        console.error('❌ Erreur mise à jour graphique compositions:', error);
        if (emptyState) emptyState.classList.remove('hidden');
        if (chartContainer) chartContainer.style.display = 'none';
    }
}

/**
 * Affiche le tableau détaillé
 */
/**
 * Rend le tableau des détails mensuels (dynamique selon les données)
 */
function renderTable() {
    const tbody = document.getElementById('statsTableBody');
    const thead = document.querySelector('#statsTable thead tr');
    const cardsContainer = document.getElementById('statsCardsContainer');
    
    console.log('🔍 renderTable appelé:', {
        tbody: !!tbody,
        thead: !!thead,
        cardsContainer: !!cardsContainer,
        currentStatsLength: currentStats.length
    });
    
    if (!tbody || !thead) {
        console.error('❌ Éléments du tableau introuvables', { tbody: !!tbody, thead: !!thead });
        return;
    }
    
    if (!cardsContainer) {
        console.warn('⚠️ Container cards introuvable');
    }
    
    if (currentStats.length === 0) {
        tbody.innerHTML = '';
        if (cardsContainer) cardsContainer.innerHTML = '';
        // Garder seulement les colonnes de base
        thead.innerHTML = `
            <th data-sort="mois" class="sortable">Mois</th>
            <th data-sort="commandes" class="sortable">Commandes</th>
            <th data-sort="total" class="sortable">Total Fruits</th>
        `;
        setupTableSortListeners();
        return;
    }
    
    // Trier les stats si nécessaire
    let sortedStats = [...currentStats];
    if (sortColumn) {
        sortedStats.sort((a, b) => {
            let aVal, bVal;
            
            switch (sortColumn) {
                case 'mois':
                    const aYear = a.annee || parseInt(a.mois?.split('-')[0]) || 0;
                    const bYear = b.annee || parseInt(b.mois?.split('-')[0]) || 0;
                    const aMonth = parseInt(a.mois?.split('-')[1]) || 0;
                    const bMonth = parseInt(b.mois?.split('-')[1]) || 0;
                    aVal = aYear * 100 + aMonth;
                    bVal = bYear * 100 + bMonth;
                    break;
                case 'commandes':
                    aVal = a.nombre_commandes || 0;
                    bVal = b.nombre_commandes || 0;
                    break;
                case 'total':
                    aVal = a.total_fruits || 0;
                    bVal = b.total_fruits || 0;
                    break;
                default:
                    const fruitsA = a.fruits_sortis || {};
                    const fruitsB = b.fruits_sortis || {};
                    const fruitKey = sortColumn.toLowerCase();
                    const dataA = fruitsA[sortColumn] || fruitsA[fruitKey];
                    const dataB = fruitsB[sortColumn] || fruitsB[fruitKey];
                    
                    // Gérer les deux formats
                    if (typeof dataA === 'object' && dataA !== null) {
                        aVal = parseFloat(dataA.qty) || 0;
                    } else {
                        aVal = parseFloat(dataA) || 0;
                    }
                    
                    if (typeof dataB === 'object' && dataB !== null) {
                        bVal = parseFloat(dataB.qty) || 0;
                    } else {
                        bVal = parseFloat(dataB) || 0;
                    }
            }
            
            if (sortDirection === 'asc') {
                return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            } else {
                return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
            }
        });
    }
    
    // Rendre les cards (vue liste principale)
    if (cardsContainer) {
        // renderMobileCards est async, mais on ne peut pas rendre renderTable async
        // car elle est appelée depuis updateUI qui est déjà async
        renderMobileCards(cardsContainer).catch(error => {
            console.error('❌ Erreur rendu cards:', error);
        });
    }
}

/**
 * Configure les event listeners pour le tri du tableau
 */
function setupTableSortListeners() {
    document.querySelectorAll('#statsTable thead th.sortable').forEach(th => {
        // Supprimer les anciens listeners
        const newTh = th.cloneNode(true);
        th.parentNode.replaceChild(newTh, th);
        
        // Ajouter le nouveau listener
        newTh.addEventListener('click', () => {
            const column = newTh.dataset.sort;
            if (sortColumn === column) {
                sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                sortColumn = column;
                sortDirection = 'asc';
            }
            renderTable();
        });
    });
}

// ===== CHART.JS SETUP =====

/**
 * Initialise les graphiques Chart.js
 */
function setupCharts() {
    // Détruire les graphiques existants s'ils existent
    if (barChart) {
        barChart.destroy();
        barChart = null;
    }
    if (pieChart) {
        pieChart.destroy();
        pieChart = null;
    }
    if (compositionsChart) {
        compositionsChart.destroy();
        compositionsChart = null;
    }
    
    // Bar Chart
    const barCtx = document.getElementById('barChart');
    if (!barCtx) {
        console.error('❌ Canvas barChart introuvable');
        return;
    }
    
    barChart = new Chart(barCtx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                x: {
                    stacked: false, // Barres groupées au lieu d'empilées
                    grid: { 
                        display: false,
                        drawBorder: true,
                        borderColor: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        font: {
                            size: window.innerWidth < 480 ? 8 : window.innerWidth < 768 ? 9 : 12,
                            weight: '500'
                        },
                        color: 'rgba(0, 0, 0, 0.7)',
                        maxRotation: window.innerWidth < 480 ? 60 : window.innerWidth < 768 ? 45 : 0,
                        minRotation: window.innerWidth < 480 ? 60 : window.innerWidth < 768 ? 45 : 0,
                        maxTicksLimit: window.innerWidth < 480 ? 6 : window.innerWidth < 768 ? 8 : 12
                    }
                },
                y: {
                    stacked: false,
                    beginAtZero: true,
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        stepSize: null, // Auto
                        font: {
                            size: window.innerWidth < 480 ? 8 : window.innerWidth < 768 ? 9 : 11
                        },
                        color: 'rgba(0, 0, 0, 0.6)',
                        maxTicksLimit: window.innerWidth < 480 ? 5 : window.innerWidth < 768 ? 7 : 10,
                        callback: function(value) {
                            if (value >= 1000) {
                                return (value / 1000).toFixed(1) + 'k';
                            }
                            return value.toLocaleString('fr-FR');
                        }
                    },
                    title: {
                        display: window.innerWidth >= 480, // Masquer sur très petit écran
                        text: 'Nombre de fruits',
                        font: {
                            size: window.innerWidth < 480 ? 9 : window.innerWidth < 768 ? 11 : 13,
                            weight: '600'
                        },
                        color: 'rgba(0, 0, 0, 0.7)',
                        padding: { top: window.innerWidth < 480 ? 5 : 10, bottom: window.innerWidth < 480 ? 5 : 10 }
                    }
                }
            },
            plugins: {
                legend: {
                    display: window.innerWidth >= 360, // Masquer sur très petit écran
                    position: 'bottom',
                    align: 'center',
                    labels: {
                        padding: window.innerWidth < 480 ? 6 : window.innerWidth < 768 ? 8 : 12,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: {
                            size: window.innerWidth < 480 ? 8 : window.innerWidth < 768 ? 9 : 11,
                            weight: '500'
                        },
                        boxWidth: window.innerWidth < 480 ? 8 : window.innerWidth < 768 ? 10 : 12,
                        boxHeight: window.innerWidth < 480 ? 8 : window.innerWidth < 768 ? 10 : 12,
                        maxWidth: window.innerWidth < 480 ? 100 : window.innerWidth < 768 ? 120 : 150
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    padding: 12,
                    titleFont: {
                        size: window.innerWidth < 480 ? 11 : window.innerWidth < 768 ? 12 : 13,
                        weight: '600'
                    },
                    bodyFont: {
                        size: window.innerWidth < 480 ? 10 : window.innerWidth < 768 ? 11 : 12
                    },
                    padding: window.innerWidth < 480 ? 8 : 12,
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    displayColors: true,
                    callbacks: {
                        title: (items) => {
                            if (!items || items.length === 0) return '';
                            return `📅 ${items[0].label}`;
                        },
                        label: (context) => {
                            const value = context.parsed.y;
                            // Calculer le total depuis les données du graphique pour ce point
                            const dataIndex = context.dataIndex;
                            const chart = context.chart;
                            let total = 0;
                            
                            if (chart && chart.data && chart.data.datasets) {
                                chart.data.datasets.forEach(dataset => {
                                    if (dataset.data && dataset.data[dataIndex] !== undefined) {
                                        total += dataset.data[dataIndex] || 0;
                                    }
                                });
                            }
                            
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${context.dataset.label}: ${value.toLocaleString('fr-FR')} unités${total > value ? ` (${percentage}%)` : ''}`;
                        },
                        footer: (items) => {
                            if (!items || items.length === 0) return '';
                            const total = items.reduce((sum, item) => sum + (item.parsed.y || 0), 0);
                            return `Total: ${total.toLocaleString('fr-FR')} unités`;
                        }
                    }
                },
                datalabels: {
                    display: false // Désactivé par défaut (trop chargé)
                }
            }
        }
    });
    
    // Pie Chart
    const pieCtx = document.getElementById('pieChart');
    if (!pieCtx) {
        console.error('❌ Canvas pieChart introuvable');
        return;
    }
    
    // Vérifier si un graphique existe déjà sur ce canvas et le détruire
    const existingPieChart = Chart.getChart(pieCtx);
    if (existingPieChart) {
        existingPieChart.destroy();
    }
    
    pieChart = new Chart(pieCtx.getContext('2d'), {
        type: 'pie',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: window.innerWidth >= 360,
                    position: 'bottom',
                    labels: {
                        padding: window.innerWidth < 480 ? 6 : window.innerWidth < 768 ? 10 : 15,
                        usePointStyle: true,
                        font: {
                            size: window.innerWidth < 480 ? 8 : window.innerWidth < 768 ? 9 : 11
                        },
                        boxWidth: window.innerWidth < 480 ? 8 : window.innerWidth < 768 ? 10 : 12,
                        maxWidth: window.innerWidth < 480 ? 100 : window.innerWidth < 768 ? 120 : 150
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (item) => {
                            const total = item.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((item.parsed / total) * 100).toFixed(1);
                            return `${item.label} : ${item.parsed.toLocaleString('fr-FR')} unités (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    
    // Compositions Chart (initialisé mais vide, sera rempli par updateCompositionsChart)
    const compositionsCtx = document.getElementById('compositionsChart');
    if (compositionsCtx) {
        // Détruire le graphique existant s'il existe
        if (compositionsChart) {
            compositionsChart.destroy();
            compositionsChart = null;
        }
        
        // Vérifier si un graphique existe déjà sur ce canvas et le détruire (double vérification)
        const existingCompositionsChart = Chart.getChart(compositionsCtx);
        if (existingCompositionsChart) {
            existingCompositionsChart.destroy();
        }
        
        compositionsChart = new Chart(compositionsCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: [],
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            padding: window.innerWidth < 480 ? 8 : 12,
                            usePointStyle: true,
                            font: {
                                size: window.innerWidth < 480 ? 9 : window.innerWidth < 768 ? 10 : 12
                            },
                            boxWidth: window.innerWidth < 480 ? 10 : 12
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            title: (items) => {
                                if (!items || items.length === 0) return '';
                                return `📅 ${items[0].label}`;
                            },
                            label: (context) => {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y || 0;
                                return `${label}: ${value.toLocaleString('fr-FR')} panier(s)`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: false,
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: window.innerWidth < 480 ? 8 : window.innerWidth < 768 ? 9 : 11
                            },
                            maxRotation: window.innerWidth < 480 ? 45 : 0,
                            minRotation: 0
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            font: {
                                size: window.innerWidth < 480 ? 8 : window.innerWidth < 768 ? 9 : 11
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    }
                }
            }
        });
        console.log('✅ Graphique compositions initialisé');
    }
    
    console.log('✅ Graphiques Chart.js initialisés');
}

/**
 * Met à jour le graphique des compositions par mois
 */
async function updateCompositionsChart() {
    if (!compositionsChart) {
        console.warn('⚠️ Graphique compositions non initialisé');
        return;
    }
    
    const emptyState = document.getElementById('compositionsEmptyState');
    const chartContainer = document.getElementById('compositionsChartContainer');
    
    try {
        // Charger les commandes filtrées
        let allOrders = [];
        if (typeof getOrders === 'function') {
            allOrders = await getOrders();
        } else {
            const response = await fetch('https://n8n-seb.sandbox-jerem.com/webhook/orders');
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data) && data.length > 0 && data[0].data && Array.isArray(data[0].data)) {
                    allOrders = data[0].data;
                } else if (data.data && Array.isArray(data.data)) {
                    allOrders = data.data;
                } else if (Array.isArray(data)) {
                    allOrders = data;
                }
            }
        }
        
        // Filtrer les commandes selon l'année et le mois sélectionnés
        const filteredOrders = allOrders.filter(order => {
            const dateRecup = order.Date_Recuperation || order.date_recuperation || order.DateRecuperation || '';
            if (!dateRecup) return false;
            
            const date = parseOrderDate(dateRecup);
            if (!date || isNaN(date.getTime())) return false;
            
            const orderYear = date.getFullYear();
            const orderMonth = date.getMonth() + 1;
            
            if (orderYear !== currentYear) return false;
            if (currentMonth !== null && orderMonth !== currentMonth) return false;
            
            return true;
        });
        
        if (filteredOrders.length === 0) {
            if (emptyState) emptyState.classList.remove('hidden');
            if (chartContainer) chartContainer.style.display = 'none';
            compositionsChart.data.labels = [];
            compositionsChart.data.datasets = [];
            compositionsChart.update('none');
            return;
        }
        
        if (emptyState) emptyState.classList.add('hidden');
        if (chartContainer) chartContainer.style.display = 'block';
        
        // Grouper par mois et par composition_id
        const dataByMonth = {};
        
        filteredOrders.forEach(order => {
            const dateRecup = order.Date_Recuperation || order.date_recuperation || order.DateRecuperation || '';
            const date = parseOrderDate(dateRecup);
            if (!date) return;
            
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const moisKey = `${year}-${String(month).padStart(2, '0')}`;
            
            const compositionId = order.composition_id || order.compositionId || 'Sans composition';
            const nombrePaniers = parseInt(order.Nombre_Paniers || order.nombrePaniers || order.nombre_paniers || 1);
            
            if (!dataByMonth[moisKey]) {
                dataByMonth[moisKey] = {};
            }
            
            if (!dataByMonth[moisKey][compositionId]) {
                dataByMonth[moisKey][compositionId] = 0;
            }
            
            dataByMonth[moisKey][compositionId] += nombrePaniers;
        });
        
        // Trier les mois
        const sortedMonths = Object.keys(dataByMonth).sort();
        
        // Extraire toutes les compositions uniques
        const allCompositions = new Set();
        Object.values(dataByMonth).forEach(compositions => {
            Object.keys(compositions).forEach(compId => allCompositions.add(compId));
        });
        
        const compositionsList = Array.from(allCompositions).sort();
        
        // Créer les datasets (un par composition)
        const datasets = compositionsList.map((compId, index) => {
            const color = getColorByProductIndex(index, compositionsList.length);
            
            return {
                label: compId,
                data: sortedMonths.map(mois => dataByMonth[mois][compId] || 0),
                backgroundColor: color,
                borderColor: color,
                borderWidth: 2,
                borderRadius: 4
            };
        });
        
        // Créer les labels (noms des mois)
        const labels = sortedMonths.map(mois => {
            const [year, month] = mois.split('-');
            return getMonthName(parseInt(month)) + ' ' + year;
        });
        
        // Mettre à jour le graphique
        compositionsChart.data.labels = labels;
        compositionsChart.data.datasets = datasets;
        compositionsChart.update('active');
        
        console.log('✅ Graphique compositions mis à jour:', { labels: labels.length, datasets: datasets.length });
        
    } catch (error) {
        console.error('❌ Erreur mise à jour graphique compositions:', error);
        if (emptyState) emptyState.classList.remove('hidden');
        if (chartContainer) chartContainer.style.display = 'none';
    }
}

// ===== HELPERS =====

/**
 * Retourne le nom du mois en français
 * @param {Number} monthNumber - Numéro du mois (1-12)
 * @returns {String} Nom du mois
 */
function getMonthName(monthNumber) {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return months[monthNumber - 1] || `Mois ${monthNumber}`;
}

/**
 * Exporte les statistiques en CSV
 */
function exportCSV() {
    if (currentStats.length === 0) {
        showNotification('Aucune donnée à exporter', 'warning');
        return;
    }
    
    // Extraire tous les fruits
    const allFruits = new Set();
    currentStats.forEach(stat => {
        Object.keys(stat.fruits_sortis || {}).forEach(fruit => allFruits.add(fruit));
    });
    
    const fruitsArray = Array.from(allFruits);
    
    // Header CSV
    let csv = '\uFEFF'; // BOM UTF-8 pour Excel
    csv += 'Année,Mois,Nom Mois,Commandes,Total Fruits,' + fruitsArray.join(',') + '\n';
    
    // Lignes
    currentStats.forEach(stat => {
        const fruitValues = fruitsArray.map(fruit => {
            const fruits = stat.fruits_sortis || {};
            const data = fruits[fruit];
            
            // Gérer les deux formats : nombre ou objet {qty, unite}
            if (typeof data === 'object' && data !== null) {
                return parseFloat(data.qty) || 0;
            } else {
                return parseFloat(data) || 0;
            }
        });
        
        csv += `${stat.annee},${stat.mois},"${getMonthName(stat.mois)}",${stat.nombre_commandes || 0},${stat.total_fruits || 0},${fruitValues.join(',')}\n`;
    });
    
    // Téléchargement
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `stats_${currentYear}${currentMonth ? '_' + String(currentMonth).padStart(2, '0') : ''}.csv`;
    link.click();
    
    showNotification('Export CSV réussi ! ✅', 'success');
    if (typeof Haptic !== 'undefined') Haptic.success();
}

/**
 * Affiche un message de notification
 * @param {String} message - Message à afficher
 * @param {String} type - Type (success, error, warning, info)
 */
function showNotification(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.setAttribute('role', 'alert');
    
    container.appendChild(toast);
    
    // Animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Supprimer après 3 secondes
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Affiche le loading overlay
 */
function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.remove('hidden');
}

/**
 * Cache le loading overlay
 */
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.add('hidden');
}

/**
 * Crée un mapping fruit -> unité depuis les compositions actives
 * @returns {Promise<Object>} Mapping {fruit: unite}
 */
async function createFruitUnitMapping() {
    const fruitUnitMap = {};
    
    try {
        // Récupérer les compositions si la fonction est disponible
        if (typeof getCompositions === 'function') {
            const compositions = await getCompositions();
            
            // Parcourir toutes les compositions (actives et inactives)
            // Prendre la dernière unité trouvée pour chaque fruit
            compositions.forEach(comp => {
                let compositionData = comp.composition_json || comp.composition || {};
                
                // Parser si c'est une string
                if (typeof compositionData === 'string') {
                    try {
                        compositionData = JSON.parse(compositionData);
                    } catch (e) {
                        console.warn('⚠️ Erreur parsing composition_json:', e);
                        return;
                    }
                }
                
                // Extraire les unités
                Object.entries(compositionData).forEach(([fruit, data]) => {
                    const fruitKey = fruit.toLowerCase().trim();
                    
                    // Gérer les deux formats
                    if (typeof data === 'object' && data !== null && data.unite) {
                        // Nouveau format : stocker l'unité
                        fruitUnitMap[fruitKey] = data.unite;
                    } else if (typeof data === 'object' && data !== null) {
                        // Format avec qty mais sans unite explicite -> par défaut 'piece'
                        if (!fruitUnitMap[fruitKey]) {
                            fruitUnitMap[fruitKey] = 'piece';
                        }
                    }
                    // Si c'est un nombre simple, on garde 'piece' par défaut (déjà dans le code)
                });
            });
            
            console.log('📊 Mapping fruit -> unité créé:', fruitUnitMap);
        }
    } catch (error) {
        console.warn('⚠️ Erreur lors de la création du mapping fruit -> unité:', error);
    }
    
    return fruitUnitMap;
}

/**
 * Rend les cards pour mobile
 * @param {HTMLElement} container - Container pour les cards
 */
async function renderMobileCards(container) {
    if (!container || currentStats.length === 0) {
        if (container) container.innerHTML = '';
        return;
    }
    
    // Créer le mapping fruit -> unité depuis les compositions
    const fruitUnitMap = await createFruitUnitMapping();
    
    // Extraire tous les fruits uniques
    const allFruitsSet = new Set();
    currentStats.forEach(stat => {
        const fruits = stat.fruits_sortis || {};
        Object.keys(fruits).forEach(fruit => {
            const data = fruits[fruit];
            let qty;
            if (typeof data === 'object' && data !== null) {
                qty = parseFloat(data.qty) || 0;
            } else {
                qty = parseFloat(data) || 0;
            }
            if (qty > 0) {
                allFruitsSet.add(fruit.toLowerCase());
            }
        });
    });
    
    const allFruits = Array.from(allFruitsSet).sort();
    
    // Calculer les totaux par fruit
    const fruitTotals = {};
    allFruits.forEach(fruit => {
        fruitTotals[fruit] = currentStats.reduce((sum, stat) => {
            const fruits = stat.fruits_sortis || {};
            const data = fruits[fruit];
            if (typeof data === 'object' && data !== null) {
                return sum + (parseFloat(data.qty) || 0);
            } else {
                return sum + (parseFloat(data) || 0);
            }
        }, 0);
    });
    
    // Trier par quantité décroissante
    const sortedFruits = allFruits.sort((a, b) => {
        const diff = fruitTotals[b] - fruitTotals[a];
        return diff !== 0 ? diff : a.localeCompare(b);
    });
    
    // Trier les stats selon le tri actuel
    let sortedStats = [...currentStats];
    if (sortColumn) {
        sortedStats.sort((a, b) => {
            let aVal, bVal;
            
            if (sortColumn === 'mois') {
                const aYear = a.annee || parseInt(a.mois?.split('-')[0]) || 0;
                const bYear = b.annee || parseInt(b.mois?.split('-')[0]) || 0;
                const aMonth = parseInt(a.mois?.split('-')[1]) || 0;
                const bMonth = parseInt(b.mois?.split('-')[1]) || 0;
                aVal = aYear * 100 + aMonth;
                bVal = bYear * 100 + bMonth;
            } else if (sortColumn === 'commandes') {
                aVal = a.nombre_commandes || 0;
                bVal = b.nombre_commandes || 0;
            } else if (sortColumn === 'total') {
                aVal = a.total_fruits || 0;
                bVal = b.total_fruits || 0;
            } else {
                // Tri par fruit
                const fruitsA = a.fruits_sortis || {};
                const fruitsB = b.fruits_sortis || {};
                const fruitKey = sortColumn.toLowerCase();
                const dataA = fruitsA[sortColumn] || fruitsA[fruitKey];
                const dataB = fruitsB[sortColumn] || fruitsB[fruitKey];
                
                // Gérer les deux formats
                if (typeof dataA === 'object' && dataA !== null) {
                    aVal = parseFloat(dataA.qty) || 0;
                } else {
                    aVal = parseFloat(dataA) || 0;
                }
                
                if (typeof dataB === 'object' && dataB !== null) {
                    bVal = parseFloat(dataB.qty) || 0;
                } else {
                    bVal = parseFloat(dataB) || 0;
                }
            }
            
            if (typeof aVal === 'string') {
                return sortDirection === 'asc' 
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            } else {
                return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
            }
        });
    }
    
    // Générer les cards
    const cardsHtml = sortedStats.map(stat => {
        const monthName = getMonthName(stat.mois);
        const year = stat.annee || (stat.mois ? stat.mois.split('-')[0] : new Date().getFullYear());
        const fruits = stat.fruits_sortis || {};
        
        // Afficher TOUS les fruits avec quantité > 0 (pas de limite)
        const allFruitsWithQty = sortedFruits
            .filter(fruit => {
                const data = fruits[fruit];
                if (typeof data === 'object' && data !== null) {
                    return (parseFloat(data.qty) || 0) > 0;
                } else {
                    return (parseFloat(data) || 0) > 0;
                }
            })
            .map(fruit => {
                const data = fruits[fruit];
                let qty, unite;
                
                // Gérer les deux formats
                if (typeof data === 'object' && data !== null) {
                    qty = parseFloat(data.qty) || 0;
                    unite = data.unite || 'piece';
                } else {
                    qty = parseFloat(data) || 0;
                    // Utiliser le mapping depuis les compositions si disponible
                    const fruitKey = fruit.toLowerCase().trim();
                    unite = fruitUnitMap[fruitKey] || 'piece';
                }
                
                const fruitName = fruit.charAt(0).toUpperCase() + fruit.slice(1);
                const qtyDisplay = unite === 'kg' ? qty.toFixed(1) : Math.round(qty);
                const uniteLabel = unite === 'kg' ? 'kg' : 'pièce(s)';
                
                return `<div class="mobile-card-fruit">
                    <span class="mobile-card-fruit-name">${fruitName}</span>
                    <span class="mobile-card-fruit-qty">${qtyDisplay.toLocaleString('fr-FR')} ${uniteLabel}</span>
                </div>`;
            }).join('');
        
        return `
            <article class="mobile-stats-card" role="listitem">
                <div class="mobile-card-header">
                    <h4 class="mobile-card-month">${monthName} ${year}</h4>
                    <div class="mobile-card-stats">
                        <div class="mobile-card-stat">
                            <span class="mobile-card-stat-label">📦 Commandes</span>
                            <span class="mobile-card-stat-value">${(stat.nombre_commandes || 0).toLocaleString('fr-FR')}</span>
                        </div>
                        <div class="mobile-card-stat">
                            <span class="mobile-card-stat-label">🍎 Total Fruits</span>
                            <span class="mobile-card-stat-value">${(stat.total_fruits || 0).toLocaleString('fr-FR')}</span>
                        </div>
                    </div>
                </div>
                <div class="mobile-card-fruits">
                    ${allFruitsWithQty || '<div class="mobile-card-no-fruits">Aucun fruit</div>'}
                </div>
            </article>
        `;
    }).join('');
    
    container.innerHTML = cardsHtml;
}

console.log('✅ stats.js chargé');

