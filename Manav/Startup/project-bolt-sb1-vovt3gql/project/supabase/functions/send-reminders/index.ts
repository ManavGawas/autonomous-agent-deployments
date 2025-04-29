// This edge function sends reminders for invoices that are due or overdue
import { createClient } from "npm:@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  try {
    // Handle CORS preflight request
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }
    
    // Create a Supabase client with the service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing environment variables");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get today's date
    const today = new Date();
    
    // Find all reminders that need to be sent today
    // This includes reminders where:
    // 1. The invoice is sent or overdue (not draft or paid)
    // 2. The due date + days_after_due = today
    // 3. The reminder hasn't been sent yet (sent_at is null)
    
    // First, get all reminder schedules that haven't been sent
    const { data: reminderSchedules, error: reminderError } = await supabase
      .from('reminder_schedules')
      .select(`
        id,
        invoice_id,
        days_after_due,
        invoices!inner(
          id,
          user_id,
          client_name,
          client_email,
          amount,
          currency,
          due_date,
          status
        )
      `)
      .is('sent_at', null)
      .in('invoices.status', ['sent', 'overdue']);
    
    if (reminderError) {
      throw reminderError;
    }
    
    // Filter for reminders that need to be sent today
    const remindersToSend = reminderSchedules?.filter(reminder => {
      const dueDate = new Date(reminder.invoices.due_date);
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(dueDate.getDate() + reminder.days_after_due);
      
      // Format dates as strings for comparison
      const reminderDateStr = reminderDate.toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];
      
      return reminderDateStr === todayStr;
    });
    
    // Send reminders (in a real implementation, this would use SendGrid or another email service)
    const sentReminders = [];
    
    for (const reminder of remindersToSend || []) {
      // In a real implementation, we would send an email here
      // For now, we'll just update the sent_at timestamp
      
      const { data, error } = await supabase
        .from('reminder_schedules')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', reminder.id)
        .select()
        .single();
      
      if (error) {
        console.error(`Error updating reminder ${reminder.id}:`, error);
        continue;
      }
      
      sentReminders.push({
        reminder: data,
        invoice: reminder.invoices,
      });
    }
    
    // Return success response with updated reminders
    return new Response(
      JSON.stringify({
        success: true,
        sentCount: sentReminders.length,
        sent: sentReminders,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error sending reminders:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      }
    );
  }
});