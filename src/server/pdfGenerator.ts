import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Invoice, Quote, Client, QuoteLine, BusinessSettings } from '../types/crm';

function formatDocumentDate(isoStr?: string): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  const day = d.getDate();
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatCurrency(amount: number): string {
  return `R ${Number(amount || 0).toFixed(2)}`;
}

export async function generateInvoicePdf(
  invoice: Invoice,
  business: Partial<BusinessSettings> = {}
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Exact CIQ-0001 Color Palette
  const navyBannerBg = rgb(0.118, 0.161, 0.365); // #1e295d
  const textDark = rgb(0.06, 0.09, 0.16); // #0f172a
  const textMuted = rgb(0.45, 0.52, 0.62); // #718096
  const borderLight = rgb(0.88, 0.91, 0.94); // #e2e8f0
  const metaBoxBg = rgb(0.95, 0.965, 0.98); // #f1f5f9
  const white = rgb(1, 1, 1);

  // 1. Top Navy Banner (Full Width)
  const bannerHeight = 85;
  page.drawRectangle({
    x: 0,
    y: height - bannerHeight,
    width,
    height: bannerHeight,
    color: navyBannerBg,
  });

  // Top Banner Left: Brand & Tagline
  const tradingName = business.trading_name || invoice.from_business_snapshot?.trading_name || 'CoreIQ Create';
  const tagline = business.tagline || invoice.from_business_snapshot?.tagline || 'Ideas | Intelligence | Action';
  page.drawText(tradingName, {
    x: 50,
    y: height - 42,
    size: 24,
    font: fontBold,
    color: white,
  });
  page.drawText(tagline, {
    x: 50,
    y: height - 58,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.82, 0.88, 0.98),
  });

  // Top Banner Right: Big INVOICE Title
  const docTitle = invoice.is_historical ? 'HISTORICAL INVOICE' : 'INVOICE';
  const docTitleWidth = fontBold.widthOfTextAtSize(docTitle, 24);
  page.drawText(docTitle, {
    x: 545 - docTitleWidth,
    y: height - 46,
    size: 24,
    font: fontBold,
    color: white,
  });

  // 2. FROM and BILL TO Columns
  let y = height - 115;
  const fromEmail = business.email || invoice.from_business_snapshot?.email || 'coreiqcreate@gmail.com';
  const fromWebsite = business.website || invoice.from_business_snapshot?.website || 'coreiqcreate-ten.vercel.app';
  const billTo = invoice.bill_to_snapshot || { name: 'Client' };

  // FROM Column (Left)
  page.drawText('FROM', { x: 50, y, size: 8.5, font: fontBold, color: textMuted });
  page.drawText(tradingName, { x: 50, y: y - 14, size: 10.5, font: fontBold, color: textDark });
  page.drawText(fromEmail, { x: 50, y: y - 27, size: 9, font: fontRegular, color: textDark });
  page.drawText(fromWebsite.replace(/^https?:\/\//, ''), { x: 50, y: y - 39, size: 9, font: fontRegular, color: textDark });

  // BILL TO Column (Right)
  const billToX = 300;
  page.drawText('BILL TO', { x: billToX, y, size: 8.5, font: fontBold, color: textMuted });
  page.drawText(billTo.name || 'Client', { x: billToX, y: y - 14, size: 10.5, font: fontBold, color: textDark });
  let billToY = y - 27;
  if (billTo.attention) {
    page.drawText(`Attention: ${billTo.attention}`, { x: billToX, y: billToY, size: 9, font: fontRegular, color: textDark });
    billToY -= 12;
  }
  if (billTo.address) {
    page.drawText(billTo.address, { x: billToX, y: billToY, size: 9, font: fontRegular, color: textDark });
    billToY -= 12;
  }
  if (billTo.registration_number) {
    page.drawText(`Reg no: ${billTo.registration_number}`, { x: billToX, y: billToY, size: 9, font: fontRegular, color: textDark });
  }

  // 3. Meta Block (INVOICE NO, INVOICE DATE, DUE DATE)
  y = height - 198;
  const metaHeight = 44;
  page.drawRectangle({
    x: 50,
    y: y - metaHeight + 10,
    width: 495,
    height: metaHeight,
    color: metaBoxBg,
  });

  // Meta Item 1: Invoice No
  page.drawText('INVOICE NO', { x: 68, y: y - 8, size: 8, font: fontBold, color: textMuted });
  page.drawText(invoice.invoice_number || 'CIQ-0001', { x: 68, y: y - 24, size: 10.5, font: fontBold, color: textDark });

  // Meta Item 2: Invoice Date
  const issueDateFormatted = formatDocumentDate(invoice.issue_date || new Date().toISOString());
  page.drawText('INVOICE DATE', { x: 230, y: y - 8, size: 8, font: fontBold, color: textMuted });
  page.drawText(issueDateFormatted, { x: 230, y: y - 24, size: 10.5, font: fontBold, color: textDark });

  // Meta Item 3: Due Date
  const dueDateFormatted = formatDocumentDate(invoice.due_date || new Date().toISOString());
  page.drawText('DUE DATE', { x: 390, y: y - 8, size: 8, font: fontBold, color: textMuted });
  page.drawText(dueDateFormatted, { x: 390, y: y - 24, size: 10.5, font: fontBold, color: textDark });

  // 4. Items Table
  y = y - metaHeight - 20;
  const tableHeaderHeight = 24;
  page.drawRectangle({
    x: 50,
    y: y - tableHeaderHeight + 8,
    width: 495,
    height: tableHeaderHeight,
    color: navyBannerBg,
  });

  page.drawText('DESCRIPTION', { x: 60, y: y - 8, size: 8.5, font: fontBold, color: white });
  page.drawText('QTY', { x: 345, y: y - 8, size: 8.5, font: fontBold, color: white });
  page.drawText('UNIT PRICE', { x: 410, y: y - 8, size: 8.5, font: fontBold, color: white });
  page.drawText('AMOUNT', { x: 490, y: y - 8, size: 8.5, font: fontBold, color: white });

  y -= tableHeaderHeight + 12;

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
    page.drawText(it.description.substring(0, 48), { x: 60, y, size: 9.5, font: fontRegular, color: textDark });
    page.drawText(String(it.qty), { x: 352, y, size: 9.5, font: fontRegular, color: textDark });
    const unitPriceStr = formatCurrency(it.unit_price);
    page.drawText(unitPriceStr, { x: 405, y, size: 9.5, font: fontRegular, color: textDark });
    const amountStr = formatCurrency(it.amount);
    page.drawText(amountStr, { x: 485, y, size: 9.5, font: fontRegular, color: textDark });

    if (it.sub_description) {
      y -= 13;
      page.drawText(it.sub_description.substring(0, 60), { x: 60, y, size: 8.5, font: fontRegular, color: textMuted });
    }

    y -= 18;
    page.drawLine({ start: { x: 50, y: y + 8 }, end: { x: 545, y: y + 8 }, thickness: 0.5, color: borderLight });
  }

  // 5. TOTAL DUE Bar
  y -= 8;
  const totalBoxWidth = 205;
  const totalBoxHeight = 28;
  page.drawRectangle({
    x: 545 - totalBoxWidth,
    y: y - totalBoxHeight + 8,
    width: totalBoxWidth,
    height: totalBoxHeight,
    color: navyBannerBg,
  });

  const totalAmountDue = invoice.amount_due !== undefined ? invoice.amount_due : invoice.total;
  page.drawText('TOTAL DUE', { x: 355, y: y - 10, size: 10, font: fontBold, color: white });
  const totalDueStr = formatCurrency(totalAmountDue);
  const totalDueWidth = fontBold.widthOfTextAtSize(totalDueStr, 10);
  page.drawText(totalDueStr, { x: 535 - totalDueWidth, y: y - 10, size: 10, font: fontBold, color: white });

  // 6. PAYMENT DETAILS Section
  y -= 45;
  page.drawText('PAYMENT DETAILS', { x: 50, y, size: 9.5, font: fontBold, color: textDark });
  page.drawLine({ start: { x: 50, y: y - 4 }, end: { x: 155, y: y - 4 }, thickness: 1.5, color: navyBannerBg });

  y -= 18;
  const paymentMethods = invoice.selected_payment_methods && invoice.selected_payment_methods.length > 0
    ? invoice.selected_payment_methods
    : (business.payment_methods || []);

  const enabledMethod = paymentMethods.find((m) => m.enabled !== false) || paymentMethods[0];

  const defaultEftRows = [
    { label: 'Bank', value: 'Capitec' },
    { label: 'Account holder', value: 'Mr MD Mashele' },
    { label: 'Account type', value: 'Savings' },
    { label: 'Account number', value: '1204104725' },
    { label: 'Branch code', value: '470010' },
  ];

  const rowsToPrint = (enabledMethod?.rows && enabledMethod.rows.some((r) => r.value))
    ? enabledMethod.rows.filter((r) => r.value)
    : defaultEftRows;

  for (const row of rowsToPrint) {
    page.drawText(row.label, { x: 50, y, size: 9, font: fontRegular, color: textMuted });
    page.drawText(row.value, { x: 170, y, size: 9, font: fontBold, color: textDark });
    y -= 14;
  }

  // Payment Reference row
  page.drawText('Payment reference', { x: 50, y, size: 9, font: fontRegular, color: textMuted });
  page.drawText(invoice.invoice_number, { x: 170, y, size: 9, font: fontBold, color: textDark });
  y -= 25;

  // 7. Instructions & Thank You
  page.drawText(`Please use the payment reference above and send proof of payment to ${fromEmail}.`, {
    x: 50,
    y,
    size: 8.5,
    font: fontRegular,
    color: textDark,
  });
  y -= 13;
  page.drawText('Thank you for your business.', {
    x: 50,
    y,
    size: 8.5,
    font: fontRegular,
    color: textDark,
  });

  // 8. Footer Centered
  page.drawLine({ start: { x: 50, y: 35 }, end: { x: 545, y: 35 }, thickness: 0.5, color: borderLight });
  const footerText = `${tradingName} | ${fromEmail} | ${fromWebsite.replace(/^https?:\/\//, '')}`;
  const footerWidth = fontRegular.widthOfTextAtSize(footerText, 8);
  page.drawText(footerText, {
    x: (width - footerWidth) / 2,
    y: 22,
    size: 8,
    font: fontRegular,
    color: textMuted,
  });

  return pdfDoc.save();
}

export async function generateQuotePdf(
  quote: Quote,
  client: Partial<Client>,
  lines: QuoteLine[],
  business: Partial<BusinessSettings> = {}
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const navyBannerBg = rgb(0.118, 0.161, 0.365);
  const textDark = rgb(0.06, 0.09, 0.16);
  const textMuted = rgb(0.45, 0.52, 0.62);
  const borderLight = rgb(0.88, 0.91, 0.94);
  const metaBoxBg = rgb(0.95, 0.965, 0.98);
  const white = rgb(1, 1, 1);

  // 1. Top Navy Banner
  const bannerHeight = 85;
  page.drawRectangle({
    x: 0,
    y: height - bannerHeight,
    width,
    height: bannerHeight,
    color: navyBannerBg,
  });

  const tradingName = business.trading_name || 'CoreIQ Create';
  const tagline = business.tagline || 'Ideas | Intelligence | Action';
  page.drawText(tradingName, {
    x: 50,
    y: height - 42,
    size: 24,
    font: fontBold,
    color: white,
  });
  page.drawText(tagline, {
    x: 50,
    y: height - 58,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.82, 0.88, 0.98),
  });

  const docTitle = 'QUOTE';
  const docTitleWidth = fontBold.widthOfTextAtSize(docTitle, 24);
  page.drawText(docTitle, {
    x: 545 - docTitleWidth,
    y: height - 46,
    size: 24,
    font: fontBold,
    color: white,
  });

  // 2. FROM and PROPOSED TO Columns
  let y = height - 115;
  const fromEmail = business.email || 'coreiqcreate@gmail.com';
  const fromWebsite = business.website || 'coreiqcreate-ten.vercel.app';

  page.drawText('FROM', { x: 50, y, size: 8.5, font: fontBold, color: textMuted });
  page.drawText(tradingName, { x: 50, y: y - 14, size: 10.5, font: fontBold, color: textDark });
  page.drawText(fromEmail, { x: 50, y: y - 27, size: 9, font: fontRegular, color: textDark });
  page.drawText(fromWebsite.replace(/^https?:\/\//, ''), { x: 50, y: y - 39, size: 9, font: fontRegular, color: textDark });

  const billToX = 300;
  page.drawText('PROPOSED TO', { x: billToX, y, size: 8.5, font: fontBold, color: textMuted });
  page.drawText(client.name || 'Valued Client', { x: billToX, y: y - 14, size: 10.5, font: fontBold, color: textDark });
  let clientY = y - 27;
  if (client.country) {
    page.drawText(client.country, { x: billToX, y: clientY, size: 9, font: fontRegular, color: textDark });
    clientY -= 12;
  }

  // 3. Meta Block
  y = height - 198;
  const metaHeight = 44;
  page.drawRectangle({
    x: 50,
    y: y - metaHeight + 10,
    width: 495,
    height: metaHeight,
    color: metaBoxBg,
  });

  page.drawText('QUOTE NO', { x: 68, y: y - 8, size: 8, font: fontBold, color: textMuted });
  page.drawText(quote.quote_code || 'CIQ-Q-0001', { x: 68, y: y - 24, size: 10.5, font: fontBold, color: textDark });

  const issueDateFormatted = formatDocumentDate(quote.created_at || new Date().toISOString());
  page.drawText('QUOTE DATE', { x: 230, y: y - 8, size: 8, font: fontBold, color: textMuted });
  page.drawText(issueDateFormatted, { x: 230, y: y - 24, size: 10.5, font: fontBold, color: textDark });

  const validUntilFormatted = formatDocumentDate(quote.valid_until || new Date().toISOString());
  page.drawText('VALID UNTIL', { x: 390, y: y - 8, size: 8, font: fontBold, color: textMuted });
  page.drawText(validUntilFormatted, { x: 390, y: y - 24, size: 10.5, font: fontBold, color: textDark });

  // 4. Items Table
  y = y - metaHeight - 20;
  const tableHeaderHeight = 24;
  page.drawRectangle({
    x: 50,
    y: y - tableHeaderHeight + 8,
    width: 495,
    height: tableHeaderHeight,
    color: navyBannerBg,
  });

  page.drawText('DESCRIPTION', { x: 60, y: y - 8, size: 8.5, font: fontBold, color: white });
  page.drawText('QTY', { x: 345, y: y - 8, size: 8.5, font: fontBold, color: white });
  page.drawText('UNIT PRICE', { x: 410, y: y - 8, size: 8.5, font: fontBold, color: white });
  page.drawText('AMOUNT', { x: 490, y: y - 8, size: 8.5, font: fontBold, color: white });

  y -= tableHeaderHeight + 12;

  const quoteLines = lines && lines.length > 0 ? lines : [];
  for (const it of quoteLines) {
    const desc = ((it as any).title || it.description || 'Service Package').substring(0, 48);
    const qty = (it as any).quantity ?? it.qty ?? 1;
    page.drawText(desc, { x: 60, y, size: 9.5, font: fontRegular, color: textDark });
    page.drawText(String(qty), { x: 352, y, size: 9.5, font: fontRegular, color: textDark });
    page.drawText(formatCurrency(it.unit_price), { x: 405, y, size: 9.5, font: fontRegular, color: textDark });
    page.drawText(formatCurrency(it.line_total), { x: 485, y, size: 9.5, font: fontRegular, color: textDark });

    if ((it as any).sub_description) {
      y -= 13;
      page.drawText(String((it as any).sub_description).substring(0, 60), { x: 60, y, size: 8.5, font: fontRegular, color: textMuted });
    }

    y -= 18;
    page.drawLine({ start: { x: 50, y: y + 8 }, end: { x: 545, y: y + 8 }, thickness: 0.5, color: borderLight });
  }

  // 5. TOTAL Bar
  y -= 8;
  const totalBoxWidth = 205;
  const totalBoxHeight = 28;
  page.drawRectangle({
    x: 545 - totalBoxWidth,
    y: y - totalBoxHeight + 8,
    width: totalBoxWidth,
    height: totalBoxHeight,
    color: navyBannerBg,
  });

  page.drawText('TOTAL QUOTE', { x: 350, y: y - 10, size: 10, font: fontBold, color: white });
  const totalQuoteStr = formatCurrency(quote.total);
  const totalQuoteWidth = fontBold.widthOfTextAtSize(totalQuoteStr, 10);
  page.drawText(totalQuoteStr, { x: 535 - totalQuoteWidth, y: y - 10, size: 10, font: fontBold, color: white });

  // 6. Terms & Next Steps
  y -= 45;
  page.drawText('COMMERCIAL TERMS & MOBILIZATION', { x: 50, y, size: 9.5, font: fontBold, color: textDark });
  page.drawLine({ start: { x: 50, y: y - 4 }, end: { x: 260, y: y - 4 }, thickness: 1.5, color: navyBannerBg });

  y -= 18;
  const depositPct = business.deposit_pct || 50;
  page.drawText(`1. Deposit: ${depositPct}% mobilization deposit payable upon quote acceptance before build begins.`, {
    x: 50,
    y,
    size: 8.5,
    font: fontRegular,
    color: textDark,
  });
  y -= 14;
  page.drawText(`2. Balance: ${100 - depositPct}% final settlement payable upon solution handover and deployment.`, {
    x: 50,
    y,
    size: 8.5,
    font: fontRegular,
    color: textDark,
  });
  y -= 14;
  page.drawText(`3. Validity: This proposal is valid until ${validUntilFormatted}.`, {
    x: 50,
    y,
    size: 8.5,
    font: fontRegular,
    color: textDark,
  });

  // Footer
  page.drawLine({ start: { x: 50, y: 35 }, end: { x: 545, y: 35 }, thickness: 0.5, color: borderLight });
  const footerText = `${tradingName} | ${fromEmail} | ${fromWebsite.replace(/^https?:\/\//, '')}`;
  const footerWidth = fontRegular.widthOfTextAtSize(footerText, 8);
  page.drawText(footerText, {
    x: (width - footerWidth) / 2,
    y: 22,
    size: 8,
    font: fontRegular,
    color: textMuted,
  });

  return pdfDoc.save();
}
