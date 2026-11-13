import { AlertCircle } from 'lucide-react';

interface Props { className?: string; }

export function MedicalDisclaimer({ className = '' }: Props) {
  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 ${className}`} role="note">
      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <p className="text-sm text-blue-800">
        Medicine information is provided for educational purposes only and is not a substitute for professional medical advice.
        Do not start, stop, change, or substitute a medicine without guidance from a qualified healthcare professional.
        <strong> For emergencies, call 112.</strong>
      </p>
    </div>
  );
}
