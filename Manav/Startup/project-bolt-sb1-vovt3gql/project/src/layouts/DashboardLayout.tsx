import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  CalendarClock, 
  Home, 
  FileText, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Zap
} from 'lucide-react';

interface DashboardLayoutProps {
  session: Session | null;
}

const DashboardLayout = ({ session }: DashboardLayoutProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // If no user is logged in, redirect to login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Invoices', href: '/invoices', icon: FileText },
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Integrations', href: '/integrations', icon: Zap },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu */}
      <div className="lg:hidden">
        <div className="fixed top-0 left-0 right-0 z-40 bg-white flex items-center justify-between p-4 border-b">
          <div className="flex items-center">
            <CalendarClock className="h-8 w-8 text-blue-600" />
            <span className="ml-2 font-semibold text-xl">AutoInvoice</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-30 pt-16 bg-white">
            <nav className="px-4 py-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-base font-medium rounded-md mb-1 ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="mr-4 h-6 w-6 flex-shrink-0" />
                  {item.name}
                </Link>
              ))}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center px-4 py-3 text-base font-medium text-gray-600 hover:bg-gray-50 rounded-md mt-4"
              >
                <LogOut className="mr-4 h-6 w-6 flex-shrink-0" />
                Sign out
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex-1 flex flex-col min-h-0 bg-blue-600">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-6 mb-6">
              <CalendarClock className="h-8 w-8 text-white" />
              <span className="ml-2 font-semibold text-xl text-white">AutoInvoice</span>
            </div>
            <nav className="mt-5 flex-1 px-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    isActive(item.href)
                      ? 'bg-blue-700 text-white'
                      : 'text-blue-100 hover:bg-blue-500'
                  }`}
                >
                  <item.icon className="mr-3 h-6 w-6 flex-shrink-0" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="p-4 border-t border-blue-700">
            <div className="flex items-center">
              <div className="bg-blue-700 rounded-full h-10 w-10 flex items-center justify-center text-white">
                {session?.user?.email?.[0].toUpperCase() || 'U'}
              </div>
              <div className="ml-3 truncate">
                <p className="text-sm font-medium text-white">{session?.user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="mt-3 w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-blue-100 hover:bg-blue-500"
            >
              <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="lg:pl-64 flex flex-col">
        <main className="flex-1">
          <div className="pt-16 lg:pt-8 pb-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;