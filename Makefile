# Makefile pour Abview

.PHONY: run get-token

# Lancer l'application avec Docker Compose
run:
	doppler run -p abview -c dev -- docker compose up

# Générer un token OAuth2 pour Google APIs
get-token:
	doppler run -p abview -c dev -- npx tsx server/scripts/get_token.ts