import os
import zipfile

# Nom du fichier ZIP de sortie
OUTPUT_ZIP = "nutrition-planner-clean.zip"

# Dossiers/fichiers à exclure
EXCLUDES = {
    "node_modules",
    ".venv",
    "__pycache__",
    ".git",
    ".idea",
    ".vscode",
    "dist",
    "build",
}

def should_exclude(path: str) -> bool:
    """Vérifie si un chemin doit être exclu (dossier ou fichier)."""
    parts = path.split(os.sep)
    return any(part in EXCLUDES for part in parts)

def make_zip(root_dir: str = "."):
    """Crée un ZIP du projet en excluant les dossiers inutiles."""
    with zipfile.ZipFile(OUTPUT_ZIP, "w", zipfile.ZIP_DEFLATED) as zipf:
        for foldername, subfolders, filenames in os.walk(root_dir):
            if should_exclude(foldername):
                continue

            for filename in filenames:
                file_path = os.path.join(foldername, filename)
                if should_exclude(file_path):
                    continue

                arcname = os.path.relpath(file_path, root_dir)
                zipf.write(file_path, arcname)
                print(f"✅ Ajouté : {arcname}")

    print(f"\n🎉 ZIP généré : {OUTPUT_ZIP}")

if __name__ == "__main__":
    make_zip()
