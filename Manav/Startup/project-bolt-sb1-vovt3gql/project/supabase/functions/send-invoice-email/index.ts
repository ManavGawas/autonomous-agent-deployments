import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "supabase";
import { SmtpClient } from "https://deno.land/x/smtp/mod.ts";
import { encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

// Environment variables (to be set in Supabase function dashboard or .env)
const SMTP_HOST = Deno.env.get("SMTP_HOST")!;
const SMTP_PORT = Number(Deno.env.get("SMTP_PORT")!);
const SMTP_USER = Deno.env.get("SMTP_USER")!;
const SMTP_PASS = Deno.env.get("SMTP_PASS")!;
const SMTP_FROM = Deno.env.get("SMTP_FROM")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// Helper: Generate invoice PDF (simple HTML to PDF, can be improved)
async function generateInvoicePDF(invoice: any, userSettings: any) {
  // For MVP: Use a simple HTML string, convert to PDF using a service or library
  // Here, just return a base64-encoded text file for demo (replace with real PDF logic)
  const html = `Invoice for ${invoice.client_name}\nAmount: ${invoice.amount} ${invoice.currency}`;
  const pdfData = new TextEncoder().encode(html); // Replace with real PDF generation
  return {
    filename: `invoice-${invoice.id}.pdf`,
    content: encode(pdfData),
    contentType: "application/pdf",
  };
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    const { invoiceId, to, subject, message } = body;
    if (!invoiceId || !to) {
      return new Response(JSON.stringify({ error: "Missing invoiceId or to" }), { status: 400 });
    }

    // Fetch invoice and user settings from Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();
    if (invoiceError || !invoice) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), { status: 404 });
    }
    const { data: userSettings } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", invoice.user_id)
      .single();

    // Generate PDF attachment
    const pdf = await generateInvoicePDF(invoice, userSettings);

    // Optionally: use mailgen for future HTML email templates
    // import Mailgen from "mailgen";

    // Send email via SMTP
    const client = new SmtpClient();
    await client.connectTLS({
      hostname: SMTP_HOST,
      port: SMTP_PORT,
      username: SMTP_USER,
      password: SMTP_PASS,
    });
    await client.send({
      from: SMTP_FROM,
      to,
      subject: subject || `Invoice from ${userSettings?.company_name || "AutoInvoice"}`,
      content: message || `Dear ${invoice.client_name},\nPlease find your invoice attached.`,
      attachments: [
        {
          content: pdf.content,
          filename: pdf.filename,
          contentType: pdf.contentType,
          encoding: "base64",
        },
      ],
    });
    await client.close();

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("send-invoice-email error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
