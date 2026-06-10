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
        stage('Check Node Version') {
            steps {
                sh 'node -v && npm -v'
            }
        }
        
        stage('Checkout') {
            steps {
                git branch: "${GIT_BRANCH}", url: "${GIT_REPO}"
                echo 'Code checked out from GitHub successfully'
            }
        }
        
        stage('Install Dependencies') {
            steps {
                script {
                    // Remove any leftover artifacts
                    sh 'rm -rf node_modules package-lock.json'
                    // Fresh install – this will generate a compatible lockfile
                    sh 'npm install'
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
                    echo 'Docker image built successfully'
                }
            }
        }
        
        stage('Push to Docker Hub') {
            steps {
                script {
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
                }
                echo 'Docker image pushed to Docker Hub'
            }
        }

        // ⭐ NEW: Ensure Minikube is running before deployment
        stage('Start Minikube') {
          steps {
            script {
                sh '''
                # Fix permissions on .minikube directory
                    if [ -d "$HOME/.minikube" ]; then
                        sudo chown -R $USER $HOME/.minikube
                        chmod -R u+wrx $HOME/.minikube
                    fi

                    # Delete existing cluster if it is broken
                    if minikube status &>/dev/null; then
                        echo "Minikube is already running. Skipping delete."
                    else
                        echo "Deleting previous Minikube cluster to avoid permission conflicts..."
                        minikube delete --purge || true
                    fi

                    # Start Minikube with Docker driver
                    minikube start --driver=docker --wait=all

                    # Verify connectivity
                    kubectl get nodes
                '''
            }
          }
        }   
        
        stage('Deploy to Kubernetes') {
            steps {
                script {
                    withKubeConfig([credentialsId: 'kubeconfig']) {
                        // 1. Clean up old namespace completely (optional – remove if you want to keep data)
                        sh 'kubectl delete namespace restrogreen --ignore-not-found=true'
                        sh 'kubectl wait --for=delete namespace/restrogreen --timeout=60s || true'
                        sleep 10

                        // 2. Recreate everything
                        sh '''
                            kubectl apply -f k8s/namespace.yaml
                            kubectl apply -f k8s/configmap.yaml
                            kubectl apply -f k8s/secrets.yaml
                            kubectl apply -f k8s/mysql-deployment.yaml
                        '''

                        // 3. Wait for MySQL (only one pod because of Recreate)
                        sh "kubectl wait --for=condition=ready pod -l app=mysql -n ${K8S_NAMESPACE} --timeout=300s"

                        // 4. Deploy the application
                        sh """
                            kubectl apply -f k8s/app-deployment.yaml
                            kubectl set image deployment/restrogreen-app restrogreen=${DOCKER_HUB_IMAGE}:${BUILD_TAG} -n ${K8S_NAMESPACE}
                            kubectl rollout status deployment/restrogreen-app -n ${K8S_NAMESPACE} --timeout=120s
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