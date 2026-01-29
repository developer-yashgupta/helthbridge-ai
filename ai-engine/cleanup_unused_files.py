import os
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class UnusedFileCleanup:
    """Remove unused files and keep only production-ready components"""
    
    def __init__(self):
        self.ai_engine_path = Path('.')
        self.backend_path = Path('../backend')
        self.files_removed = 0
        
    def remove_unused_files(self):
        """Remove unused files from AI engine"""
        
        # Files to remove (unused/duplicate/test files)
        unused_files = [
            'app.py',  # Replace with enhanced_app.py
            'test_ai_engine.py',  # Old test file
            'final_ml_test.py',  # Duplicate test
            'test_enhanced_system.py',  # Development test
            'cleanup_mock_files.py',  # One-time cleanup script
            'AI_ENGINE_SUMMARY.md',  # Old summary
            'REAL_ML_AI_SUMMARY.md',  # Duplicate summary
            'FINAL_KAGGLE_ML_SUMMARY.md',  # Duplicate summary
            'model_evaluation.py',  # Development evaluation
            'performance_benchmark.py',  # Development benchmark
        ]
        
        print("🗑️ Removing unused files...")
        
        for file_name in unused_files:
            file_path = self.ai_engine_path / file_name
            if file_path.exists():
                try:
                    file_path.unlink()
                    print(f"   ✅ Removed: {file_name}")
                    self.files_removed += 1
                except Exception as e:
                    print(f"   ❌ Failed to remove {file_name}: {str(e)}")
        
        # Rename enhanced_app.py to app.py (main entry point)
        enhanced_app = self.ai_engine_path / 'enhanced_app.py'
        main_app = self.ai_engine_path / 'app.py'
        
        if enhanced_app.exists():
            try:
                enhanced_app.rename(main_app)
                print(f"   ✅ Renamed: enhanced_app.py → app.py")
                self.files_removed += 1
            except Exception as e:
                print(f"   ❌ Failed to rename enhanced_app.py: {str(e)}")
    
    def create_production_file_list(self):
        """Create list of production files"""
        
        production_files = {
            'ai_engine': [
                'app.py',  # Main Flask application
                'ml_models.py',  # Real ML models with Kaggle data
                'enhanced_symptom_analyzer.py',  # Enhanced symptom analysis
                'healthcare_routing_system.py',  # Healthcare routing
                'multilingual_processor.py',  # Language support
                'triage_engine.py',  # Triage decisions
                'offline_models.py',  # Offline capability
                'kaggle_data_loader.py',  # Real data loading
                'ENHANCED_SYSTEM_SUMMARY.md'  # Final documentation
            ],
            'backend': [
                'server.js',  # Main server
                'routes/auth.js',  # Authentication
                'routes/symptoms.js',  # Symptom routes
                'routes/resources.js',  # Resource routes
                'routes/asha.js',  # ASHA routes
                'routes/teleconsult.js',  # Teleconsult routes
                'routes/triage.js',  # Triage routes
                'models/User.js',  # User model
                'services/otpService.js',  # OTP service
                'middleware/errorHandler.js',  # Error handling
                'middleware/validation.js',  # Input validation
                'utils/logger.js',  # Logging utility
                'config/database.js',  # Database config
                'tests/api.test.js'  # API tests
            ]
        }
        
        print("\n📋 Production Files List:")
        print("=" * 40)
        
        for category, files in production_files.items():
            print(f"\n{category.upper()}:")
            for file in files:
                file_path = Path(f"../{category}" if category == 'backend' else '.') / file
                status = "✅" if file_path.exists() else "❌"
                print(f"  {status} {file}")
        
        return production_files
    
    def run_cleanup(self):
        """Run complete cleanup process"""
        
        print("🧹 CLEANING UP UNUSED FILES")
        print("=" * 40)
        
        # Remove unused files
        self.remove_unused_files()
        
        # Show production files
        production_files = self.create_production_file_list()
        
        print(f"\n🎯 Cleanup Summary:")
        print(f"   Files removed: {self.files_removed}")
        print(f"   Production files: {len(production_files['ai_engine']) + len(production_files['backend'])}")
        
        return True

def main():
    """Run cleanup"""
    cleanup = UnusedFileCleanup()
    cleanup.run_cleanup()

if __name__ == "__main__":
    main()