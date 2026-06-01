pipeline {
    agent any
    
    environment {
        DOCKER_HUB_USERNAME = 'sayemsobhanmilad'
        DOCKER_HUB_IMAGE = 'sayemsobhanmilad/internship-restrogreen'
        GIT_REPO = 'https://github.com/MdSayemSobhanMilad/internship-restrogreen.git'
        GIT_BRANCH = 'main'
        K8S_NAMESPACE = 'restrogreen'
        BUILD_TAG = "${BUILD_NUMBER}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                git branch: "${GIT_BRANCH}", url: "${GIT_REPO}"
                echo "Code checked out from GitHub successfully"
            }
        }
        
    stage('Install Dependencies') {
        steps {
                script {
                    try {
                        sh 'npm ci'
                    } catch (Exception e) {
                        echo 'npm ci failed, falling back to npm install'
                        sh 'npm install'
                    }
                }
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
                    echo "Building Docker image: ${DOCKER_HUB_IMAGE}:${BUILD_TAG}"
                    sh "docker build -t ${DOCKER_HUB_IMAGE}:${BUILD_TAG} -t ${DOCKER_HUB_IMAGE}:latest -f Dockerfile ."
                    echo "Docker image built successfully"
                }
            }
        }
        
        stage('Push to Docker Hub') {
            steps {
                script {
                    // Use Jenkins credentials stored with ID 'docker-hub-credentials'
                    withCredentials([usernamePassword(
                        credentialsId: 'docker-hub-credentials',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )]) {
                        sh """
                            echo "\${DOCKER_PASS}" | docker login -u "\${DOCKER_USER}" --password-stdin
                            docker push ${DOCKER_HUB_IMAGE}:${BUILD_TAG}
                            docker push ${DOCKER_HUB_IMAGE}:latest
                            docker logout
                        """
                    }
                    echo 'Docker image pushed to Docker Hub'
                }
            }
        }
        
        stage('Deploy to Kubernetes') {
            steps {
                script {
                    withKubeConfig([credentialsId: 'kubeconfig']) {
                        sh """
                            kubectl apply -f k8s/namespace.yaml
                            kubectl apply -f k8s/configmap.yaml
                            kubectl apply -f k8s/secrets.yaml
                            kubectl apply -f k8s/mysql-deployment.yaml
                            
                            kubectl wait --for=condition=ready pod \
                                -l app=mysql \
                                -n ${K8S_NAMESPACE} \
                                --timeout=120s
                            
                            kubectl set image deployment/restrogreen-app \
                                restrogreen=${DOCKER_HUB_IMAGE}:${BUILD_TAG} \
                                -n ${K8S_NAMESPACE}
                            
                            kubectl apply -f k8s/app-deployment.yaml
                            
                            kubectl rollout status deployment/restrogreen-app \
                                -n ${K8S_NAMESPACE} \
                                --timeout=120s
                            
                            kubectl apply -f k8s/ingress.yaml
                        """
                    }
                }
                echo 'Deployment to Kubernetes completed'
            }
        }
    }
    
    post {
        always {
            cleanWs()
            echo 'Pipeline finished'
        }
        success {
            echo "RestroGreen Build #${BUILD_NUMBER} deployed successfully!"
        }
        failure {
            echo "RestroGreen Build #${BUILD_NUMBER} failed!"
        }
    }
}