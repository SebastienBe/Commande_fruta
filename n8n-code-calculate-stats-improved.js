// ============================================
// CALCUL STATS MENSUELLES - Version Améliorée
// ============================================

// Récupérer les données
const orders = $('Get row(s)1').all().map(item => item.json);
const compositions = $('Get row(s)2').all().map(item => item.json);

console.log(`📊 ${orders.length} commande(s) trouvée(s)`);
console.log(`🍎 ${compositions.length} composition(s) trouvée(s)`);

// Fonction pour parser une date au format français "DD/MM/YYYY"
function parseFrenchDate(dateStr) {
  if (!dateStr) return null;
  
  // Si c'est déjà une date ISO, la parser directement
  if (dateStr.includes('T') || (dateStr.includes('-') && dateStr.length > 10)) {
    return new Date(dateStr);
  }
  
  // Parser le format français "DD/MM/YYYY"
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Mois 0-indexed
    const year = parseInt(parts[2], 10);
    
    // Vérifier que les valeurs sont valides
    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      console.warn(`⚠️ Date invalide: ${dateStr}`);
      return null;
    }
    
    return new Date(year, month, day);
  }
  
  // Essayer de parser comme date standard
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    console.warn(`⚠️ Impossible de parser la date: ${dateStr}`);
    return null;
  }
  
  return parsed;
}

// Créer un map des compositions par id_compo
// IMPORTANT: Si plusieurs compositions ont le même id_compo, on prend la plus récente
const compMap = {};
let duplicateCount = 0;

compositions.forEach(comp => {
  const idCompo = comp.id_compo || comp.id || comp.composition_id;
  
  if (!idCompo) {
    console.warn(`⚠️ Composition sans id_compo ignorée:`, comp);
    return;
  }
  
  // Si plusieurs compositions avec le même id_compo, garder la plus récente
  if (compMap[idCompo]) {
    duplicateCount++;
    const existingUpdatedAt = compMap[idCompo].updatedAt || compMap[idCompo].createdAt || '';
    const newUpdatedAt = comp.updatedAt || comp.createdAt || '';
    
    if (newUpdatedAt > existingUpdatedAt) {
      console.log(`🔄 Remplacement composition ${idCompo} (plus récente)`);
      compMap[idCompo] = comp;
    }
  } else {
    compMap[idCompo] = comp;
  }
});

if (duplicateCount > 0) {
  console.log(`ℹ️ ${duplicateCount} doublon(s) de composition géré(s)`);
}

console.log(`✅ ${Object.keys(compMap).length} composition(s) unique(s) mappée(s)`);

// Agrégation des stats par mois (format "YYYY-MM")
// IMPORTANT: Seule Date_Recuperation compte pour déterminer le mois
const statsByMonth = {};
let ordersProcessed = 0;
let ordersSkipped = 0;

orders.forEach((order, index) => {
  // Récupérer Date_Recuperation (seule date qui compte)
  const dateRecuperationStr = order.Date_Recuperation || order.date_recuperation || order.dateRecuperation;
  
  if (!dateRecuperationStr) {
    console.warn(`⚠️ Commande ${order.id || index} ignorée: pas de Date_Recuperation`);
    ordersSkipped++;
    return;
  }
  
  const dateRecuperation = parseFrenchDate(dateRecuperationStr);
  
  // Vérifier que la date est valide
  if (!dateRecuperation || isNaN(dateRecuperation.getTime())) {
    console.warn(`⚠️ Commande ${order.id || index} ignorée: Date_Recuperation invalide (${dateRecuperationStr})`);
    ordersSkipped++;
    return;
  }
  
  // Extraire le mois au format "YYYY-MM" depuis Date_Recuperation
  const year = dateRecuperation.getFullYear();
  const month = String(dateRecuperation.getMonth() + 1).padStart(2, '0');
  const moisKey = `${year}-${month}`;
  
  // Nombre de paniers
  const nombrePaniers = parseInt(order.Nombre_Paniers || order.nombrePaniers || order.nombre_paniers || 1);
  
  if (isNaN(nombrePaniers) || nombrePaniers <= 0) {
    console.warn(`⚠️ Commande ${order.id || index} ignorée: Nombre_Paniers invalide (${order.Nombre_Paniers})`);
    ordersSkipped++;
    return;
  }
  
  // Récupérer la composition (utiliser composition_id de la commande)
  const compositionId = order.composition_id || order.compositionId || 'comp-default';
  const composition = compMap[compositionId];
  
  if (!composition) {
    console.warn(`⚠️ Commande ${order.id || index} ignorée: composition "${compositionId}" non trouvée`);
    ordersSkipped++;
    return;
  }
  
  // Parser composition_json (string JSON)
  let fruitsComposition = {};
  if (composition.composition_json) {
    if (typeof composition.composition_json === 'string') {
      try {
        fruitsComposition = JSON.parse(composition.composition_json);
      } catch (e) {
        console.error(`❌ Erreur parsing composition_json pour ${compositionId}:`, e.message);
        fruitsComposition = {};
      }
    } else {
      fruitsComposition = composition.composition_json;
    }
  }
  
  if (Object.keys(fruitsComposition).length === 0) {
    console.warn(`⚠️ Commande ${order.id || index}: composition "${compositionId}" sans fruits`);
  }
  
  // Normaliser les noms de fruits en minuscules pour cohérence
  const normalizedFruits = {};
  Object.entries(fruitsComposition).forEach(([fruit, qty]) => {
    const fruitKey = fruit.toLowerCase().trim();
    const qtyValue = parseInt(qty) || 0;
    if (qtyValue > 0) {
      normalizedFruits[fruitKey] = (normalizedFruits[fruitKey] || 0) + qtyValue;
    }
  });
  
  // Initialiser le mois s'il n'existe pas encore
  if (!statsByMonth[moisKey]) {
    statsByMonth[moisKey] = {
      mois: moisKey,
      composition_id: `stats-${moisKey}`,
      paniers_total: 0,
      stats_json: {}
    };
  }
  
  // Ajouter le nombre de paniers
  statsByMonth[moisKey].paniers_total += nombrePaniers;
  
  // Ajouter les fruits (quantité par panier × nombre de paniers)
  Object.entries(normalizedFruits).forEach(([fruit, qtyPerPanier]) => {
    const qtyTotal = qtyPerPanier * nombrePaniers;
    if (!statsByMonth[moisKey].stats_json[fruit]) {
      statsByMonth[moisKey].stats_json[fruit] = 0;
    }
    statsByMonth[moisKey].stats_json[fruit] += qtyTotal;
  });
  
  ordersProcessed++;
});

console.log(`✅ ${ordersProcessed} commande(s) traitée(s)`);
if (ordersSkipped > 0) {
  console.log(`⚠️ ${ordersSkipped} commande(s) ignorée(s)`);
}

// Convertir en array et formater pour la DataTable
const statsArray = Object.values(statsByMonth).map(stat => {
  // Trier les fruits par nom pour cohérence
  const sortedFruits = {};
  Object.keys(stat.stats_json).sort().forEach(fruit => {
    sortedFruits[fruit] = stat.stats_json[fruit];
  });
  
  return {
    json: {
      composition_id: stat.composition_id,
      mois: stat.mois,
      paniers_total: stat.paniers_total,
      stats_json: JSON.stringify(sortedFruits),
      updatedAt: new Date().toISOString()
    }
  };
});

console.log(`📊 ${statsArray.length} mois de stats calculé(s)`);

// Afficher un résumé par mois
statsArray.forEach(stat => {
  const fruitsCount = Object.keys(JSON.parse(stat.json.stats_json)).length;
  console.log(`  - ${stat.json.mois}: ${stat.json.paniers_total} panier(s), ${fruitsCount} type(s) de fruits`);
});

return statsArray;

