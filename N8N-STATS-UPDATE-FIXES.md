# 🔧 Corrections apportées au workflow "Update Stats"

## 📋 Adaptations aux formats réels de vos données

### ✅ **1. Parsing des dates au format français**

**Problème** : Les dates dans les commandes sont au format `"DD/MM/YYYY"` (ex: `"03/12/2025"`)

**Solution** : Ajout d'une fonction `parseFrenchDate()` qui :
- Détecte le format français `"DD/MM/YYYY"`
- Parse correctement : `"03/12/2025"` → `Date(2025, 11, 3)`
- Gère aussi les formats ISO si présents

```javascript
function parseFrenchDate(dateStr) {
  // Parser "DD/MM/YYYY"
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Mois 0-indexed
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date(dateStr);
}
```

---

### ✅ **2. Mapping des compositions avec `id_compo`**

**Problème** : Les compositions utilisent `id_compo` (pas `id`)

**Solution** : Le workflow utilise maintenant `id_compo` pour mapper :
```javascript
const idCompo = comp.id_compo || comp.id;
compMap[idCompo] = comp;
```

**Exemple** :
- Commande : `composition_id: "comp-Noel"`
- Composition : `id_compo: "comp-Noel"` → ✅ Match !

---

### ✅ **3. Gestion des doublons `id_compo`**

**Problème** : Plusieurs compositions peuvent avoir le même `id_compo` (ex: 2 compositions avec `"comp-Noel"`)

**Solution** : Le workflow prend automatiquement la composition la plus récente (basée sur `updatedAt`) :
```javascript
if (!compMap[idCompo] || (comp.updatedAt && compMap[idCompo].updatedAt && comp.updatedAt > compMap[idCompo].updatedAt)) {
  compMap[idCompo] = comp;
}
```

**Exemple** :
- `comp-Noel` #1 : `updatedAt: "2025-12-07T16:52:09.822Z"` (Panier Spécial Noël 2025)
- `comp-Noel` #2 : `updatedAt: "2025-12-07T18:10:57.798Z"` (madame cochon) → ✅ **Celle-ci sera utilisée**

---

### ✅ **4. Normalisation des noms de fruits**

**Problème** : Les noms de fruits peuvent avoir des variations de casse (`"Kiwi"` vs `"kiwi"`, `"Mangues"` vs `"mangue"`)

**Solution** : Normalisation en minuscules pour cohérence :
```javascript
const normalizedFruits = {};
Object.entries(fruitsComposition).forEach(([fruit, qty]) => {
  const fruitKey = fruit.toLowerCase().trim();
  normalizedFruits[fruitKey] = (normalizedFruits[fruitKey] || 0) + (parseInt(qty) || 0);
});
```

**Exemple** :
- `{"Kiwi": 10, "Mangues": 2}` → `{"kiwi": 10, "mangues": 2}`

---

### ✅ **5. Parsing robuste de `composition_json`**

**Problème** : `composition_json` est une string JSON qui doit être parsée

**Solution** : Parsing avec gestion d'erreurs :
```javascript
if (typeof composition.composition_json === 'string') {
  try {
    fruitsComposition = JSON.parse(composition.composition_json);
  } catch (e) {
    console.log(`⚠️ Erreur parsing composition_json pour ${compositionId}:`, e);
    fruitsComposition = {};
  }
}
```

---

## 📊 Exemple de calcul avec vos données

### Commande exemple :
```json
{
  "Date_Creation": "03/12/2025",
  "Date_Recuperation": "19/12/2025",
  "Nombre_Paniers": 4,
  "composition_id": "comp-Noel"
}
```

### Composition associée (la plus récente) :
```json
{
  "id_compo": "comp-Noel",
  "composition_json": "{\"Kiwi\":10,\"Mangues\":2}",
  "updatedAt": "2025-12-07T18:10:57.798Z"
}
```

### Calcul :
1. **Dates** : `03/12/2025` → `19/12/2025`
2. **Mois concernés** : `["2025-12"]` (un seul mois)
3. **Fruits normalisés** : `{"kiwi": 10, "mangues": 2}`
4. **Fruits vendus** :
   - `kiwi`: `10 × 4 paniers = 40`
   - `mangues`: `2 × 4 paniers = 8`

### Résultat pour décembre 2025 :
```json
{
  "mois": "2025-12",
  "composition_id": "stats-2025-12",
  "paniers_total": 4,
  "stats_json": "{\"kiwi\":40,\"mangues\":8}"
}
```

---

## 🔍 Logs de debug

Le workflow ajoute des logs pour faciliter le débogage :

```javascript
console.log(`⚠️ Commande ${order.id} ignorée: dates invalides`);
console.log(`⚠️ Commande ${order.id} ignorée: composition "${compositionId}" non trouvée`);
console.log(`⚠️ Erreur parsing composition_json pour ${compositionId}:`, e);
console.log(`✅ ${statsArray.length} mois de stats calculés`);
```

---

## ✅ Checklist de test

Avec vos données d'exemple, le workflow devrait :

- [x] Parser `"03/12/2025"` correctement
- [x] Trouver la composition `"comp-Noel"` via `id_compo`
- [x] Prendre la composition la plus récente si doublon
- [x] Parser `composition_json` string JSON
- [x] Normaliser `"Kiwi"` → `"kiwi"`
- [x] Calculer les mois entre les dates
- [x] Multiplier les fruits par `Nombre_Paniers`

---

## 🚀 Prêt à tester !

Le workflow est maintenant adapté à vos formats de données réels. Vous pouvez :

1. **Importer** le workflow dans n8n
2. **Tester** avec vos commandes existantes
3. **Vérifier** les logs dans n8n pour voir les calculs
4. **Appeler** depuis le frontend avec le bouton "Recalculer"

---

🎉 **Tout est prêt pour calculer vos stats mensuelles !**

