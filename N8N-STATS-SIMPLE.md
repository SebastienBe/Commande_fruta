# 📊 Statistiques Simplifiées - Architecture

## 🎯 Principe

**GET** : Lit directement depuis la table `stats_mensuelles`  
**POST** : Calcule les stats depuis les commandes (`index.html`) et met à jour la table

## 📋 Table `stats_mensuelles`

### Structure CSV (pour import n8n DataTable)

```csv
id,annee,mois,nombre_commandes,fruits_sortis,total_fruits,derniere_maj
2025-01,2025,1,0,"{}",0,2025-01-31 23:59:59
2025-02,2025,2,0,"{}",0,2025-02-28 23:59:59
```

### Colonnes

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Format "YYYY-MM" (ex: "2025-01") |
| `annee` | INTEGER | Année (2025) |
| `mois` | INTEGER | Mois (1-12) |
| `nombre_commandes` | INTEGER | Nombre de commandes du mois |
| `fruits_sortis` | TEXT (JSON) | `{"ananas": 45, "kiwis": 270}` |
| `total_fruits` | INTEGER | Total de tous les fruits |
| `derniere_maj` | TIMESTAMP | Date de dernière mise à jour |

## 🔄 Logique de Calcul (POST)

### Algorithme

1. **Récupérer toutes les commandes** depuis la table `commandes`
2. **Pour chaque commande** :
   - Récupérer `composition_id` (type de panier)
   - Récupérer `Nombre_Paniers` (quantité)
   - Récupérer `Date_Recuperation` (date de fin)
   - Récupérer la composition depuis la table `compositions` (via `composition_id`)
   - Extraire `composition_json` (ex: `{"ananas": 1, "kiwis": 6}`)
3. **Pour chaque mois** (de la création de la commande jusqu'à `Date_Recuperation`) :
   - Calculer : `fruits_du_mois = composition_json × Nombre_Paniers`
   - Ajouter à `stats_mensuelles` pour ce mois
4. **Mettre à jour la table** `stats_mensuelles` avec les totaux

### Exemple

**Commande** :
- Date création : 2025-01-15
- Date récupération : 2025-03-20
- Nombre paniers : 2
- Composition : `{"ananas": 1, "kiwis": 6}`

**Calcul** :
- **Janvier 2025** : `ananas: 1×2 = 2`, `kiwis: 6×2 = 12`
- **Février 2025** : `ananas: 1×2 = 2`, `kiwis: 6×2 = 12`
- **Mars 2025** : `ananas: 1×2 = 2`, `kiwis: 6×2 = 12`

## 🔗 Endpoints

### GET `/stats`
- Lit directement depuis `stats_mensuelles`
- Filtre par `?annee=2025&mois=6` (optionnel)
- Retourne : `{count: X, stats: [...]}`

### POST `/post-stats`
- Recalcule TOUTES les stats depuis les commandes
- Met à jour `stats_mensuelles` pour tous les mois concernés
- Retourne : `{success: true, message: "Stats mises à jour"}`

## 📝 Notes

- Le POST recalcule **tout**, pas juste un mois
- Les stats sont calculées en fonction de la période de validité de chaque commande
- Si une commande s'étend sur plusieurs mois, elle contribue à chaque mois

