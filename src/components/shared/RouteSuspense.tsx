import { Suspense, type ReactNode } from 'react';
import { LoadingState } from '../feedback/LoadingState';

export function RouteSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<LoadingState fullPage message="Loading…" />}>{children}</Suspense>;
}
