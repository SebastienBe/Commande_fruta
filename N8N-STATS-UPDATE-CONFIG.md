# 📋 Configuration du workflow "Update Stats"

## 🎯 Objectif
Créer un endpoint `/stats/update` qui recalcule automatiquement les statistiques mensuelles à partir des commandes (`index.html`) et des compositions (`compositions.html`).

---

## 📊 Logique de Calcul

### 1. **Lecture des données**
- **Commandes** : Lit toutes les commandes depuis la DataTable `orders`
- **Compositions** : Lit toutes les compositions depuis la DataTable `compositions`

### 2. **Pour chaque commande**
- Récupère :
  - `Date_Creation` : Date de création de la commande
  - `Date_Recuperation` : Date de récupération/livraison
  - `Nombre_Paniers` : Nombre de paniers commandés
  - `composition_id` : ID de la composition utilisée

### 3. **Calcul des mois concernés**
- Détermine tous les mois entre `Date_Creation` et `Date_Recuperation`
- Format : `"YYYY-MM"` (ex: `"2025-12"`)

### 4. **Calcul des fruits vendus**
- Récupère la composition associée (`composition_json`)
- Pour chaque mois concerné :
  - Ajoute `Nombre_Paniers` au `paniers_total`
  - Calcule les fruits : `quantité_fruit × Nombre_Paniers`
  - Agrège dans `stats_json`

### 5. **Mise à jour de la DataTable**
- Utilise `UPSERT` sur `stats_mensuelles`
- Clé unique : `mois` (format "YYYY-MM")
- Met à jour ou crée les entrées

---

## 🔧 Configuration du Workflow n8n

### **Node 1 : Webhook POST Update Stats**
- **Type** : Webhook
- **Method** : POST
- **Path** : `stats/update`
- **Response Mode** : Respond to Webhook

### **Node 2 : Get All Orders**
- **Type** : n8n DataTable
- **Operation** : getAll
- **Table ID** : `orders`
- **Filter** : Aucun (récupère toutes les commandes)

### **Node 3 : Get All Compositions**
- **Type** : n8n DataTable
- **Operation** : getAll
- **Table ID** : `compositions`
- **Filter** : Aucun (récupère toutes les compositions)

### **Node 4 : Calculate Stats (Code)**
- **Type** : Code
- **Code** : Voir le fichier `n8n-workflow-stats-update.json`

**Logique** :
```javascript
// 1. Créer un map des compositions par id_compo
// 2. Pour chaque commande :
//    - Extraire les dates (Date_Creation, Date_Recuperation)
//    - Calculer tous les mois entre ces dates
//    - Récupérer la composition (composition_id)
//    - Parser composition_json
//    - Pour chaque mois :
//      * Ajouter paniers_total
//      * Calculer fruits = qty_fruit × nombre_paniers
// 3. Retourner array formaté pour DataTable
```

### **Node 5 : Upsert Stats**
- **Type** : n8n DataTable
- **Operation** : upsert
- **Table ID** : `stats_mensuelles`
- **Upsert Fields** : `mois` (clé unique)
- **Mapping** :
  - `composition_id` : `stats-{mois}`
  - `mois` : Format "YYYY-MM"
  - `paniers_total` : Nombre total de paniers
  - `stats_json` : JSON stringifié des fruits
  - `updatedAt` : Date actuelle

### **Node 6 : Respond to Webhook**
- **Type** : Respond to Webhook
- **Respond With** : JSON
- **Response Body** : 
  ```json
  {
    "success": true,
    "message": "Statistiques mises à jour",
    "count": <nombre_de_mois_mis_à_jour>
  }
  ```
- **Headers CORS** :
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Methods: POST, OPTIONS`
  - `Access-Control-Allow-Headers: Content-Type`

### **Node 7 & 8 : OPTIONS Handler**
- Gère les requêtes OPTIONS (CORS preflight)

---

## 📝 Exemple de Calcul

### Commande exemple :
```json
{
  "Date_Creation": "2025-12-01",
  "Date_Recuperation": "2025-12-15",
  "Nombre_Paniers": 2,
  "composition_id": "comp-noel-2025"
}
```

### Composition associée :
```json
{
  "id_compo": "comp-noel-2025",
  "composition_json": {
    "ananas": 1,
    "kiwi": 3,
    "mandarine": 8
  }
}
```

### Résultat pour décembre 2025 :
```json
{
  "mois": "2025-12",
  "composition_id": "stats-2025-12",
  "paniers_total": 2,
  "stats_json": {
    "ananas": 2,    // 1 × 2 paniers
    "kiwi": 6,      // 3 × 2 paniers
    "mandarine": 16 // 8 × 2 paniers
  }
}
```

---

## 🧪 Test

### Appel API :
```bash
POST https://n8n-seb.sandbox-jerem.com/webhook-test/stats/update
Content-Type: application/json

{}
```

### Réponse attendue :
```json
{
  "success": true,
  "message": "Statistiques mises à jour",
  "count": 12
}
```

---

## ⚠️ Notes importantes

1. **Dates** : Les dates doivent être au format ISO 8601 ou format français (DD/MM/YYYY)
2. **Composition manquante** : Si `composition_id` n'existe pas, la commande est ignorée
3. **Dates invalides** : Les commandes avec dates invalides sont ignorées
4. **Agrégation** : Les stats sont agrégées par mois, donc plusieurs commandes du même mois sont additionnées
5. **Performance** : Pour un grand nombre de commandes, le calcul peut prendre quelques secondes

---

## 🔄 Utilisation depuis le Frontend

Le bouton "Recalculer" dans `stats.html` appelle automatiquement cet endpoint :

```javascript
// Dans stats.js
async function recalculateStats() {
  const response = await fetch(STATS_API_ENDPOINTS.UPDATE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  // ...
}
```

---

## 📊 Structure de la DataTable `stats_mensuelles`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | Integer | ID auto-incrémenté |
| `composition_id` | String | Format `stats-YYYY-MM` |
| `mois` | String | Format `YYYY-MM` (clé unique) |
| `paniers_total` | Integer | Nombre total de paniers vendus |
| `stats_json` | String | JSON stringifié des fruits vendus |
| `createdAt` | DateTime | Date de création |
| `updatedAt` | DateTime | Date de mise à jour |

---

## ✅ Checklist de Configuration

- [ ] Importer le workflow `n8n-workflow-stats-update.json` dans n8n
- [ ] Configurer les DataTables (`orders`, `compositions`, `stats_mensuelles`)
- [ ] Vérifier que les noms de colonnes correspondent (Date_Creation, Date_Recuperation, etc.)
- [ ] Tester avec quelques commandes
- [ ] Vérifier les headers CORS
- [ ] Tester depuis le frontend (bouton "Recalculer")

---

## 🐛 Dépannage

### Problème : Aucune stat n'est créée
- **Vérifier** : Les commandes ont-elles des dates valides ?
- **Vérifier** : Les `composition_id` existent-ils dans la table `compositions` ?

### Problème : Les fruits ne sont pas calculés
- **Vérifier** : Le `composition_json` est-il bien parsé ?
- **Vérifier** : Le format JSON est-il valide dans la DataTable ?

### Problème : Erreur CORS
- **Vérifier** : Les headers CORS sont-ils bien configurés dans "Respond to Webhook" ?

---

🎉 **Le workflow est prêt à être importé dans n8n !**

