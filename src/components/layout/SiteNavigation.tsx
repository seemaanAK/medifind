import { NavLink } from 'react-router-dom';
import { Home, Pill, Info, HeartPulse, AlertTriangle, Calendar } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/medicines', label: 'Find Medicines', icon: Pill, end: false },
  { to: '/medicine-information', label: 'Medicine Info', icon: Info, end: false },
  { to: '/schedule', label: 'Schedule', icon: Calendar, end: false },
  { to: '/first-aid', label: 'First Aid', icon: HeartPulse, end: false },
  { to: '/emergency', label: 'Emergency', icon: AlertTriangle, end: false },
];

export default function SiteNavigation() {
  return (
    <nav className="bg-primary-700 text-white" aria-label="Site navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ul className="flex items-center gap-0.5 overflow-x-auto scrollbar-none" role="list">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors hover:bg-primary-600 ${
                    isActive ? 'border-white bg-primary-800' : 'border-transparent'
                  }`
                }
                aria-current={undefined}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
