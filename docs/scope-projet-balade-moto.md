# Scope du projet — Carte d'analyse de balade moto

> Document de cadrage. Sert de référence produit et de garde-fou anti-*scope creep*.
> Version 1 — à faire évoluer au fur et à mesure des décisions.

---

## 1. Le pitch en une phrase

Un site web gratuit qui, à partir de la zone affichée sur la carte, analyse autour de soi **les belles routes, le risque réel, les radars et la météo**, et répond à une seule question : *« Est-ce que ma balade peut être sympa, ici, maintenant ou plus tard ? »*

## 2. L'âme du produit

Ce n'est **pas** un planificateur d'itinéraire (pas de turn-by-turn, pas de tracé point A → point B). C'est un **outil d'analyse de zone** et d'aide à la décision spontanée.

- Mode d'usage : l'utilisateur regarde une zone sur la carte, l'app l'analyse.
- Deux axes de réponse :
  - **Spatial** — ce qu'il y a *là* : routes à virages, zones accidentogènes, radars.
  - **Temporel** — est-ce le bon moment : météo + lumière du jour, maintenant ou dans X heures.

Ce positionnement « visualisation / awareness » est ce qui distingue le projet des apps de navigation existantes.

## 3. Positionnement concurrentiel

Le marché de la **navigation moto à virages** est saturé et tenu par des acteurs matures et financés : Calimoto et Kurviger (algorithmes de sinuosité propriétaires), Scenic, Motobit. Inutile de les concurrencer sur le routing turn-by-turn, les cartes offline ou CarPlay : combat perdu d'avance pour un side project.

La roulabilité météo existe aussi (ex. Drive Weather : prévisions le long de l'itinéraire, curseur temporel). Les alertes radars et trafic temps réel sont des commodités présentes un peu partout (Scenic, Waze, etc.).

**L'espace blanc réel :** aucune de ces apps n'exploite les **données publiques d'accidentologie historique** (fichier BAAC) filtrées moto et **pondérées par le trafic** pour produire une carte de risque. C'est l'angle différenciant, renforcé par une identité **France / open data**.

## 4. Fonctionnalités

### 4.1 Cerveau temporel — Roulabilité (cœur de l'expérience)
- Score « envie de rouler » par créneau horaire, combinant pluie, vent, température.
- Réponse explicite « maintenant ou plus tard » : meilleure fenêtre dans les prochaines heures.
- Intégration lever/coucher du soleil et *golden hour* : éviter de se faire surprendre par la nuit ou le soleil rasant.

### 4.2 Calque Sinuosité — quelles routes (signature technique)
- Score de sinuosité par segment de route (densité de changements de cap, ratio distance réelle / distance à vol d'oiseau).
- Coloration des routes du vert (droit) au rouge (très tortueux).
- Calculé sur la **zone affichée**, mais à partir de données **précalculées** (voir §6), pas en live.
- Option d'enrichissement : croisement avec le dénivelé pour faire ressortir les routes de montagne.

### 4.3 Calque Risque — zones accidentogènes (différenciateur)
- Accidents corporels deux-roues issus du fichier BAAC.
- **Pondération par le trafic** (TMJA) pour obtenir un *ratio de risque* et non un comptage brut.
- Détection de zones denses (clustering géographique).
- Dimension temporelle possible (ex. accidents moto plus fréquents le dimanche après-midi de printemps).

### 4.4 Calque Radars — où lever le pied (victoire rapide)
- Emplacement des radars fixes (donnée officielle data.gouv).
- Points + rayon d'alerte visuel. Aucun traitement lourd.

### 4.5 Gestion des calques
- Tous les calques sont **optionnels**, activables/désactivables.
- Par défaut, ne pas tout afficher en même temps (éviter la soupe visuelle).
- Cœur visible par défaut : routes + roulabilité ; le reste en surcouche à la demande.

## 5. Sources de données

| Donnée | Source | Type | Fraîcheur | Difficulté |
|---|---|---|---|---|
| Géométrie des routes | OpenStreetMap (Overpass) | Statique précalculé | Continue | Moyenne |
| Accidents corporels | Fichier BAAC / ONISR (data.gouv) | Statique précalculé | Annuel (année N en mai N+1) | Moyenne (nettoyage géo) |
| Trafic (TMJA) | data.gouv national + portails départementaux | Statique précalculé | Variable | **Élevée** (voir §5.1) |
| Radars fixes | data.gouv (officiel) | Statique | Périodique | Faible |
| Météo | Open-Meteo (sans clé) ou Météo-France open data | Live | Temps réel | Faible |
| Soleil / golden hour | API sunrise-sunset (gratuite) | Live / calculable | Temps réel | Faible |
| Dénivelé (option) | IGN RGE ALTI / Open-Elevation | Statique | — | Faible-moyenne |

### 5.1 Le point dur : le dénominateur trafic
Le TMJA existe (réseau national + nombreux départements) **mais** :
- **Fragmenté** : un jeu par département, formats et portails hétérogènes, pas de couche nationale unifiée des petites routes.
- **Ponctuel, pas continu** : mesuré à des points de comptage. Les grands axes ont un comptage permanent ; les autres sections sont comptées tous les ~3 ans seulement.
- **Angle mort** : les petites routes à virages — celles qui nous intéressent — sont les moins bien couvertes. Le dénominateur manque souvent là où le numérateur est le plus parlant.

**Stratégie d'atténuation :**
- Afficher le **vrai ratio** uniquement là où un point de comptage est proche du cluster d'accidents.
- Ailleurs : montrer un comptage brut **clairement étiqueté** comme tel, ou utiliser la **classe de route OSM comme proxy grossier de trafic**.
- Assumer la limite dans l'interface plutôt que prétendre à un ratio rigoureux partout.

## 6. Architecture

Principe directeur : **statique d'abord, zéro backend si possible.**

- Toute « l'intelligence » (clustering d'accidents, jointure avec le TMJA, calcul de sinuosité) tourne **hors-ligne, une fois**, dans un script de préparation de données chez le développeur.
- Sortie : des **fichiers de données statiques** (GeoJSON, ou tuiles vectorielles pour de gros volumes).
- Le front Leaflet charge ces fichiers et filtre côté navigateur ce qui est dans le cadre visible.
- Seuls la météo et le soleil sont appelés **en live** depuis le navigateur (API gratuites).

Conséquences :
- Hébergement **gratuit** (GitHub Pages / Netlify / Cloudflare Pages).
- **Ne jamais** interroger Overpass en live à chaque déplacement de carte (risque de bannissement + lenteur).
- Gating par **niveau de zoom** : ne pas afficher chaque virage à l'échelle nationale.

## 7. Stack technique envisagée

- **Cartographie front** : Leaflet (+ plugins : markercluster, heatmap, ant-path selon besoin).
- **Fond de carte** : tuiles OSM (ou autre fournisseur compatible licence).
- **Préparation des données** : Python (pandas/geopandas, scikit-learn pour le clustering type DBSCAN, requêtes Overpass).
- **Formats de données** : GeoJSON ; tuiles vectorielles si le volume l'exige.
- **APIs live** : Open-Meteo (météo), sunrise-sunset (soleil).
- **Hébergement** : statique (Pages / Netlify / Cloudflare).

## 8. Périmètre MVP et feuille de route

**Discipline n°1 : ne pas viser la France entière au départ.** Choisir **un département qui publie un bon TMJA**, construire dessus, étendre ensuite.

| Étape | Contenu | Pourquoi |
|---|---|---|
| **MVP — v0.1** | Calque sinuosité seul, sur 1 département, précalculé | Brique cœur, autonome, signature technique |
| **v0.2** | + Roulabilité (météo + soleil) | Le produit devient « vivant », répond au « maintenant ou plus tard » |
| **v0.3** | + Calque radars | Victoire rapide, faible effort |
| **v0.4** | + Calque risque (accidents × trafic) sur la même zone | Le différenciateur ; demande le plus de soin |
| **v1.0** | Polissage UX, gestion fine des calques, étiquetage des limites | Produit complet sur une région |
| **Au-delà** | Extension géographique progressive ; option dénivelé/montagne | Croissance |

## 9. Hors périmètre (explicite)

Pour éviter la dérive, **ne font pas partie du projet** :
- La navigation turn-by-turn / le guidage vocal.
- La planification d'itinéraire A → B et l'optimisation de tracé.
- Le débrief a posteriori d'une trace GPX (vitesse vs radars, angle pris en virage).
- Le trafic temps réel et les prévisions de bouchons (au-delà du TMJA statique).
- Toute fonctionnalité communautaire / sociale / compte utilisateur.
- Les applis mobiles natives (le livrable est un site web).
- Le marché de l'occasion / la cote (pas d'API publique propre ; scraping = zone grise à éviter).

## 10. Risques et points de vigilance

### 10.1 Méthodologiques
- **Biais d'exposition** : les belles routes à virages sont souvent aussi les plus accidentogènes, simplement parce que c'est là que les motards roulent. Sans pondération par le trafic, l'app peindrait en « danger » exactement les routes qu'elle recommande. → C'est précisément la raison d'être du ratio (§4.3 / §5.1).
- **Complétude de la BAAC** : la base ne contient que les accidents **corporels enregistrés par les forces de l'ordre**. Les chutes seules non déclarées et les accidents matériels sont absents → sous-représentation connue côté moto. À assumer dans l'interface.
- **Qualité de la géolocalisation BAAC** : coordonnées imprécises ou recalées au centroïde de commune, surtout sur les années anciennes. → Filtrer les coordonnées aberrantes ; privilégier les années récentes.
- **Discours** : formuler « fréquemment accidentogène, à rouler en conscience » plutôt qu'un jugement brut de dangerosité.

### 10.2 Techniques
- **Overpass en live** = bannissement / lenteur → tout précalculer.
- **Volume de données** sur une grande zone → tuiles vectorielles + gating par zoom.
- **Hétérogénéité du TMJA** entre départements → pipeline d'ingestion par source, normalisation.

### 10.3 Produit
- **Scope creep** : la tentation d'empiler les 5 calques d'un coup. → Respecter la feuille de route (§8) et le hors-périmètre (§9).
- **Soupe visuelle** : trop de calques actifs simultanément. → Calques optionnels, défaut sobre.

## 11. Décisions à trancher

- [ ] Quel **département pilote** pour le MVP (critère principal : qualité/disponibilité du TMJA) ?
- [ ] Source météo : Open-Meteo (simple, sans clé) ou Météo-France (plus officiel) ?
- [ ] Définition exacte du **score de sinuosité** (formule, seuils de coloration).
- [ ] Méthode de **clustering** des accidents (DBSCAN : valeurs de epsilon / min_samples).
- [ ] Règle de **fallback trafic** quand le TMJA manque (proxy classe OSM ? masquer le ratio ?).
- [ ] Granularité d'affichage par **niveau de zoom**.

## 12. Définition du « terminé » pour la v1

- Sur le département pilote, l'utilisateur peut :
  - voir les routes colorées par sinuosité dans la zone affichée ;
  - consulter un score de roulabilité « maintenant / plus tard » avec lever/coucher du soleil ;
  - activer un calque radars ;
  - activer un calque de risque accident, avec ratio trafic là où c'est possible et limites clairement indiquées ailleurs ;
  - le tout sur un site gratuit, hébergé en statique, sans compte ni backend.

---

*Prochaine brique à attaquer : le calcul concret du score de sinuosité à partir de la géométrie OSM (cœur technique du projet).*
