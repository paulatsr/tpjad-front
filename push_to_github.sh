#!/bin/bash

# Script pentru a face push la frontend pe GitHub

echo "🚀 Push frontend pe GitHub"
echo ""
echo "Pașii:"
echo "1. Creează un repository nou pe GitHub: https://github.com/new"
echo "2. Alege un nume (ex: school-frontend)"
echo "3. NU bifa 'Initialize with README'"
echo "4. Click 'Create repository'"
echo ""
read -p "Ai creat repository-ul? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    read -p "Introdu URL-ul repository-ului (ex: https://github.com/TU_USERNAME/TU_REPO.git): " REPO_URL
    
    if [ -z "$REPO_URL" ]; then
        echo "❌ URL invalid"
        exit 1
    fi
    
    echo ""
    echo "📡 Adăugare remote origin..."
    git remote add origin "$REPO_URL" 2>/dev/null || git remote set-url origin "$REPO_URL"
    
    echo "🌿 Setare branch main..."
    git branch -M main
    
    echo "📤 Push la GitHub..."
    git push -u origin main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Succes! Frontend-ul a fost pus pe GitHub!"
        echo "🔗 Repository: $REPO_URL"
    else
        echo ""
        echo "❌ Eroare la push. Verifică:"
        echo "   - URL-ul repository-ului este corect"
        echo "   - Ai permisiuni de scriere pe repository"
        echo "   - Ai configurat autentificarea GitHub (token sau SSH)"
    fi
else
    echo ""
    echo "Creează repository-ul pe GitHub și rulează din nou scriptul."
    echo ""
    echo "Sau rulează manual:"
    echo "  git remote add origin https://github.com/TU_USERNAME/TU_REPO.git"
    echo "  git branch -M main"
    echo "  git push -u origin main"
fi

