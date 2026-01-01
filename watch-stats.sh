#!/bin/bash

echo "=== SURVEILLANCE DES DONNÉES STOCKÉES ==="
echo "📍 Répertoire: /home/rxdy/dev/abview/server/app/database/data/"
echo "Date: $(date)"
echo ""

DATA_DIR="/home/rxdy/dev/abview/server/app/database/data"

echo "📂 Fichiers présents:"
ls -la "$DATA_DIR"
echo ""

echo "=== CONTENU DES FICHIERS ==="

# Horaires
if [ -f "$DATA_DIR/horaires.json" ]; then
    echo "📄 horaires.json:"
    echo "Taille: $(stat -c%s "$DATA_DIR/horaires.json") bytes"
    echo "Contenu (premières lignes):"
    head -10 "$DATA_DIR/horaires.json"
    echo ""
fi

# Stats actuelles
if [ -f "$DATA_DIR/yearly-stats.json" ]; then
    echo "📊 yearly-stats.json (stats actuelles):"
    echo "Taille: $(stat -c%s "$DATA_DIR/yearly-stats.json") bytes"
    cat "$DATA_DIR/yearly-stats.json" | jq '.tasks[] | {listTitle, created, completed, createdCount: (.createdIds | length), completedCount: (.completedIds | length)}' 2>/dev/null || cat "$DATA_DIR/yearly-stats.json"
    echo ""
fi

# Météo actuelle
if [ -f "$DATA_DIR/weather-yearly-stats.json" ]; then
    echo "🌤️ weather-yearly-stats.json (météo actuelle):"
    echo "Taille: $(stat -c%s "$DATA_DIR/weather-yearly-stats.json") bytes"
    cat "$DATA_DIR/weather-yearly-stats.json" | jq '{year, daysCount: (.days | length), averageTemp, rainyDays, sunnyDays, description}' 2>/dev/null || cat "$DATA_DIR/weather-yearly-stats.json"
    echo ""
fi

# Archives
echo "=== ARCHIVES ==="
for file in "$DATA_DIR"/*-20*.json; do
    if [ -f "$file" ]; then
        echo "📁 $(basename "$file"):"
        echo "Taille: $(stat -c%s "$file") bytes"
        echo "Date de modification: $(stat -c%y "$file")"
        echo ""
    fi
done

echo "=== FIN DE LA SURVEILLANCE ==="