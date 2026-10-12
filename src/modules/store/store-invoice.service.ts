import { Injectable } from '@nestjs/common';

export interface StoreInvoiceData {
  invoice_number: string;
  order_number: string;
  issued_at: Date | string;
  payment_status: string;
  status: string;
  razorpay_payment_id?: string | null;
  razorpay_order_id?: string | null;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  buyer: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    class_name?: string | null;
    roll_number?: string | null;
  };
  school: {
    name: string;
    logo_url?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    primary_color?: string | null;
  };
}

/**
 * Renders a self-contained HTML invoice for a store purchase. The markup uses
 * only inline CSS so it prints/converts to PDF cleanly in any renderer (the
 * browser's print dialog on web, or a PDF engine). Mirrors the approach used
 * by ReportCardPdfService.
 */
@Injectable()
export class StoreInvoiceService {
  generateInvoiceHtml(data: StoreInvoiceData): string {
    const { school, buyer } = data;
    const color = school.primary_color || '#2563eb';
    const money = (n: number) =>
      `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const issued = new Date(data.issued_at);
    const issuedStr = isNaN(issued.getTime())
      ? '-'
      : issued.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    const buyerLines = [
      buyer.name ? `<strong>${this.esc(buyer.name)}</strong>` : '',
      buyer.class_name
        ? `Class: ${this.esc(buyer.class_name)}${buyer.roll_number ? ` · Roll ${this.esc(String(buyer.roll_number))}` : ''}`
        : '',
      buyer.phone ? `Phone: ${this.esc(buyer.phone)}` : '',
      buyer.email ? `Email: ${this.esc(buyer.email)}` : '',
    ]
      .filter(Boolean)
      .map((l) => `<p style="font-size:12px;color:#4b5563;margin:2px 0;">${l}</p>`)
      .join('');

    const paid = data.payment_status === 'paid';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${this.esc(data.invoice_number)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; background: #fff; }
    @page { size: A4; margin: 15mm; }
    .btn-print { position: fixed; top: 16px; right: 16px; background: ${color}; color: #fff;
      border: 0; padding: 10px 18px; border-radius: 6px; font-size: 13px; cursor: pointer; }
    @media print { .btn-print { display: none; } }
  </style>
</head>
<body>
  <button class="btn-print" onclick="window.print()">Download / Print</button>
  <div style="max-width: 760px; margin: 0 auto; padding: 24px;">

    <!-- Header -->
    <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid ${color}; padding-bottom:16px; margin-bottom:24px;">
      <div style="display:flex; align-items:center; gap:12px;">
        ${school.logo_url ? `<img src="${this.esc(school.logo_url)}" style="height:52px;" />` : ''}
        <div>
          <h1 style="font-size:20px; color:${color};">${this.esc(school.name)}</h1>
          ${school.address ? `<p style="font-size:11px; color:#6b7280; margin-top:2px;">${this.esc(school.address)}</p>` : ''}
          <p style="font-size:11px; color:#6b7280; margin-top:2px;">
            ${school.phone ? `Ph: ${this.esc(school.phone)}` : ''}${school.phone && school.email ? ' · ' : ''}${school.email ? this.esc(school.email) : ''}
          </p>
        </div>
      </div>
      <div style="text-align:right;">
        <h2 style="font-size:22px; letter-spacing:1px; color:#111827;">INVOICE</h2>
        <p style="font-size:12px; color:#4b5563; margin-top:4px;">#${this.esc(data.invoice_number)}</p>
        <p style="font-size:11px; color:#9ca3af;">Order ${this.esc(data.order_number)}</p>
      </div>
    </div>

    <!-- Meta row -->
    <div style="display:flex; justify-content:space-between; margin-bottom:24px;">
      <div>
        <p style="font-size:11px; text-transform:uppercase; color:#9ca3af; letter-spacing:0.5px; margin-bottom:4px;">Billed To</p>
        ${buyerLines || '<p style="font-size:12px;color:#4b5563;">—</p>'}
      </div>
      <div style="text-align:right;">
        <p style="font-size:11px; text-transform:uppercase; color:#9ca3af; letter-spacing:0.5px; margin-bottom:4px;">Details</p>
        <p style="font-size:12px; color:#4b5563; margin:2px 0;">Date: ${issuedStr}</p>
        <p style="font-size:12px; color:#4b5563; margin:2px 0;">
          Status:
          <span style="font-weight:600; color:${paid ? '#059669' : '#d97706'};">${paid ? 'PAID' : this.esc(data.payment_status.toUpperCase())}</span>
        </p>
        ${data.razorpay_payment_id ? `<p style="font-size:11px; color:#9ca3af; margin:2px 0;">Txn: ${this.esc(data.razorpay_payment_id)}</p>` : ''}
      </div>
    </div>

    <!-- Line items -->
    <table style="width:100%; border-collapse:collapse; margin-bottom:16px;">
      <thead>
        <tr style="background:${color}; color:#fff;">
          <th style="padding:10px 12px; font-size:12px; text-align:left;">Item</th>
          <th style="padding:10px 12px; font-size:12px; text-align:center; width:70px;">Qty</th>
          <th style="padding:10px 12px; font-size:12px; text-align:right; width:110px;">Unit Price</th>
          <th style="padding:10px 12px; font-size:12px; text-align:right; width:120px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:12px; font-size:13px; color:#374151;">${this.esc(data.item_name)}</td>
          <td style="padding:12px; font-size:13px; color:#374151; text-align:center;">${data.quantity}</td>
          <td style="padding:12px; font-size:13px; color:#374151; text-align:right;">${money(data.unit_price)}</td>
          <td style="padding:12px; font-size:13px; color:#374151; text-align:right;">${money(data.unit_price * data.quantity)}</td>
        </tr>
      </tbody>
    </table>

    <!-- Totals -->
    <div style="display:flex; justify-content:flex-end; margin-bottom:32px;">
      <table style="width:260px;">
        <tr>
          <td style="padding:6px 12px; font-size:13px; color:#6b7280;">Subtotal</td>
          <td style="padding:6px 12px; font-size:13px; color:#374151; text-align:right;">${money(data.unit_price * data.quantity)}</td>
        </tr>
        <tr style="border-top:2px solid ${color};">
          <td style="padding:10px 12px; font-size:15px; font-weight:700; color:#111827;">Total</td>
          <td style="padding:10px 12px; font-size:15px; font-weight:700; color:${color}; text-align:right;">${money(data.total_amount)}</td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid #e5e7eb; padding-top:16px; text-align:center;">
      <p style="font-size:11px; color:#9ca3af;">This is a computer-generated invoice and does not require a signature.</p>
      <p style="font-size:11px; color:#9ca3af; margin-top:2px;">Items are collected from the school counter. No delivery is provided.</p>
    </div>
  </div>
</body>
</html>`;
  }

  private esc(s: any): string {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
