# Docker Images & Deployment

Ce document explique comment utiliser les images Docker d'AbView pour le déploiement en production.

## Images Disponibles

### Frontend
- **Image**: `ghcr.io/rxdy/abview/frontend:latest`
- **Port**: 80
- **Description**: Application Vue.js servie par Nginx

### Backend
- **Image**: `ghcr.io/rxdy/abview/backend:latest`
- **Port**: 3333
- **Description**: API AdonisJS

## Construction des Images

### Construction Locale
```bash
# Construire toutes les images
docker build --target frontend -t abview-frontend .
docker build --target backend -t abview-backend .

# Ou utiliser le script fourni
./build-and-push.sh [tag]
```

### Push vers GHCR
```bash
# Se connecter à GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Pousser les images
docker tag abview-frontend ghcr.io/rxdy/abview/frontend:latest
docker tag abview-backend ghcr.io/rxdy/abview/backend:latest
docker push ghcr.io/rxdy/abview/frontend:latest
docker push ghcr.io/rxdy/abview/backend:latest
```

## Déploiement en Production

### Avec Docker Compose
```bash
# Utiliser la configuration de production
docker-compose -f docker-compose.prod.yml up -d

# Vérifier l'état des services
docker-compose -f docker-compose.prod.yml ps
```

### Variables d'Environnement Requises
Créer un fichier `.env` ou définir les variables :

```bash
# Application
APP_KEY=your-app-key-here
NODE_ENV=production

# Base de données
DB_HOST=your-db-host
DB_PORT=3306
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_DATABASE=your-db-name

# Google APIs
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=your-google-redirect-uri
GOOGLE_REFRESH_TOKEN=your-google-refresh-token
GOOGLE_ACCESS_TOKEN=your-google-access-token

# OpenWeather
OPENWEATHER_API_KEY=your-openweather-api-key
```

## CI/CD avec GitHub Actions

### Workflow Example
```yaml
name: Build and Push Docker Images

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Log in to GitHub Container Registry
      uses: docker/login-action@v2
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Build and push frontend
      uses: docker/build-push-action@v4
      with:
        context: .
        target: frontend
        push: true
        tags: ghcr.io/rxdy/abview/frontend:latest

    - name: Build and push backend
      uses: docker/build-push-action@v4
      with:
        context: .
        target: backend
        push: true
        tags: ghcr.io/rxdy/abview/backend:latest
```

## Terraform (Préparation)

Pour un déploiement automatisé avec Terraform :

### Variables Terraform
```hcl
variable "app_version" {
  description = "Version de l'application AbView"
  type        = string
  default     = "latest"
}

variable "environment" {
  description = "Environnement de déploiement"
  type        = string
  default     = "production"
}
```

### Resources Docker
```hcl
resource "docker_image" "abview_frontend" {
  name = "ghcr.io/rxdy/abview/frontend:${var.app_version}"
}

resource "docker_image" "abview_backend" {
  name = "ghcr.io/rxdy/abview/backend:${var.app_version}"
}

resource "docker_container" "frontend" {
  name  = "abview-frontend"
  image = docker_image.abview_frontend.image_id

  ports {
    internal = 80
    external = 80
  }

  env = [
    "TZ=Europe/Paris"
  ]
}

resource "docker_container" "backend" {
  name  = "abview-backend"
  image = docker_image.abview_backend.image_id

  ports {
    internal = 3333
    external = 3333
  }

  env = [
    "NODE_ENV=production",
    "PORT=3333",
    "HOST=0.0.0.0"
  ]
}
```

## Monitoring et Health Checks

### Health Checks
- **Frontend**: `curl http://localhost`
- **Backend**: `curl http://localhost:3333/health`

### Logs
```bash
# Logs des conteneurs
docker-compose -f docker-compose.prod.yml logs -f

# Logs spécifiques à un service
docker-compose -f docker-compose.prod.yml logs -f backend
```

## Sécurité

### Bonnes Pratiques
- Utiliser des secrets pour les tokens API
- Configurer HTTPS en production
- Mettre à jour régulièrement les images de base
- Scanner les vulnérabilités avec des outils comme Trivy

### Variables Sensibles
Ne jamais commiter :
- `APP_KEY`
- Tokens Google
- Clés API
- Mots de passe base de données

Utiliser des secrets GitHub Actions ou des variables d'environnement.