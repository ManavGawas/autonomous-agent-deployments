import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Database } from '../types/supabase';

type Invoice = Database['public']['Tables']['invoices']['Row'];
type UserSettings = Database['public']['Tables']['user_settings']['Row'];

export const generateInvoicePDF = (invoice: Invoice, settings?: UserSettings | null): string => {
  const doc = new jsPDF();
  
  // Add company info
  const companyName = settings?.company_name || 'Your Company';
  const companyAddress = settings?.company_address || 'Your Address';
  
  // Set font styles
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('INVOICE', 20, 20);
  
  doc.setFontSize(10);
  doc.text(`#${invoice.id.substring(0, 8).toUpperCase()}`, 20, 30);
  
  // Company details (right-aligned)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  const rightMargin = 190;
  doc.text(companyName, rightMargin, 20, { align: 'right' });
  doc.setFontSize(10);
  doc.text(companyAddress, rightMargin, 30, { align: 'right' });
  
  // Client details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Bill To:', 20, 50);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(invoice.client_name, 20, 60);
  doc.text(invoice.client_email, 20, 70);
  
  // Invoice details
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Details:', rightMargin, 50, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Issue Date: ${new Date(invoice.issue_date).toLocaleDateString()}`, rightMargin, 60, { align: 'right' });
  doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, rightMargin, 70, { align: 'right' });
  
  // Description and amount
  (doc as any).autoTable({
    startY: 90,
    head: [['Description', 'Amount']],
    body: [[
      invoice.description,
      new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: invoice.currency 
      }).format(invoice.amount)
    ]],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [66, 139, 202] },
  });
  
  // Total amount
  const finalY = (doc as any).lastAutoTable.finalY || 120;
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', 140, finalY + 20);
  doc.text(
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: invoice.currency 
    }).format(invoice.amount),
    rightMargin,
    finalY + 20,
    { align: 'right' }
  );
  
  // Payment status
  if (invoice.status === 'paid') {
    doc.setTextColor(46, 125, 50); // Green color
    doc.setFontSize(24);
    doc.text('PAID', 105, 140, { align: 'center' });
    doc.setTextColor(0, 0, 0); // Reset to black
  }
  
  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Thank you for your business!', 105, 180, { align: 'center' });
  
  return doc.output('dataurlstring');
};