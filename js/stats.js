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

// Couleurs pour les fruits (cohérentes sur tous les graphiques)
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

// ===== STATE =====
let currentStats = [];
let currentYear = new Date().getFullYear();
let currentMonth = null; // null = toute l'année
let barChart = null;
let pieChart = null;
let sortColumn = null;
let sortDirection = 'asc';

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
    });
    
    // Filtre mois
    document.getElementById('filterMonth').addEventListener('change', (e) => {
        currentMonth = e.target.value ? parseInt(e.target.value) : null;
        if (typeof Haptic !== 'undefined') Haptic.light();
        // Recalculer puis recharger les stats
        recalculateStats(true); // true = recalcul automatique (sans confirmation)
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
            
            // Calculer total_fruits
            const totalFruits = Object.values(fruitsSortis).reduce((sum, qty) => sum + (parseInt(qty) || 0), 0);
            
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
 * @returns {Object} Données agrégées
 */
function aggregateStats() {
    if (currentStats.length === 0) {
        return {
            totalCommandes: 0,
            totalFruits: 0,
            topFruit: { nom: '-', quantite: 0 },
            fruitsParMois: [],
            repartitionFruits: {}
        };
    }
    
    // Total commandes
    const totalCommandes = currentStats.reduce((sum, stat) => sum + (stat.nombre_commandes || 0), 0);
    
    // Total fruits et répartition
    const repartitionFruits = {};
    let totalFruits = 0;
    
    currentStats.forEach(stat => {
        const fruits = stat.fruits_sortis || {};
        Object.entries(fruits).forEach(([fruit, qty]) => {
            const fruitKey = fruit.toLowerCase();
            repartitionFruits[fruitKey] = (repartitionFruits[fruitKey] || 0) + (qty || 0);
            totalFruits += qty || 0;
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
        totalCommandes,
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
function updateUI() {
    const aggregated = aggregateStats();
    
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
    
    // Mettre à jour le tableau
    renderTable();
}

/**
 * Affiche les KPIs
 * @param {Object} data - Données agrégées
 */
function renderKPIs(data) {
    // KPI Commandes
    document.getElementById('kpi-commandes').innerHTML = `
        <div class="kpi-icon">📦</div>
        <div class="kpi-value">${data.totalCommandes.toLocaleString('fr-FR')}</div>
        <div class="kpi-label">Commandes</div>
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
            fruitTotals[fruitKey] = (fruitTotals[fruitKey] || 0) + (qty || 0);
        });
    });
    
    // Trier les fruits par quantité totale (du plus vendu au moins vendu)
    const sortedFruits = Object.keys(fruitTotals).sort((a, b) => fruitTotals[b] - fruitTotals[a]);
    
    // Limiter à 8 fruits maximum pour la lisibilité
    const topFruits = sortedFruits.slice(0, 8);
    
    // Créer les datasets (1 par fruit, limité aux top fruits)
    const datasets = topFruits.map(fruit => {
        const fruitKey = fruit.toLowerCase();
        const fruitName = fruit.charAt(0).toUpperCase() + fruit.slice(1);
        return {
            label: fruitName,
            data: fruitsParMois.map(month => {
                const value = month.fruits[fruit] || month.fruits[fruitKey] || 0;
                return value;
            }),
            backgroundColor: FRUIT_COLORS[fruitKey] || FRUIT_COLORS[fruit] || '#CCCCCC',
            borderColor: FRUIT_COLORS[fruitKey] || FRUIT_COLORS[fruit] || '#CCCCCC',
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
    
    // Créer les données
    const labels = sortedFruits.map(fruit => fruit.charAt(0).toUpperCase() + fruit.slice(1));
    const values = sortedFruits.map(fruit => repartition[fruit]);
    const colors = sortedFruits.map(fruit => {
        const fruitKey = fruit.toLowerCase();
        return FRUIT_COLORS[fruitKey] || FRUIT_COLORS[fruit] || '#CCCCCC';
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
 * Affiche le tableau détaillé
 */
/**
 * Rend le tableau des détails mensuels (dynamique selon les données)
 */
function renderTable() {
    const tbody = document.getElementById('statsTableBody');
    const thead = document.querySelector('#statsTable thead tr');
    const cardsContainer = document.getElementById('statsCardsContainer');
    
    if (!tbody || !thead) {
        console.error('❌ Éléments du tableau introuvables');
        return;
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
                    aVal = fruitsA[sortColumn] || fruitsA[fruitKey] || 0;
                    bVal = fruitsB[sortColumn] || fruitsB[fruitKey] || 0;
            }
            
            if (sortDirection === 'asc') {
                return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            } else {
                return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
            }
        });
    }
    
    // Rendre les cards (vue liste principale)
    renderMobileCards(cardsContainer, sortedStats);
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
    
    console.log('✅ Graphiques Chart.js initialisés');
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
            return fruits[fruit] || 0;
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
 * Rend les cards pour mobile
 * @param {HTMLElement} container - Container pour les cards
 */
function renderMobileCards(container) {
    if (!container || currentStats.length === 0) {
        if (container) container.innerHTML = '';
        return;
    }
    
    // Extraire tous les fruits uniques
    const allFruitsSet = new Set();
    currentStats.forEach(stat => {
        const fruits = stat.fruits_sortis || {};
        Object.keys(fruits).forEach(fruit => {
            if (fruits[fruit] > 0) {
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
            return sum + (fruits[fruit] || 0);
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
                aVal = fruitsA[sortColumn] || fruitsA[fruitKey] || 0;
                bVal = fruitsB[sortColumn] || fruitsB[fruitKey] || 0;
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
            .filter(fruit => (fruits[fruit] || 0) > 0)
            .map(fruit => {
                const qty = fruits[fruit] || 0;
                const fruitName = fruit.charAt(0).toUpperCase() + fruit.slice(1);
                return `<div class="mobile-card-fruit">
                    <span class="mobile-card-fruit-name">${fruitName}</span>
                    <span class="mobile-card-fruit-qty">${qty.toLocaleString('fr-FR')}</span>
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

