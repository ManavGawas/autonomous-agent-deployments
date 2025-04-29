import { Outlet, Navigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { CalendarClock } from 'lucide-react';

interface AuthLayoutProps {
  session: Session | null;
}

const AuthLayout = ({ session }: AuthLayoutProps) => {
  // If user is logged in, redirect to dashboard
  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col md:flex-row">
      {/* Left side - Branding */}
      <div className="bg-blue-600 md:w-1/2 p-8 flex flex-col justify-center items-center text-white">
        <div className="max-w-md mx-auto text-center">
          <div className="p-3 bg-white/10 inline-block rounded-2xl mb-6">
            <CalendarClock size={48} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">AutoInvoice-Remind</h1>
          <p className="text-xl mb-8">
            Create, send, and track invoices with automated payment reminders. 
            Never chase payments again.
          </p>
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="bg-white/10 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Create Beautiful Invoices</h3>
              <p className="text-sm opacity-80">Professional invoice templates customized to your brand</p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Automatic Reminders</h3>
              <p className="text-sm opacity-80">Schedule payment reminders to reduce late payments</p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Get Paid Faster</h3>
              <p className="text-sm opacity-80">Accept payments online directly through your invoices</p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Track Everything</h3>
              <p className="text-sm opacity-80">Real-time analytics on payment status and overdue amounts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="md:w-1/2 p-8 flex items-center justify-center">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;