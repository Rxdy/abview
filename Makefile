.PHONY: run prod chromium get-token stop logs

run:
	@echo "Lancement en mode dev..."
	doppler run -p abview -c dev -- docker compose up

prod:
	@echo "Lancement en mode prod..."
	doppler run -p abview -c dev -- docker compose up -d
	@sleep 5
	@$(MAKE) chromium

chromium:
	@echo "Ouverture du frontend dans Chromium en mode kiosk..."
	chromium-browser --kiosk http://localhost:5173 &

get-token:
	doppler run -p abview -c dev -- npx tsx server/scripts/get_token.ts

stop:
	@echo "Arrêt des conteneurs..."
	docker compose down

logs:
	@echo "Suivi des logs..."
	docker compose logs -f
