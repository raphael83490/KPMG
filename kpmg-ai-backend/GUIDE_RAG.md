# Guide d'utilisation du système RAG

## 📁 Structure des dossiers

```
kpmg-ai-backend/
├── data/
│   ├── documents/          ← Placez vos fichiers ICI
│   │   ├── mission_petcare_2022.pdf
│   │   ├── etude_cybersecurite.txt
│   │   └── ...
│   └── chroma_db/         ← Index ChromaDB (créé automatiquement)
```

## 📄 Formats supportés

Le système supporte automatiquement :
- **PDF** (`.pdf`) - Rapports, études, documents
- **Texte** (`.txt`, `.md`) - Notes, documentation Markdown
- **Word** (`.docx`) - Documents Microsoft Word

## 🚀 Comment indexer vos documents

### Méthode 1 : Indexation automatique (recommandée)

**L'indexation se fait automatiquement** au premier lancement du serveur FastAPI :

1. Placez vos fichiers dans `data/documents/`
2. Démarrez le serveur :
   ```bash
   cd kpmg-ai-backend
   uvicorn app.main:app --reload
   ```
3. Le système détecte automatiquement les nouveaux fichiers et les indexe

**Avantages** :
- Aucune action manuelle nécessaire
- Détection automatique des changements
- Re-indexation automatique si un fichier est modifié

### Méthode 2 : Indexation manuelle

Si vous voulez forcer la ré-indexation manuellement :

```bash
cd kpmg-ai-backend
python scripts/index_documents.py
```

**Quand utiliser** :
- Après avoir ajouté plusieurs fichiers d'un coup
- Si vous voulez vérifier que l'indexation fonctionne
- Pour forcer une ré-indexation complète

## 📝 Exemple d'utilisation

### Étape 1 : Ajouter un document

```bash
# Copiez votre fichier dans le dossier
cp /chemin/vers/votre/document.pdf kpmg-ai-backend/data/documents/
```

### Étape 2 : Lancer l'indexation

**Option A - Automatique** :
```bash
# Démarrez simplement le serveur
uvicorn app.main:app --reload
# L'indexation se fait automatiquement au démarrage
```

**Option B - Manuelle** :
```bash
# Lancez le script d'indexation
python scripts/index_documents.py
```

### Étape 3 : Vérifier l'indexation

Vous verrez dans les logs :
```
==================================================
Indexing documents in ChromaDB...
==================================================
✓ Loaded mission_petcare_2022.pdf (15 chunks)
📄 Total documents loaded: 15 chunks
📦 Split into 15 chunks for indexing
🔄 Creating embeddings (this may take a moment)...
✅ Indexing complete!
==================================================
```

## 🔍 Comment ça fonctionne

1. **Détection** : Le système scanne `data/documents/` au démarrage
2. **Chargement** : Charge tous les fichiers supportés (PDF, TXT, DOCX, MD)
3. **Découpage** : Découpe chaque document en chunks de 1000 caractères
4. **Embeddings** : Crée des embeddings avec OpenAI
5. **Indexation** : Stocke dans ChromaDB avec métadonnées (nom fichier, type)
6. **Cache** : Met en cache pour éviter de ré-indexer à chaque requête

## 🔄 Détection des changements

Le système détecte automatiquement :
- ✅ Nouveaux fichiers ajoutés
- ✅ Fichiers modifiés (via hash MD5)
- ✅ Fichiers supprimés

Si un changement est détecté, le système re-indexe automatiquement.

## 📊 Métadonnées stockées

Pour chaque chunk indexé, le système stocke :
- `source_file` : Chemin complet du fichier
- `file_name` : Nom du fichier
- `file_type` : Extension (.pdf, .txt, etc.)

Ces métadonnées sont utilisées pour afficher la source dans les résultats de recherche.

## ⚙️ Configuration

Aucune configuration nécessaire ! Le système utilise :
- `data/documents/` pour les fichiers sources
- `data/chroma_db/` pour l'index ChromaDB (créé automatiquement)

Tout est automatique.

## 🐛 Dépannage

### "Aucun document trouvé"

**Solution** : Vérifiez que vos fichiers sont dans `data/documents/` et qu'ils ont une extension supportée (.pdf, .txt, .md, .docx)

### "Erreur lors du chargement"

**Solution** : 
- Vérifiez que le fichier n'est pas corrompu
- Vérifiez les permissions de lecture
- Pour les PDF, assurez-vous qu'ils ne sont pas protégés par mot de passe

### Indexation lente

**Normal** : La première indexation peut prendre quelques minutes selon le nombre et la taille des fichiers. Les indexations suivantes sont plus rapides (seulement les fichiers modifiés).

## 💡 Conseils

1. **Organisez vos fichiers** : Créez des sous-dossiers dans `data/documents/` pour organiser (missions/, etudes/, etc.)

2. **Nommez clairement** : Les noms de fichiers apparaissent dans les résultats de recherche

3. **Taille des fichiers** : Les très gros fichiers (>50MB) peuvent être lents à indexer

4. **Qualité des documents** : Les PDF scannés (images) ne fonctionneront pas - il faut des PDF avec texte extractible
