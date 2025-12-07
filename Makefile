.PHONY: help run prod chromium get-token stop logs reset

help:
	@echo "Commandes disponibles :"
	@echo "  run       - Lancement en mode développement"
	@echo "  prod      - Lancement en mode production"
	@echo "  chromium  - Ouverture du frontend dans Chromium en mode kiosk"
	@echo "  get-token - Récupération du token"
	@echo "  stop      - Arrêt des conteneurs"
	@echo "  logs      - Suivi des logs"
	@echo "  reset     - Réinitialisation de l'environnement"

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
	@echo "Ouverture du frontend dans Chromium en mode kiosk..."
	chromium-browser \
		--kiosk \
		--disable-web-security \
		--disable-application-cache \
		--disk-cache-dir=/dev/null \
		--cursor-visibility=0 \
		--autoplay-policy=no-user-gesture-required \
		--disable-features=PreloadMediaEngagementData,MediaEngagementBypassAutoplayPolicies \
		--disable-gesture-requirement-for-media-playback \
		--disable-infobars \
		--noerrdialogs \
		http://127.0.0.1:5173 &

get-token:
	doppler run -p abview -c dev -- npx tsx server/scripts/get_token.ts

stop:
	@echo "Arrêt des conteneurs..."
	docker compose down

logs:
	@echo "Suivi des logs..."
	docker compose logs -f

reset:
	@echo "Réinitialisation de l'environnement..."
	@docker compose down -v --rmi local
	@echo "Suppression des dossiers node_modules..."
	@rm -rf ./server/node_modules
	@rm -rf ./client/node_modules
	@echo "Suppression du cache npm..."
	@npm cache clean --force
	@echo "Environnement réinitialisé. Tu peux relancer avec 'make run' ou 'make prod'."