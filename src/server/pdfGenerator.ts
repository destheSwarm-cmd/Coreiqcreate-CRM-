import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Invoice, Quote, Client, QuoteLine, BusinessSettings } from '../types/crm';

export async function generateInvoicePdf(
  invoice: Invoice,
  business: Partial<BusinessSettings> = {}
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Palette
  const darkNavy = rgb(0.016, 0.035, 0.102); // #04091A
  const textDark = rgb(0.06, 0.09, 0.16); // #0F172A
  const textMuted = rgb(0.39, 0.45, 0.55); // #64748B
  const cyanAccent = rgb(0.0, 0.55, 0.65);
  const borderLight = rgb(0.85, 0.88, 0.92);
  const tableHeaderBg = rgb(0.95, 0.97, 0.99);

  let y = height - 50;

  // Header: Business Profile
  const tradingName = business.trading_name || invoice.from_business_snapshot?.trading_name || 'CoreIQ Create';
  const tagline = business.tagline || invoice.from_business_snapshot?.tagline || 'Ideas | Intelligence | Action';
  const email = business.email || invoice.from_business_snapshot?.email || 'operator@coreiq.com';
  const website = business.website || invoice.from_business_snapshot?.website || 'https://coreiq.com';
  const address = business.address || invoice.from_business_snapshot?.address || 'Johannesburg, South Africa';

  page.drawText(tradingName, { x: 50, y, size: 20, font: fontBold, color: darkNavy });
  y -= 15;
  page.drawText(tagline, { x: 50, y, size: 9, font: fontOblique, color: textMuted });
  y -= 14;
  page.drawText(`${email}  ·  ${website}`, { x: 50, y, size: 9, font: fontRegular, color: textMuted });
  y -= 13;
  page.drawText(address, { x: 50, y, size: 9, font: fontRegular, color: textMuted });

  // Document Title & Number (Right aligned)
  const isHistorical = invoice.is_historical;
  page.drawText(isHistorical ? 'HISTORICAL INVOICE' : 'TAX INVOICE', {
    x: 370,
    y: height - 50,
    size: 16,
    font: fontBold,
    color: darkNavy,
  });
  page.drawText(`Invoice #: ${invoice.invoice_number}`, {
    x: 370,
    y: height - 68,
    size: 11,
    font: fontBold,
    color: cyanAccent,
  });
  page.drawText(`Issue Date: ${invoice.issue_date || new Date().toISOString().split('T')[0]}`, {
    x: 370,
    y: height - 83,
    size: 9,
    font: fontRegular,
    color: textDark,
  });
  page.drawText(`Due Date: ${invoice.due_date}`, {
    x: 370,
    y: height - 97,
    size: 9,
    font: fontBold,
    color: textDark,
  });
  page.drawText(`Status: ${(invoice.status || 'draft').toUpperCase()}`, {
    x: 370,
    y: height - 111,
    size: 9,
    font: fontBold,
    color: invoice.status === 'paid' ? rgb(0.06, 0.6, 0.3) : textDark,
  });

  y = height - 135;
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1, color: borderLight });

  // Bill To block
  y -= 20;
  page.drawText('BILL TO:', { x: 50, y, size: 9, font: fontBold, color: textMuted });
  y -= 14;
  const billTo = invoice.bill_to_snapshot || { name: 'Client' };
  page.drawText(billTo.name || 'Valued Client', { x: 50, y, size: 11, font: fontBold, color: textDark });
  if (billTo.attention) {
    y -= 13;
    page.drawText(`Attn: ${billTo.attention}`, { x: 50, y, size: 9, font: fontRegular, color: textDark });
  }
  if (billTo.email) {
    y -= 13;
    page.drawText(`Email: ${billTo.email}`, { x: 50, y, size: 9, font: fontRegular, color: textDark });
  }
  if (billTo.address) {
    y -= 13;
    page.drawText(billTo.address, { x: 50, y, size: 9, font: fontRegular, color: textDark });
  }
  if (billTo.vat_number) {
    y -= 13;
    page.drawText(`Client VAT: ${billTo.vat_number}`, { x: 50, y, size: 9, font: fontRegular, color: textDark });
  }

  // Items Table Header
  y -= 25;
  page.drawRectangle({ x: 50, y: y - 5, width: 495, height: 20, color: tableHeaderBg });
  page.drawText('Description', { x: 56, y, size: 9, font: fontBold, color: textDark });
  page.drawText('Qty', { x: 330, y, size: 9, font: fontBold, color: textDark });
  page.drawText('Rate (R)', { x: 380, y, size: 9, font: fontBold, color: textDark });
  page.drawText('Total (R)', { x: 470, y, size: 9, font: fontBold, color: textDark });

  y -= 18;
  const items = invoice.items && invoice.items.length > 0
    ? invoice.items
    : [
        {
          id: '1',
          invoice_id: invoice.id,
          description: invoice.notes || 'Professional Services',
          qty: 1,
          unit_price: invoice.subtotal || invoice.total,
          discount_pct: 0,
          amount: invoice.subtotal || invoice.total,
          sort_order: 0,
        },
      ];

  for (const it of items) {
    page.drawText(it.description.substring(0, 48), { x: 56, y, size: 9, font: fontRegular, color: textDark });
    page.drawText(String(it.qty), { x: 335, y, size: 9, font: fontRegular, color: textDark });
    page.drawText(Number(it.unit_price).toFixed(2), { x: 380, y, size: 9, font: fontRegular, color: textDark });
    page.drawText(Number(it.amount).toFixed(2), { x: 470, y, size: 9, font: fontBold, color: textDark });

    if (it.sub_description) {
      y -= 12;
      page.drawText(it.sub_description.substring(0, 55), { x: 62, y, size: 8, font: fontOblique, color: textMuted });
    }

    y -= 16;
    page.drawLine({ start: { x: 50, y: y + 8 }, end: { x: 545, y: y + 8 }, thickness: 0.5, color: borderLight });
  }

  // Totals Area (Right aligned)
  y -= 10;
  const subtotal = Number(invoice.subtotal || 0).toFixed(2);
  const vatAmount = Number(invoice.vat_amount || 0).toFixed(2);
  const total = Number(invoice.total || 0).toFixed(2);
  const amountPaid = Number(invoice.amount_paid || 0).toFixed(2);
  const amountDue = Number(invoice.amount_due ?? invoice.total ?? 0).toFixed(2);

  page.drawText('Subtotal:', { x: 370, y, size: 9, font: fontRegular, color: textMuted });
  page.drawText(`R ${subtotal}`, { x: 470, y, size: 9, font: fontRegular, color: textDark });
  y -= 14;

  if (Number(vatAmount) > 0 || business.vat_enabled) {
    page.drawText(`VAT (15%):`, { x: 370, y, size: 9, font: fontRegular, color: textMuted });
    page.drawText(`R ${vatAmount}`, { x: 470, y, size: 9, font: fontRegular, color: textDark });
    y -= 14;
  }

  page.drawLine({ start: { x: 360, y: y + 8 }, end: { x: 545, y: y + 8 }, thickness: 1, color: borderLight });
  page.drawText('TOTAL DUE:', { x: 370, y, size: 11, font: fontBold, color: darkNavy });
  page.drawText(`R ${amountDue}`, { x: 470, y, size: 11, font: fontBold, color: cyanAccent });
  y -= 14;

  if (Number(amountPaid) > 0) {
    page.drawText('Amount Paid:', { x: 370, y, size: 9, font: fontRegular, color: rgb(0.06, 0.6, 0.3) });
    page.drawText(`- R ${amountPaid}`, { x: 470, y, size: 9, font: fontRegular, color: rgb(0.06, 0.6, 0.3) });
    y -= 14;
  }

  // Payment Details Section
  y = Math.min(y - 15, 230);
  page.drawRectangle({ x: 50, y: y - 5, width: 495, height: 16, color: tableHeaderBg });
  page.drawText('PAYMENT DETAILS', { x: 56, y, size: 9, font: fontBold, color: darkNavy });
  y -= 16;

  const paymentMethods = invoice.selected_payment_methods && invoice.selected_payment_methods.length > 0
    ? invoice.selected_payment_methods
    : (business.payment_methods || []);

  const enabledMethods = paymentMethods.filter((m) => m.enabled !== false);
  if (enabledMethods.length === 0) {
    page.drawText('Please remit payment via Electronic Funds Transfer (EFT). Contact operator@coreiq.com for details.', {
      x: 56,
      y,
      size: 8,
      font: fontRegular,
      color: textDark,
    });
    y -= 14;
  } else {
    for (const method of enabledMethods) {
      page.drawText(`${method.label}:`, { x: 56, y, size: 8, font: fontBold, color: textDark });
      y -= 11;
      if (method.rows && method.rows.length > 0) {
        for (const row of method.rows) {
          if (row.value) {
            page.drawText(`${row.label}: ${row.value}`, { x: 68, y, size: 8, font: fontRegular, color: textDark });
            y -= 10;
          }
        }
      }
      if (method.instructions) {
        page.drawText(`Reference: ${invoice.invoice_number} · ${method.instructions}`, {
          x: 68,
          y,
          size: 8,
          font: fontOblique,
          color: cyanAccent,
        });
        y -= 11;
      }
      y -= 4;
    }
  }

  // Terms & Conditions block
  y = Math.min(y - 8, 80);
  page.drawText('TERMS & CONDITIONS', { x: 56, y, size: 8, font: fontBold, color: textMuted });
  y -= 11;
  const terms = invoice.terms_snapshot || business.terms_blocks || {};
  const termsText = [
    terms.payment_terms || 'Payment is due within 7 days of invoice date.',
    terms.late_payment || 'Overdue invoices incur 2% per month penalty interest.',
    terms.general || 'Standard South African commercial law applies.',
  ].join(' ');

  page.drawText(termsText.substring(0, 160), {
    x: 56,
    y,
    size: 7.5,
    font: fontRegular,
    color: textMuted,
  });

  return await pdfDoc.save();
}

export async function generateQuotePdf(
  quote: Quote,
  client: Partial<Client>,
  lines: QuoteLine[] = [],
  business: Partial<BusinessSettings> = {}
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const darkNavy = rgb(0.016, 0.035, 0.102);
  const textDark = rgb(0.06, 0.09, 0.16);
  const textMuted = rgb(0.39, 0.45, 0.55);
  const cyanAccent = rgb(0.0, 0.55, 0.65);
  const borderLight = rgb(0.85, 0.88, 0.92);
  const tableHeaderBg = rgb(0.95, 0.97, 0.99);

  let y = height - 50;

  const tradingName = business.trading_name || 'CoreIQ Create';
  const tagline = business.tagline || 'Ideas | Intelligence | Action';
  const email = business.email || 'operator@coreiq.com';
  const website = business.website || 'https://coreiq.com';

  page.drawText(tradingName, { x: 50, y, size: 20, font: fontBold, color: darkNavy });
  y -= 15;
  page.drawText(tagline, { x: 50, y, size: 9, font: fontOblique, color: textMuted });
  y -= 14;
  page.drawText(`${email}  ·  ${website}`, { x: 50, y, size: 9, font: fontRegular, color: textMuted });

  // Quote Metadata
  page.drawText('COMMERCIAL QUOTE', { x: 370, y: height - 50, size: 16, font: fontBold, color: darkNavy });
  page.drawText(`Quote #: ${quote.quote_code}`, { x: 370, y: height - 68, size: 11, font: fontBold, color: cyanAccent });
  page.drawText(`Date: ${quote.created_at?.split('T')[0] || new Date().toISOString().split('T')[0]}`, {
    x: 370,
    y: height - 83,
    size: 9,
    font: fontRegular,
    color: textDark,
  });
  page.drawText(`Valid Until: ${quote.valid_until || '14 Days from issue'}`, {
    x: 370,
    y: height - 97,
    size: 9,
    font: fontBold,
    color: textDark,
  });
  page.drawText(`Status: ${(quote.status || 'draft').toUpperCase()}`, {
    x: 370,
    y: height - 111,
    size: 9,
    font: fontBold,
    color: quote.status === 'accepted' ? rgb(0.06, 0.6, 0.3) : textDark,
  });

  y = height - 135;
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1, color: borderLight });

  y -= 20;
  page.drawText('PROPOSED TO:', { x: 50, y, size: 9, font: fontBold, color: textMuted });
  y -= 14;
  page.drawText(client.name || 'Valued Client', { x: 50, y, size: 11, font: fontBold, color: textDark });
  if (client.website) {
    y -= 13;
    page.drawText(`Website: ${client.website}`, { x: 50, y, size: 9, font: fontRegular, color: textDark });
  }

  // Lines Table
  y -= 25;
  page.drawRectangle({ x: 50, y: y - 5, width: 495, height: 20, color: tableHeaderBg });
  page.drawText('Scope & Deliverables', { x: 56, y, size: 9, font: fontBold, color: textDark });
  page.drawText('Qty', { x: 330, y, size: 9, font: fontBold, color: textDark });
  page.drawText('Unit (R)', { x: 380, y, size: 9, font: fontBold, color: textDark });
  page.drawText('Line Total (R)', { x: 470, y, size: 9, font: fontBold, color: textDark });

  y -= 18;
  for (const l of lines) {
    page.drawText((l.description || 'Deliverable item').substring(0, 48), { x: 56, y, size: 9, font: fontRegular, color: textDark });
    page.drawText(String(l.qty || 1), { x: 335, y, size: 9, font: fontRegular, color: textDark });
    page.drawText(Number(l.unit_price || 0).toFixed(2), { x: 380, y, size: 9, font: fontRegular, color: textDark });
    page.drawText(Number(l.line_total || 0).toFixed(2), { x: 470, y, size: 9, font: fontBold, color: textDark });
    y -= 16;
    page.drawLine({ start: { x: 50, y: y + 8 }, end: { x: 545, y: y + 8 }, thickness: 0.5, color: borderLight });
  }

  // Totals
  y -= 10;
  page.drawText('ESTIMATED TOTAL:', { x: 350, y, size: 11, font: fontBold, color: darkNavy });
  page.drawText(`R ${Number(quote.total || 0).toFixed(2)}`, { x: 470, y, size: 11, font: fontBold, color: cyanAccent });

  // Deposit note
  y -= 30;
  page.drawRectangle({ x: 50, y: y - 5, width: 495, height: 40, color: tableHeaderBg });
  page.drawText('Commercial Terms & Acceptance:', { x: 56, y: y + 16, size: 9, font: fontBold, color: darkNavy });
  page.drawText('50% deposit required upon confirmation. Work initiates immediately following deposit payment.', {
    x: 56,
    y: y + 4,
    size: 8,
    font: fontRegular,
    color: textDark,
  });
  page.drawText('To accept: sign online via the link or reply in writing with "Confirmed" to operator@coreiq.com', {
    x: 56,
    y: y - 8,
    size: 8,
    font: fontOblique,
    color: textMuted,
  });

  return await pdfDoc.save();
}
