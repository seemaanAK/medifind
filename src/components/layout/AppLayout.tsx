import { Outlet } from 'react-router-dom';
import SiteHeader from './SiteHeader';
import SiteNavigation from './SiteNavigation';
import Footer from './Footer';

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader />
      <SiteNavigation />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
