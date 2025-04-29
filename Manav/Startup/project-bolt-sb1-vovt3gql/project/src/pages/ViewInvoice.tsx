import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Database } from '../types/supabase';
import { 
  ArrowLeft, 
  Send, 
  Printer, 
  Download, 
  Trash2, 
  Clock, 
  Mail, 
  FileText,
  CreditCard,
  CheckCircle2
} from 'lucide-react';
import { generateInvoicePDF } from '../utils/generatePDF';

type Invoice = Database['public']['Tables']['invoices']['Row'];
type ReminderSchedule = Database['public']['Tables']['reminder_schedules']['Row'];

const ViewInvoice = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [reminders, setReminders] = useState<ReminderSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [sending, setSending] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        if (!id) return;
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/login');
          return;
        }
        
        const { data: invoiceData, error: invoiceError } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', id)
          .single();
          
        if (invoiceError) throw invoiceError;
        
        // Check if the invoice belongs to the current user
        if (invoiceData.user_id !== user.id) {
          toast.error("You don't have permission to view this invoice");
          navigate('/invoices');
          return;
        }
        
        setInvoice(invoiceData);
        
        // Fetch reminders for this invoice
        const { data: reminderData, error: reminderError } = await supabase
          .from('reminder_schedules')
          .select('*')
          .eq('invoice_id', id);
          
        if (reminderError) throw reminderError;
        
        setReminders(reminderData);
      } catch (error) {
        console.error('Error fetching invoice:', error);
        toast.error('Error loading invoice');
        navigate('/invoices');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id, navigate]);

  const handleDeleteInvoice = async () => {
    if (!invoice) return;
    
    try {
      setDeleting(true);
      
      // Delete reminders first
      await supabase
        .from('reminder_schedules')
        .delete()
        .eq('invoice_id', invoice.id);
      
      // Then delete invoice
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoice.id);
        
      if (error) throw error;
      
      toast.success('Invoice deleted successfully');
      navigate('/invoices');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Error deleting invoice');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSendInvoice = async () => {
    if (!invoice) return;
    
    try {
      setSending(true);
      
      // Update invoice status to sent
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'sent' })
        .eq('id', invoice.id);
        
      if (error) throw error;
      
      // Here we'd normally generate the PDF and send the email
      // For now just simulate that it happened
      
      // Setup default reminders
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('reminder_days')
        .eq('user_id', invoice.user_id)
        .single();
      
      const reminderDays = settingsData?.reminder_days || [3, 7, 14];
      
      // Create reminder schedules
      for (const days of reminderDays) {
        await supabase
          .from('reminder_schedules')
          .insert({
            invoice_id: invoice.id,
            days_after_due: days,
          });
      }
      
      // Refresh invoice data
      const { data: updatedInvoice } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoice.id)
        .single();
        
      if (updatedInvoice) {
        setInvoice(updatedInvoice);
      }
      
      // Refresh reminders
      const { data: updatedReminders } = await supabase
        .from('reminder_schedules')
        .select('*')
        .eq('invoice_id', invoice.id);
        
      if (updatedReminders) {
        setReminders(updatedReminders);
      }
      
      toast.success('Invoice sent successfully');
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error('Error sending invoice');
    } finally {
      setSending(false);
    }
  };

  return null; // Component JSX will be implemented later
};

export default ViewInvoice;