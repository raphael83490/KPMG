# Documents KPMG - Base de Connaissances Interne

Placez vos documents ici pour qu'ils soient indexés dans ChromaDB.

## 📁 Emplacement

Placez vos fichiers dans : `data/documents/`

## 📄 Formats supportés

- **PDF** (`.pdf`) - Rapports, études
- **Texte** (`.txt`, `.md`) - Notes, documentation
- **Word** (`.docx`) - Documents Microsoft Word

## 🚀 Indexation

L'indexation se fait automatiquement :
- Au premier lancement du serveur
- Quand un nouveau fichier est détecté
- Quand un fichier existant est modifié

### Indexation manuelle

Si vous voulez forcer la ré-indexation :

```bash
python scripts/index_documents.py
```

## 📝 Exemple

```bash
# Copiez votre fichier
cp votre_document.pdf kpmg-ai-backend/data/documents/

# Démarrez le serveur (indexation automatique)
uvicorn app.main:app --reload
```

## ⚠️ Fichiers exclus

Les fichiers suivants sont automatiquement exclus de l'indexation :
- `README.md`, `readme.txt` (fichiers de documentation)
- `.gitkeep`, `.gitignore` (fichiers de configuration)
- `LICENSE`, `CHANGELOG` (fichiers de projet)

## 📊 Structure recommandée

```
data/documents/
├── missions/
│   ├── mission_petcare_2022.pdf
│   └── mission_cybersecurite_2023.pdf
├── etudes/
│   └── etude_secteur_btp.txt
└── notes.md
```

Voir `GUIDE_RAG.md` pour plus de détails.
