import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { PlusCircle, ArrowUpRight, Clock, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { Database } from '../types/supabase';

type Invoice = Database['public']['Tables']['invoices']['Row'];

const Dashboard = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPaid: 0,
    totalOverdue: 0,
    totalDrafts: 0,
    totalSent: 0,
  });

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;
        
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('user_id', user.id)
          .order('due_date', { ascending: false });
          
        if (error) throw error;
        
        setInvoices(data || []);
        
        // Calculate stats
        const paid = data?.filter(inv => inv.status === 'paid') || [];
        const overdue = data?.filter(inv => inv.status === 'overdue') || [];
        const drafts = data?.filter(inv => inv.status === 'draft') || [];
        const sent = data?.filter(inv => inv.status === 'sent') || [];
        
        setStats({
          totalPaid: paid.reduce((sum, inv) => sum + inv.amount, 0),
          totalOverdue: overdue.reduce((sum, inv) => sum + inv.amount, 0),
          totalDrafts: drafts.length,
          totalSent: sent.length,
        });
      } catch (error) {
        console.error('Error fetching invoices:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  // Get upcoming invoices due in 7 days
  const upcomingDue = invoices.filter(inv => {
    if (inv.status !== 'sent') return false;
    const dueDate = new Date(inv.due_date);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  });

  // Get recently created invoices
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Format currency
  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency 
    }).format(amount);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link
          to="/invoices/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          New Invoice
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white shadow rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Paid</p>
              <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalPaid)}</h3>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Overdue Amount</p>
              <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalOverdue)}</h3>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Draft Invoices</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.totalDrafts}</h3>
            </div>
            <div className="p-3 bg-gray-100 rounded-full">
              <FileText className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Sent Invoices</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.totalSent}</h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <ArrowUpRight className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Due Soon */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Invoices Due Soon</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {upcomingDue.length > 0 ? (
              upcomingDue.map((invoice) => (
                <Link
                  key={invoice.id}
                  to={`/invoices/${invoice.id}`}
                  className="block hover:bg-gray-50 transition duration-150"
                >
                  <div className="px-5 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600 truncate">
                          {invoice.client_name}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatCurrency(invoice.amount, invoice.currency)}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 text-amber-500 mr-1" />
                        <span className="text-sm text-gray-500">
                          Due {new Date(invoice.due_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-gray-500">
                No invoices due soon
              </div>
            )}
          </div>
          {upcomingDue.length > 0 && (
            <div className="bg-gray-50 px-5 py-3 text-right">
              <Link
                to="/invoices"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                View all
              </Link>
            </div>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Invoices</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {recentInvoices.length > 0 ? (
              recentInvoices.map((invoice) => (
                <Link
                  key={invoice.id}
                  to={`/invoices/${invoice.id}`}
                  className="block hover:bg-gray-50 transition duration-150"
                >
                  <div className="px-5 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600 truncate">
                          {invoice.client_name}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatCurrency(invoice.amount, invoice.currency)}
                        </p>
                      </div>
                      <div>
                        <span className={`px-2 py-1 text-xs rounded-full uppercase font-medium ${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                          invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                          invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {invoice.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-gray-500">
                No invoices created yet
              </div>
            )}
          </div>
          {recentInvoices.length > 0 && (
            <div className="bg-gray-50 px-5 py-3 text-right">
              <Link
                to="/invoices"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                View all
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;