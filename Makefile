# Makefile pour AbView
# Utilise client comme frontend principal (port 5175)

.PHONY: help run prod prod-browser get-token stop logs logs-api logs-files logs-stats logs-tail logs-clean reset

help:
	@echo "Commandes disponibles (utilise client comme frontend principal):"
	@echo "  run         - Lancement en mode développement"
	@echo "  prod        - Lancement en mode production (client + api)"
	@echo "  prod-browser - Ouvre le frontend client dans Chromium en mode kiosk (optionnel)"
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
	@echo "Lancement en mode prod (client + api)..."
	doppler run -p abview -c dev -- docker compose up -d client api

prod-browser:
	@echo "Ouverture du frontend client dans Chromium en mode kiosk..."
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
		http://127.0.0.1:5175 &

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

services:
	@echo "=== État des services AbView ==="
	@echo ""
	@# Vérifier l'état des services
	@if docker compose ps --format json | jq -e '.[] | select(.Name == "abview-client-1") | .State' >/dev/null 2>&1; then \
		CLIENT_STATE=$$(docker compose ps --format json | jq -r '.[] | select(.Name == "abview-client-1") | .State'); \
		if [ "$$CLIENT_STATE" = "running" ]; then \
			echo "🌐 Frontend      : RUNNING  → http://localhost:5175"; \
		else \
			echo "🌐 Frontend      : STOPPED  → http://localhost:5175 (port indisponible)"; \
		fi; \
	else \
		echo "🌐 Frontend      : STOPPED  → http://localhost:5175 (service non démarré)"; \
	fi
	@if docker compose ps --format json | jq -e '.[] | select(.Name == "abview-api-1") | .State' >/dev/null 2>&1; then \
		API_STATE=$$(docker compose ps --format json | jq -r '.[] | select(.Name == "abview-api-1") | .State'); \
		if [ "$$API_STATE" = "running" ]; then \
			echo "🔧 Backend API   : RUNNING  → http://localhost:3333"; \
			echo "📊 Logs API      : RUNNING  → http://localhost:3333/logs"; \
			echo "📋 Health check  : RUNNING  → http://localhost:3333/health"; \
		else \
			echo "🔧 Backend API   : STOPPED  → http://localhost:3333 (port indisponible)"; \
			echo "📊 Logs API      : STOPPED  → http://localhost:3333/logs (port indisponible)"; \
			echo "📋 Health check  : STOPPED  → http://localhost:3333/health (port indisponible)"; \
		fi; \
	else \
		echo "🔧 Backend API   : STOPPED  → http://localhost:3333 (service non démarré)"; \
		echo "📊 Logs API      : STOPPED  → http://localhost:3333/logs (service non démarré)"; \
		echo "📋 Health check  : STOPPED  → http://localhost:3333/health (service non démarré)"; \
	fi
	@echo ""
	@echo "=== Commandes utiles ==="
	@echo "make run          - Lancer en mode développement"
	@echo "make prod         - Lancer en mode production"
	@echo "make logs         - Suivre tous les logs"
	@echo "make logs-tail    - Logs en temps réel"
	@echo "make stop         - Arrêter tous les services"