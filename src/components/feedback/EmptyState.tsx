import { PackageOpen } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({
  icon = <PackageOpen className="w-10 h-10 text-gray-400" aria-hidden="true" />,
  title = 'Nothing here yet',
  description,
  action,
}: Props) {
  return (
    <div className="py-12 flex flex-col items-center gap-4 text-center">
      {icon}
      <div>
        <p className="font-medium text-gray-700">{title}</p>
        {description && <p className="text-sm text-gray-500 mt-1 max-w-sm">{description}</p>}
      </div>
      {action}
    </div>
  );
}
