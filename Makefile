# Makefile pour AbView
# Utilise clientv2 comme frontend principal (port 5174)
# client (port 5173) gardé pour référence historique

.PHONY: help run prod chromium get-token stop logs logs-api logs-files logs-stats logs-tail logs-clean reset

help:
	@echo "Commandes disponibles (utilise clientv2 - client gardé pour référence):"
	@echo "  run         - Lancement en mode développement"
	@echo "  prod        - Lancement en mode production"
	@echo "  chromium    - Ouverture du frontend clientv2 dans Chromium en mode kiosk"
	@echo "  get-token   - Récupération du token"
	@echo "  stop        - Arrêt des conteneurs"
	@echo "  logs        - Suivi des logs Docker"
	@echo "  logs-api    - Voir les logs via API (dernières 24h)"
	@echo "  logs-files  - Lister les fichiers de logs"
	@echo "  logs-stats  - Statistiques des logs"
	@echo "  logs-tail   - Suivre les logs en temps réel"
	@echo "  logs-clean  - Nettoyer les anciens logs"
	@echo "  reset       - Réinitialisation de l'environnement"

run:
	@echo "Lancement en mode dev..."
	doppler run -p abview -c dev -- docker compose up

prod:
	@echo "Lancement en mode prod..."
	doppler run -p abview -c dev -- docker compose up -d
	@echo "Attente du démarrage des services (15 secondes)..."
	@sleep 15
	@$(MAKE) chromium

chromium:
	@echo "Ouverture du frontend clientv2 dans Chromium en mode kiosk..."
	chromium-browser \
		--kiosk \
		--autoplay-policy=no-user-gesture-required \
		--disable-features=PreloadMediaEngagementData,MediaEngagementBypassAutoplayPolicies \
		--disable-gesture-requirement-for-media-playback \
		--disable-infobars \
		--noerrdialogs \
		--check-for-update-interval=31536000 \
		--disable-session-crashed-bubble \
		--disable-component-extensions-with-background-pages \
		http://127.0.0.1:5174 &

get-token:
	doppler run -p abview -c dev -- npx tsx server/scripts/get_token.ts

stop:
	@echo "Arrêt des conteneurs et du navigateur..."
	docker compose down
	@echo "Fermeture de Chromium..."
	-pkill -f chromium || true

logs:
	@echo "Suivi des logs..."
	docker compose logs -f

logs-api:
	@echo "Logs API - Toutes les catégories (dernières 24h)..."
	@if command -v jq >/dev/null 2>&1; then \
		curl -s http://localhost:3333/logs | jq '.logs[0:10] // []'; \
	else \
		echo "jq not found. Installing jq..."; \
		sudo apt-get update && sudo apt-get install -y jq; \
		curl -s http://localhost:3333/logs | jq '.logs[0:10] // []'; \
	fi

logs-api-category:
	@echo "Usage: make logs-api-category CATEGORY=api HOURS=24"
	@echo "Exemple: make logs-api-category CATEGORY=theme HOURS=2"
	@if [ -z "$(CATEGORY)" ]; then echo "Erreur: spécifiez CATEGORY (api, theme, error, system, audio)"; exit 1; fi
	@echo "Logs $(CATEGORY) - dernières $(HOURS) heures..."
	@if command -v jq >/dev/null 2>&1; then \
		curl -s "http://localhost:3333/logs/$(CATEGORY)?hours=$(or $(HOURS),24)" | jq '.logs[0:20] // []'; \
	else \
		echo "jq not found. Installing jq..."; \
		sudo apt-get update && sudo apt-get install -y jq; \
		curl -s "http://localhost:3333/logs/$(CATEGORY)?hours=$(or $(HOURS),24)" | jq '.logs[0:20] // []'; \
	fi

logs-files:
	@echo "Fichiers de logs disponibles..."
	@if command -v jq >/dev/null 2>&1; then \
		curl -s http://localhost:3333/logs-files | jq .; \
	else \
		echo "jq not found. Installing jq..."; \
		sudo apt-get update && sudo apt-get install -y jq; \
		curl -s http://localhost:3333/logs-files | jq .; \
	fi

logs-stats:
	@echo "Statistiques des logs..."
	@if command -v jq >/dev/null 2>&1; then \
		curl -s http://localhost:3333/logs-stats | jq .; \
	else \
		echo "jq not found. Installing jq..."; \
		sudo apt-get update && sudo apt-get install -y jq; \
		curl -s http://localhost:3333/logs-stats | jq .; \
	fi

logs-tail:
	@echo "Suivi des logs en temps réel (toutes catégories)..."
	@if command -v jq >/dev/null 2>&1; then \
		while true; do \
			curl -s http://localhost:3333/logs?hours=1 | jq -r '.logs[] | "\(.timestamp) [\(.category)] \(.message)"' | head -5; \
			sleep 30; \
			echo "--- Mise à jour $$(date) ---"; \
		done; \
	else \
		echo "jq not found. Installing jq..."; \
		sudo apt-get update && sudo apt-get install -y jq; \
		while true; do \
			curl -s http://localhost:3333/logs?hours=1 | jq -r '.logs[] | "\(.timestamp) [\(.category)] \(.message)"' | head -5; \
			sleep 30; \
			echo "--- Mise à jour $$(date) ---"; \
		done; \
	fi

logs-clean:
	@echo "Nettoyage des logs de plus de 7 jours..."
	@find ./logs -name "*.log" -mtime +7 -delete 2>/dev/null || echo "Aucun fichier de logs trouvé"
	@echo "Logs nettoyés."

reset:
	@echo "Réinitialisation de l'environnement..."
	@docker compose down -v --rmi local
	@echo "Suppression des dossiers node_modules..."
	@rm -rf ./server/node_modules
	@rm -rf ./client/node_modules
	@echo "Suppression du cache npm..."
	@npm cache clean --force
	@echo "Environnement réinitialisé. Tu peux relancer avec 'make run' ou 'make prod'."