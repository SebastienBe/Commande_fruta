# 📋 Configuration du node "Respond to Webhook" pour les Stats

## 🎯 Objectif
Retourner directement l'array des données de la DataTable au format :
```json
[
  {
    "composition_id": "stats-2025-12",
    "mois": "2025-12",
    "paniers_total": 0,
    "stats_json": "{\"ananas\":0,...}",
    "id": 13,
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

---

## ✅ **OPTION 1 : Retourner directement les données brutes (RECOMMANDÉ)**

### Configuration du node "Respond to Webhook"

1. **Ouvrez le node "Respond to Webhook"** dans votre workflow n8n

2. **Dans "Respond With"** : Sélectionnez `JSON`

3. **Dans "Response Body"** : Utilisez cette expression :
   ```
   ={{ $input.all().map(i => i.json) }}
   ```

4. **Dans "Options" → "Response Headers"** : Ajoutez ces headers :
   - **Name** : `Access-Control-Allow-Origin` | **Value** : `*`
   - **Name** : `Access-Control-Allow-Methods` | **Value** : `GET, OPTIONS`
   - **Name** : `Access-Control-Allow-Headers` | **Value** : `Content-Type`

5. **Sauvegardez** le workflow

### ✅ Avantages
- ✅ Simple et direct
- ✅ Retourne exactement le format de votre DataTable
- ✅ Pas besoin de node "Format Response"

---

## 🔧 **OPTION 2 : Utiliser le node "Format Response" puis retourner l'array**

Si vous voulez formater les données avant de les retourner :

### 1. Modifier le node "Format Response" (Code)

Remplacez le code par :
```javascript
// Filtrer par format "YYYY-MM" ou "YYYY"
const query = $('Webhook GET Stats').item.json.query || {};
const moisFilter = query.mois; // Format "YYYY-MM" (ex: "2025-06")
const anneeFilter = query.annee; // Format "YYYY" (ex: "2025")

const allStats = $input.all();

// Filtrer les stats
let filtered = allStats.map(item => item.json);

// Filtrer selon le format fourni
if (moisFilter) {
  // Filtre exact par mois "YYYY-MM"
  filtered = filtered.filter(stat => {
    const moisStr = stat.mois || stat.composition_id?.replace('stats-', '') || '';
    return moisStr === moisFilter;
  });
} else if (anneeFilter) {
  // Filtre par année "YYYY" - tous les mois qui commencent par "YYYY-"
  filtered = filtered.filter(stat => {
    const moisStr = stat.mois || stat.composition_id?.replace('stats-', '') || '';
    return moisStr.startsWith(`${anneeFilter}-`);
  });
}

// Retourner directement les items formatés (pas d'objet wrapper)
return filtered.map(stat => ({ json: stat }));
```

### 2. Configurer le node "Respond to Webhook"

1. **Dans "Respond With"** : Sélectionnez `JSON`

2. **Dans "Response Body"** : Utilisez cette expression :
   ```
   ={{ $input.all().map(i => i.json) }}
   ```

3. **Ajoutez les headers CORS** (comme dans l'Option 1)

---

## 🖼️ **Capture d'écran de la configuration**

### Node "Respond to Webhook" - Configuration

```
┌─────────────────────────────────────┐
│ Respond to Webhook                   │
├─────────────────────────────────────┤
│ Respond With: JSON                   │
│                                     │
│ Response Body:                      │
│ ={{ $input.all().map(i => i.json) }}│
│                                     │
│ Options:                            │
│   ☑ Response Headers                │
│     • Access-Control-Allow-Origin: *│
│     • Access-Control-Allow-Methods: │
│       GET, OPTIONS                  │
│     • Access-Control-Allow-Headers: │
│       Content-Type                  │
└─────────────────────────────────────┘
```

---

## 🧪 **Test**

Après configuration, testez avec :

```bash
curl "https://n8n-seb.sandbox-jerem.com/webhook-test/stats?mois=2025-12"
```

Vous devriez recevoir :
```json
[
  {
    "composition_id": "stats-2025-12",
    "mois": "2025-12",
    "paniers_total": 0,
    "stats_json": "{\"ananas\":0,...}",
    ...
  }
]
```

---

## ⚠️ **Notes importantes**

1. **Format de réponse** : L'array doit être retourné directement, pas dans un objet `{data: [...]}`
2. **Headers CORS** : Essentiels pour que le frontend puisse appeler l'API
3. **Expression n8n** : `$input.all().map(i => i.json)` extrait tous les items et retourne leur propriété `json`

---

## 🔍 **Dépannage**

### Problème : La réponse est `{}` ou `null`
- **Solution** : Vérifiez que le node précédent (DataTable ou Format Response) retourne bien des items avec `{json: {...}}`

### Problème : Erreur CORS dans le navigateur
- **Solution** : Vérifiez que les headers CORS sont bien configurés dans "Response Headers"

### Problème : La réponse est un objet au lieu d'un array
- **Solution** : Utilisez `$input.all().map(i => i.json)` au lieu de `$json`

