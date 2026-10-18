import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface UnifiedInvoice {
  source: 'fee' | 'event' | 'store';
  id: number;
  invoice_number: string;
  title: string;
  amount: number;
  status: string;       // paid | unpaid | pending
  issued_at: string | Date | null;
  meta?: string;
}

/**
 * Aggregates a user's invoices across fees, events and store into one feed.
 * Resolves the student record once, then unions the three sources.
 */
@Injectable()
export class InvoiceAggregatorService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  private async studentId(schoolId: number, userId: number): Promise<number | null> {
    const rows = await this.ds.query(
      `SELECT id FROM students WHERE school_id = ? AND user_id = ? LIMIT 1`,
      [schoolId, userId],
    );
    return rows?.[0]?.id ?? null;
  }

  async myInvoices(schoolId: number, userId: number, type?: string): Promise<UnifiedInvoice[]> {
    const studentId = await this.studentId(schoolId, userId);
    const out: UnifiedInvoice[] = [];

    // ─── Fees ───
    if (!type || type === 'fee') {
      if (studentId) {
        const fees = await this.ds.query(
          `SELECT id, invoice_number, total_amount, amount, status, due_date, paid_date, fee_type
           FROM fee_invoices WHERE school_id = ? AND student_id = ? ORDER BY created_at DESC`,
          [schoolId, studentId],
        ).catch(() => []);
        for (const f of fees) {
          out.push({
            source: 'fee',
            id: f.id,
            invoice_number: f.invoice_number || `FEE-${f.id}`,
            title: f.fee_type ? `Fees — ${f.fee_type}` : 'School Fees',
            amount: Number(f.total_amount || f.amount || 0),
            status: f.status === 'paid' ? 'paid' : 'unpaid',
            issued_at: f.paid_date || f.due_date || null,
            meta: f.status === 'paid' ? 'Paid' : 'Due',
          });
        }
      }
    }

    // ─── Store ───
    if (!type || type === 'store') {
      const orders = await this.ds.query(
        `SELECT id, invoice_number, item_name, total_amount, payment_status, status, paid_at, created_at
         FROM store_orders WHERE school_id = ? AND user_id = ? AND payment_status = 'paid' ORDER BY created_at DESC`,
        [schoolId, userId],
      ).catch(() => []);
      for (const o of orders) {
        out.push({
          source: 'store',
          id: o.id,
          invoice_number: o.invoice_number || `INV-STORE-${schoolId}-${String(o.id).padStart(6, '0')}`,
          title: `Store — ${o.item_name}`,
          amount: Number(o.total_amount || 0),
          status: 'paid',
          issued_at: o.paid_at || o.created_at,
          meta: o.status === 'completed' ? 'Collected' : 'Awaiting collection',
        });
      }
    }

    // ─── Events ───
    if (!type || type === 'event') {
      const regs = await this.ds.query(
        `SELECT er.id, er.amount, er.payment_status, er.created_at, e.title as event_title
         FROM event_registrations er
         JOIN events e ON e.id = er.event_id
         WHERE er.school_id = ? AND er.user_id = ? AND er.payment_status = 'paid' ORDER BY er.created_at DESC`,
        [schoolId, userId],
      ).catch(() => []);
      for (const r of regs) {
        out.push({
          source: 'event',
          id: r.id,
          invoice_number: `EVT-${schoolId}-${String(r.id).padStart(6, '0')}`,
          title: `Event — ${r.event_title}`,
          amount: Number(r.amount || 0),
          status: 'paid',
          issued_at: r.created_at,
          meta: 'Registered',
        });
      }
    }

    // Newest first across all sources.
    out.sort((a, b) => new Date(b.issued_at || 0).getTime() - new Date(a.issued_at || 0).getTime());
    return out;
  }

  /** Minimal printable HTML document for one invoice. */
  async renderDocument(schoolId: number, userId: number, source: string, id: number): Promise<string> {
    const invoices = await this.myInvoices(schoolId, userId);
    const inv = invoices.find((i) => i.source === source && Number(i.id) === Number(id));
    if (!inv) throw new NotFoundException('Invoice not found');

    const schoolRows = await this.ds.query(`SELECT name, address FROM schools WHERE id = ? LIMIT 1`, [schoolId]).catch(() => []);
    const school = schoolRows?.[0] || { name: 'School', address: '' };
    const esc = (s: any) => String(s ?? '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
    const date = inv.issued_at ? new Date(inv.issued_at).toLocaleDateString('en-IN') : '-';

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${esc(inv.invoice_number)}</title>
<style>*{margin:0;padding:0;box-sizing:border-box;font-family:Arial,sans-serif}
body{padding:32px;color:#1f2937}.box{max-width:640px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden}
.hd{background:linear-gradient(135deg,#2563eb,#06b6d4);color:#fff;padding:24px}.hd h1{font-size:20px}.hd p{opacity:.9;font-size:13px;margin-top:4px}
.bd{padding:24px}.row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:14px}
.row span:first-child{color:#6b7280}.total{display:flex;justify-content:space-between;padding:16px 24px;background:#f9fafb;font-weight:700;font-size:18px}
.badge{display:inline-block;padding:3px 12px;border-radius:999px;background:#dcfce7;color:#16a34a;font-size:12px;font-weight:600}
@media print{body{padding:0}.print{display:none}}</style></head>
<body><div class="box">
<div class="hd"><h1>${esc(school.name)}</h1><p>Tax Invoice · ${esc(inv.invoice_number)}</p></div>
<div class="bd">
<div class="row"><span>Invoice No</span><span>${esc(inv.invoice_number)}</span></div>
<div class="row"><span>Description</span><span>${esc(inv.title)}</span></div>
<div class="row"><span>Date</span><span>${esc(date)}</span></div>
<div class="row"><span>Status</span><span class="badge">${esc(inv.status.toUpperCase())}</span></div>
</div>
<div class="total"><span>Total</span><span>₹${Number(inv.amount).toFixed(2)}</span></div>
</div>
<div class="print" style="max-width:640px;margin:16px auto;text-align:right">
<button onclick="window.print()" style="padding:10px 20px;background:#2563eb;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer">Print / Save as PDF</button>
</div></body></html>`;
  }
}
