#!/bin/bash

# HealthBridge AI - Automated Setup Script
# This script sets up the development environment for HealthBridge AI

set -e  # Exit on any error

echo "🏥 HealthBridge AI - Development Setup"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    local missing_deps=()
    
    if ! command_exists node; then
        missing_deps+=("Node.js 18+")
    else
        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -lt 18 ]; then
            missing_deps+=("Node.js 18+ (current: $(node --version))")
        fi
    fi
    
    if ! command_exists npm; then
        missing_deps+=("npm")
    fi
    
    if ! command_exists python3; then
        missing_deps+=("Python 3.8+")
    else
        PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1-2)
        if ! python3 -c "import sys; exit(0 if sys.version_info >= (3, 8) else 1)" 2>/dev/null; then
            missing_deps+=("Python 3.8+ (current: $PYTHON_VERSION)")
        fi
    fi
    
    if ! command_exists pip3; then
        missing_deps+=("pip3")
    fi
    
    if ! command_exists git; then
        missing_deps+=("git")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing prerequisites:"
        for dep in "${missing_deps[@]}"; do
            echo "  - $dep"
        done
        echo ""
        echo "Please install the missing dependencies and run this script again."
        echo ""
        echo "Installation guides:"
        echo "  Node.js: https://nodejs.org/"
        echo "  Python: https://python.org/"
        echo "  Git: https://git-scm.com/"
        exit 1
    fi
    
    print_success "All prerequisites are installed"
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    if command_exists psql; then
        print_status "PostgreSQL detected, setting up production database..."
        
        # Check if database exists
        if psql -lqt | cut -d \| -f 1 | grep -qw healthbridge; then
            print_warning "Database 'healthbridge' already exists"
            read -p "Do you want to recreate it? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                dropdb healthbridge 2>/dev/null || true
                createdb healthbridge
                print_success "Database recreated"
            fi
        else
            createdb healthbridge
            print_success "Database created"
        fi
        
        # Apply schema
        if [ -f "database/schema.sql" ]; then
            psql -d healthbridge -f database/schema.sql
            print_success "Database schema applied"
        else
            print_warning "Database schema file not found, skipping..."
        fi
        
    elif command_exists sqlite3; then
        print_status "Using SQLite for development..."
        
        if [ -f "healthbridge.db" ]; then
            print_warning "SQLite database already exists"
            read -p "Do you want to recreate it? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                rm -f healthbridge.db
            fi
        fi
        
        if [ ! -f "healthbridge.db" ] && [ -f "database/schema_sqlite.sql" ]; then
            sqlite3 healthbridge.db < database/schema_sqlite.sql
            print_success "SQLite database created"
        fi
        
    else
        print_warning "No database system detected. Please install PostgreSQL or SQLite."
        print_status "For development, you can use SQLite:"
        echo "  Ubuntu/Debian: sudo apt-get install sqlite3"
        echo "  macOS: brew install sqlite3"
        echo ""
        print_status "For production, install PostgreSQL:"
        echo "  Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
        echo "  macOS: brew install postgresql"
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Root dependencies
    if [ -f "package.json" ]; then
        print_status "Installing root dependencies..."
        npm install
        print_success "Root dependencies installed"
    fi
    
    # Backend dependencies
    if [ -f "backend/package.json" ]; then
        print_status "Installing backend dependencies..."
        cd backend
        npm install
        cd ..
        print_success "Backend dependencies installed"
    fi
    
    # Frontend dependencies
    if [ -f "frontend/package.json" ]; then
        print_status "Installing frontend dependencies..."
        cd frontend
        npm install
        cd ..
        print_success "Frontend dependencies installed"
    fi
    
    # AI Engine dependencies
    if [ -f "ai-engine/requirements.txt" ]; then
        print_status "Installing AI engine dependencies..."
        cd ai-engine
        
        # Create virtual environment if it doesn't exist
        if [ ! -d "venv" ]; then
            python3 -m venv venv
            print_success "Python virtual environment created"
        fi
        
        # Activate virtual environment and install dependencies
        source venv/bin/activate
        pip install -r requirements.txt
        deactivate
        
        cd ..
        print_success "AI engine dependencies installed"
    fi
}

# Setup environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    # Backend environment
    if [ -f "backend/.env.example" ] && [ ! -f "backend/.env" ]; then
        cp backend/.env.example backend/.env
        print_success "Backend .env file created"
        print_warning "Please edit backend/.env with your configuration"
    fi
    
    # AI Engine environment
    if [ -f "ai-engine/.env.example" ] && [ ! -f "ai-engine/.env" ]; then
        cp ai-engine/.env.example ai-engine/.env
        print_success "AI engine .env file created"
    fi
    
    # Generate JWT secret if not set
    if [ -f "backend/.env" ]; then
        if ! grep -q "JWT_SECRET=" backend/.env || grep -q "JWT_SECRET=your_super_secret_jwt_key" backend/.env; then
            JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || python3 -c "import secrets; print(secrets.token_urlsafe(32))")
            sed -i.bak "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" backend/.env
            rm -f backend/.env.bak
            print_success "JWT secret generated"
        fi
    fi
}

# Download AI models (optional)
download_models() {
    print_status "Checking AI models..."
    
    if [ -f "ai-engine/download_models.py" ]; then
        read -p "Do you want to download AI models? This may take a while. (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            cd ai-engine
            source venv/bin/activate
            python download_models.py
            deactivate
            cd ..
            print_success "AI models downloaded"
        else
            print_warning "Skipping AI model download. The system will use fallback models."
        fi
    fi
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p logs
    mkdir -p uploads
    mkdir -p ai-engine/models
    mkdir -p frontend/assets/images
    mkdir -p backend/uploads
    
    print_success "Directories created"
}

# Run tests
run_tests() {
    read -p "Do you want to run tests to verify the setup? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Running tests..."
        
        # Backend tests
        if [ -f "backend/package.json" ]; then
            cd backend
            if npm run test --silent 2>/dev/null; then
                print_success "Backend tests passed"
            else
                print_warning "Backend tests failed or not configured"
            fi
            cd ..
        fi
        
        # AI Engine tests
        if [ -f "ai-engine/requirements.txt" ]; then
            cd ai-engine
            source venv/bin/activate
            if python -m pytest tests/ --quiet 2>/dev/null; then
                print_success "AI engine tests passed"
            else
                print_warning "AI engine tests failed or not configured"
            fi
            deactivate
            cd ..
        fi
    fi
}

# Display next steps
show_next_steps() {
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Review and update configuration files:"
    echo "   - backend/.env"
    echo "   - ai-engine/.env"
    echo ""
    echo "2. Start the development servers:"
    echo "   npm run dev                 # Start all services"
    echo "   # OR start individually:"
    echo "   npm run backend            # Backend API (port 3000)"
    echo "   npm run frontend           # React Native (port 8081)"
    echo "   npm run ai-engine          # AI Engine (port 5000)"
    echo ""
    echo "3. For mobile development:"
    echo "   cd frontend"
    echo "   npx react-native run-android    # Android"
    echo "   npx react-native run-ios        # iOS (macOS only)"
    echo ""
    echo "4. Access the application:"
    echo "   - API Health Check: http://localhost:3000/health"
    echo "   - AI Engine Health: http://localhost:5000/health"
    echo "   - Web App: http://localhost:8081"
    echo ""
    echo "📚 Documentation:"
    echo "   - Setup Guide: docs/SETUP.md"
    echo "   - Architecture: docs/ARCHITECTURE.md"
    echo "   - API Documentation: docs/API.md"
    echo ""
    echo "🆘 Need help? Check the troubleshooting section in docs/SETUP.md"
}

# Main setup function
main() {
    echo "Starting HealthBridge AI setup..."
    echo ""
    
    check_prerequisites
    create_directories
    setup_database
    install_dependencies
    setup_environment
    download_models
    run_tests
    show_next_steps
}

# Handle script interruption
trap 'print_error "Setup interrupted"; exit 1' INT

# Run main function
main

print_success "Setup script completed!"