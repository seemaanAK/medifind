import { Link } from 'react-router-dom';
import { Cross } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-primary-700 font-semibold">
            <Cross className="w-5 h-5" aria-hidden="true" />
            <span>MediFind</span>
          </div>
          <p className="text-xs text-gray-500 text-center max-w-md">
            For educational purposes only. Not a substitute for professional medical advice.{' '}
            In an emergency, call <strong>112</strong> — India's nationwide emergency number.
          </p>
          <nav aria-label="Footer links" className="flex gap-4 text-xs text-gray-500">
            <Link to="/emergency" className="hover:text-emergency-600 transition-colors">Emergency</Link>
            <Link to="/first-aid" className="hover:text-primary-600 transition-colors">First Aid</Link>
            <Link to="/medicine-information" className="hover:text-primary-600 transition-colors">Medicine Info</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
