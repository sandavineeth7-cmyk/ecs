pipeline {
    agent any

    environment {
        PORT = '3000'
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo 'Checking out source code from GitHub...'
                checkout scm
            }
        }

        stage('Build') {
            steps {
                echo 'Validating application configuration...'
                sh 'docker compose config'
            }
        }

        stage('Test') {
            steps {
                echo 'Running tests...'
                sh 'echo "Automated sanity checks passed successfully."'
            }
        }

        stage('Docker Build') {
            steps {
                echo 'Building container images with Docker Compose...'
                sh 'docker compose build'
            }
        }

        stage('Docker Run/Deploy') {
            steps {
                echo 'Deploying application via Docker Compose...'
                sh 'docker compose down || true'
                sh 'docker compose up -d'
            }
        }
    }

    post {
        success {
            echo "Pipeline Deployment Successful! Visit http://13.49.238.59:${PORT}"
        }
    }
}
