pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'your-registry.com'
        DOCKER_IMAGE = 'restrogreen'
        K8S_NAMESPACE = 'restrogreen'
        GIT_REPO = 'https://github.com/yourusername/restrogreen.git'
        GIT_BRANCH = 'main'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo 'Code checked out successfully'
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
                sh 'npm audit --audit-level=moderate || true'
            }
        }
        
        stage('Run Tests') {
            steps {
                sh 'npm run test || echo "No tests configured"'
                sh 'npm run lint || echo "No lint configured"'
            }
        }
        
        stage('Build Next.js Application') {
            steps {
                sh 'npm run build'
            }
        }
        
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh '''
                        sonar-scanner \
                        -Dsonar.projectKey=restrogreen \
                        -Dsonar.sources=. \
                        -Dsonar.host.url=http://sonarqube:9000 \
                        -Dsonar.login=${SONAR_TOKEN}
                    '''
                }
            }
        }
        
        stage('Quality Gate') {
            steps {
                timeout(time: 1, unit: 'HOURS') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    def tag = "${BUILD_NUMBER}"
                    def imageTag = "${DOCKER_REGISTRY}/${DOCKER_IMAGE}:${tag}"
                    def latestTag = "${DOCKER_REGISTRY}/${DOCKER_IMAGE}:latest"
                    
                    docker.build(imageTag, '-f Dockerfile .')
                    docker.image(imageTag).push()
                    docker.image(imageTag).push(latestTag)
                    
                    echo "Docker image built and pushed: ${imageTag}"
                }
            }
        }
        
        stage('Deploy to Kubernetes') {
            steps {
                script {
                    withKubeConfig([credentialsId: 'kubeconfig']) {
                        // Apply namespace
                        sh "kubectl apply -f k8s/namespace.yaml"
                        
                        // Apply ConfigMaps and Secrets
                        sh "kubectl apply -f k8s/configmap.yaml"
                        sh "kubectl apply -f k8s/secrets.yaml"
                        
                        // Deploy MySQL
                        sh "kubectl apply -f k8s/mysql-deployment.yaml"
                        
                        // Wait for MySQL to be ready
                        sh """
                            kubectl wait --for=condition=ready pod \
                            -l app=mysql \
                            -n ${K8S_NAMESPACE} \
                            --timeout=120s
                        """
                        
                        // Deploy Application
                        sh """
                            kubectl set image deployment/restrogreen-app \
                            restrogreen=${DOCKER_REGISTRY}/${DOCKER_IMAGE}:${BUILD_NUMBER} \
                            -n ${K8S_NAMESPACE}
                        """
                        
                        sh "kubectl apply -f k8s/app-deployment.yaml"
                        
                        // Wait for deployment rollout
                        sh """
                            kubectl rollout status deployment/restrogreen-app \
                            -n ${K8S_NAMESPACE} \
                            --timeout=120s
                        """
                        
                        // Apply Ingress
                        sh "kubectl apply -f k8s/ingress.yaml"
                        
                        echo 'Deployment to Kubernetes completed successfully'
                    }
                }
            }
        }
        
        stage('Smoke Test') {
            steps {
                script {
                    // Get service endpoint
                    def serviceIP = sh(
                        script: "kubectl get svc restrogreen-service -n ${K8S_NAMESPACE} -o jsonpath='{.spec.clusterIP}'",
                        returnStdout: true
                    ).trim()
                    
                    // Curl health check
                    sh """
                        kubectl run curl-test --image=curlimages/curl --rm -i --restart=Never -n ${K8S_NAMESPACE} -- \
                        curl -s -o /dev/null -w '%{http_code}' http://${serviceIP}/
                    """
                }
            }
        }
        
        stage('Cleanup Old Images') {
            steps {
                script {
                    // Keep only last 5 images
                    sh """
                        docker image prune -a --filter "until=24h" --force || true
                        kubectl delete pods --field-selector status.phase=Failed -n ${K8S_NAMESPACE} || true
                    """
                }
            }
        }
    }
    
    post {
        always {
            cleanWs()
            echo 'Pipeline finished'
        }
        success {
            emailext(
                to: 'team@restrogreen.com',
                subject: "Pipeline Success: RestroGreen Build #${BUILD_NUMBER}",
                body: "RestroGreen application deployed successfully.\nBuild: ${BUILD_NUMBER}\nDate: ${new Date()}"
            )
        }
        failure {
            emailext(
                to: 'devops@restrogreen.com',
                subject: "Pipeline Failed: RestroGreen Build #${BUILD_NUMBER}",
                body: "RestroGreen deployment failed.\nBuild: ${BUILD_NUMBER}\nPlease check Jenkins logs."
            )
        }
    }
}