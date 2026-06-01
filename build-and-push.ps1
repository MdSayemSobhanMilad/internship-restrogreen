# build-and-push.ps1
# Script to build and push Docker image to Docker Hub

$DOCKER_HUB_USERNAME = "sayemsobhanmilad"
$DOCKER_HUB_IMAGE = "sayemsobhanmilad/internship-restrogreen"
$BUILD_NUMBER = Get-Date -Format "yyyyMMdd-HHmmss"

Write-Host "Building Next.js application..." -ForegroundColor Green
npm run build

Write-Host "Building Docker image..." -ForegroundColor Green
docker build -t "${DOCKER_HUB_IMAGE}:${BUILD_NUMBER}" -t "${DOCKER_HUB_IMAGE}:latest" .

Write-Host "Logging into Docker Hub..." -ForegroundColor Green
docker login -u $DOCKER_HUB_USERNAME

Write-Host "Pushing Docker image to Docker Hub..." -ForegroundColor Green
docker push "${DOCKER_HUB_IMAGE}:${BUILD_NUMBER}"
docker push "${DOCKER_HUB_IMAGE}:latest"

docker logout

Write-Host "Done! Image pushed as: ${DOCKER_HUB_IMAGE}:${BUILD_NUMBER}" -ForegroundColor Green
Write-Host "Also tagged as: ${DOCKER_HUB_IMAGE}:latest" -ForegroundColor Green