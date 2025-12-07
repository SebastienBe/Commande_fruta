# 📊 Structure DataTable n8n pour Statistiques Mensuelles

## 📋 Table : `stats_mensuelles`

### Structure des Colonnes (Format Réel)

| Nom Colonne | Type | Description | Exemple |
|------------|------|-------------|---------|
| `id` | INTEGER (PRIMARY KEY) | ID auto-incrémenté | 1, 2, 3... |
| `composition_id` | TEXT | Identifiant unique (format: "stats-YYYY-MM") | "stats-2025-01" |
| `mois` | TEXT | Mois au format "YYYY-MM" | "2025-01" |
| `paniers_total` | INTEGER | Nombre total de paniers du mois | 42 |
| `stats_json` | TEXT (JSON) | Objet JSON des fruits sortis | `{"ananas": 42, "kiwi": 84, "grenade": 168}` |
| `createdAt` | TIMESTAMP | Date de création | 2025-12-07T11:29:50.944Z |
| `updatedAt` | TIMESTAMP | Date de mise à jour | 2025-12-07T11:29:50.944Z |

### Format CSV pour Import n8n

Le fichier `stats_mensuelles.csv` contient le format exact pour l'import dans n8n DataTable.

### Exemple de Données

```json
{
  "id": 2,
  "composition_id": "stats-2025-01",
  "mois": "2025-01",
  "paniers_total": 42,
  "stats_json": "{\"ananas\":42,\"kiwi\":84,\"grenade\":168,\"pomme\":126,\"orange\":84}",
  "createdAt": "2025-12-07T11:29:50.944Z",
  "updatedAt": "2025-12-07T11:29:50.944Z"
}
```

## 🔗 API Endpoints

**Base URL** : `https://n8n-seb.sandbox-jerem.com/webhook-test`

### Endpoints Stats

| Méthode | Endpoint | Description | Query Params |
|---------|----------|-------------|--------------|
| GET | `/stats` | Lire toutes les stats | `?annee=2025`, `?mois=6`, `?annee=2025&mois=6` |
| POST | `/post-stats` | Recalculer toutes les stats depuis les commandes | Body: `{}` (vide) |

### Exemples de Requêtes

**GET stats année complète** :
```javascript
const response = await fetch('https://n8n-seb.sandbox-jerem.com/webhook-test/stats?annee=2025');
const data = await response.json();
// Retourne : { count: 12, stats: [...] }
```

**GET stats mois spécifique** :
```javascript
const response = await fetch('https://n8n-seb.sandbox-jerem.com/webhook-test/stats?annee=2025&mois=6');
const data = await response.json();
// Retourne : { count: 1, stats: [{...}] }
```

**POST recalculer toutes les stats** :
```javascript
const response = await fetch('https://n8n-seb.sandbox-jerem.com/webhook-test/post-stats', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
});
const result = await response.json();
// Retourne : { success: true, message: "Statistiques mises à jour", stats_updated: 156 }
```

## 🔄 Logique de Calcul (POST)

### Algorithme

1. **Récupérer toutes les commandes** depuis la table `commandes`
2. **Récupérer toutes les compositions** depuis la table `compositions`
3. **Pour chaque commande** :
   - Récupérer `composition_id` (type de panier)
   - Récupérer `Nombre_Paniers` (quantité)
   - Récupérer `Date_Creation` (date de début)
   - Récupérer `Date_Recuperation` (date de fin)
   - Récupérer la composition depuis le map (via `composition_id`)
   - Extraire `composition_json` (ex: `{"ananas": 1, "kiwis": 6}`)
4. **Pour chaque mois** (de `Date_Creation` jusqu'à `Date_Recuperation`) :
   - Calculer : `fruits_du_mois = composition_json × Nombre_Paniers`
   - Ajouter à `stats_mensuelles` pour ce mois (format "YYYY-MM")
   - Compter les paniers (seulement le premier mois de la commande)
5. **Mettre à jour la table** `stats_mensuelles` avec upsert sur `composition_id`

### Exemple de Calcul

**Commande** :
- Date création : 2025-01-15
- Date récupération : 2025-03-20
- Nombre paniers : 2
- Composition : `{"ananas": 1, "kiwis": 6}`

**Calcul** :
- **Janvier 2025** (`2025-01`) : 
  - `ananas: 1×2 = 2`
  - `kiwis: 6×2 = 12`
  - `paniers_total: +2`
- **Février 2025** (`2025-02`) : 
  - `ananas: 1×2 = 2`
  - `kiwis: 6×2 = 12`
- **Mars 2025** (`2025-03`) : 
  - `ananas: 1×2 = 2`
  - `kiwis: 6×2 = 12`

## 📝 Notes Importantes

1. **Format `stats_json`** :
   - Stocké comme TEXT (JSON string) dans la DataTable
   - Format : `"{\"ananas\":42,\"kiwi\":84}"`
   - Doit être parsé en JSON côté frontend/n8n

2. **Format `mois`** :
   - Format "YYYY-MM" (ex: "2025-01")
   - Utilisé pour le filtrage et l'affichage

3. **Format `composition_id`** :
   - Format "stats-YYYY-MM" (ex: "stats-2025-01")
   - Utilisé comme clé unique pour l'upsert

4. **Calcul des Stats** :
   - Les fruits sont répartis sur tous les mois entre `Date_Creation` et `Date_Recuperation`
   - Les paniers sont comptés seulement le premier mois (mois de création de la commande)

5. **Performance** :
   - Le POST recalcule **toutes** les stats (tous les mois de 2020 à 2030)
   - Utilise l'upsert pour mettre à jour uniquement les mois concernés

## 🔄 Workflow de Recalcul (POST)

1. **Webhook POST** `/post-stats` (body vide)
2. **Get All Commandes** : Récupère toutes les commandes
3. **Get All Compositions** : Récupère toutes les compositions
4. **Calculate Stats** : 
   - Crée un map `composition_id → composition_json`
   - Initialise les stats pour tous les mois (2020-2030)
   - Pour chaque commande, calcule les fruits par mois
5. **Upsert Stats** : Met à jour `stats_mensuelles` avec upsert sur `composition_id`

## 📊 Workflow de Lecture (GET)

1. **Webhook GET** `/stats` avec query params `?annee=2025&mois=6` (optionnel)
2. **Get All Stats** : Récupère toutes les stats depuis `stats_mensuelles`
3. **Format Response** : 
   - Filtre par année/mois si fournis
   - Parse `stats_json` JSON string → objet
   - Calcule `total_fruits` depuis `stats_json`
   - Formate pour le frontend
4. **Respond** : Retourne `{count: X, stats: [...]}`

## 🎯 Mapping Frontend ↔ DataTable

| Frontend (stats.js) | DataTable n8n |
|---------------------|---------------|
| `id` | `composition_id` |
| `annee` | Extrait de `mois` ("YYYY-MM") |
| `mois` | Extrait de `mois` ("YYYY-MM") |
| `nombre_commandes` | `paniers_total` |
| `fruits_sortis` | `stats_json` (parsed) |
| `total_fruits` | Calculé depuis `stats_json` |
| `derniere_maj` | `updatedAt` |
