pipeline {
    agent any
    
    environment {
        DOCKER_HUB_USERNAME = 'sayemsobhanmilad'
        DOCKER_HUB_IMAGE = 'sayemsobhanmilad/internship-restrogreen'
        GIT_REPO = 'https://github.com/MdSayemSobhanMilad/internship-restrogreen.git'
        GIT_BRANCH = 'main'
        K8S_NAMESPACE = 'restrogreen'
    }
    
    stages {
        stage('Checkout') {
            steps {
                git branch: "${GIT_BRANCH}", url: "${GIT_REPO}"
                echo 'Code checked out from GitHub successfully'
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
                echo 'Dependencies installed'
            }
        }
        
        stage('Build Next.js Application') {
            steps {
                sh 'npm run build'
                echo 'Next.js build completed'
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    def buildNumber = env.BUILD_NUMBER
                    def imageTag = "${DOCKER_HUB_IMAGE}:${buildNumber}"
                    def latestTag = "${DOCKER_HUB_IMAGE}:latest"
                    
                    docker.build(imageTag, '-f Dockerfile .')
                    
                    echo "Docker image built: ${imageTag}"
                }
            }
        }
        
        stage('Push to Docker Hub') {
            steps {
                script {
                    withCredentials([string(credentialsId: 'docker-hub-password', variable: 'DOCKER_PASSWORD')]) {
                        sh "docker login -u ${DOCKER_HUB_USERNAME} -p ${DOCKER_PASSWORD}"
                        sh "docker push ${DOCKER_HUB_IMAGE}:${BUILD_NUMBER}"
                        sh "docker tag ${DOCKER_HUB_IMAGE}:${BUILD_NUMBER} ${DOCKER_HUB_IMAGE}:latest"
                        sh "docker push ${DOCKER_HUB_IMAGE}:latest"
                        sh 'docker logout'
                    }
                }
                echo 'Docker image pushed to Docker Hub'
            }
        }
        
        stage('Deploy to Kubernetes') {
            steps {
                script {
                    withKubeConfig([credentialsId: 'kubeconfig']) {
                        sh "kubectl apply -f k8s/namespace.yaml"
                        sh "kubectl apply -f k8s/configmap.yaml"
                        sh "kubectl apply -f k8s/secrets.yaml"
                        sh "kubectl apply -f k8s/mysql-deployment.yaml"
                        
                        sh """
                            kubectl wait --for=condition=ready pod \
                            -l app=mysql \
                            -n ${K8S_NAMESPACE} \
                            --timeout=120s
                        """
                        
                        sh """
                            kubectl set image deployment/restrogreen-app \
                            restrogreen=${DOCKER_HUB_IMAGE}:${BUILD_NUMBER} \
                            -n ${K8S_NAMESPACE}
                        """
                        
                        sh "kubectl apply -f k8s/app-deployment.yaml"
                        
                        sh """
                            kubectl rollout status deployment/restrogreen-app \
                            -n ${K8S_NAMESPACE} \
                            --timeout=120s
                        """
                        
                        sh "kubectl apply -f k8s/ingress.yaml"
                    }
                }
                echo 'Deployment to Kubernetes completed'
            }
        }
    }
    
    post {
        always {
            cleanWs()
            echo 'Pipeline completed'
        }
        success {
            echo "RestroGreen Build #${BUILD_NUMBER} deployed successfully!"
        }
        failure {
            echo "RestroGreen Build #${BUILD_NUMBER} failed!"
        }
    }
}