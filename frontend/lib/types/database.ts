// ============================================================================
// TradeLife v2 - TypeScript Types
// All currency fields are BIGINT (pence/cents) represented as number in TS.
// Percentages stored as integer x100 (e.g., 2500 = 25.00%)
// ============================================================================

// -- Enums --

export type QuoteStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'DECLINED';
export type JobStatus = 'ENQUIRY' | 'BOOKED' | 'ON_SITE' | 'COMPLETED' | 'SNAGGING' | 'SIGNED_OFF' | 'CANCELLED';
export type JobLineItemStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type VariationStatus = 'PROPOSED' | 'APPROVED' | 'REJECTED';
export type InvoiceType = 'DEPOSIT' | 'INTERIM' | 'FINAL';
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'VOID';
export type MoneyPotType = 'OPERATING' | 'TAX' | 'PROFIT' | 'RESERVE';

// -- Core Types --

export interface Organisation {
  id: string;
  name: string;
  stripe_customer_id: string | null;
  xero_tenant_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  org_id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  org_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  stripe_customer_id: string | null;
  xero_contact_id: string | null;
  created_at: string;
  updated_at: string;
}

// -- Quote Layer --

export interface Quote {
  id: string;
  org_id: string;
  client_id: string | null;
  status: QuoteStatus;
  share_token: string;
  vat_rate: number;                    // basis points x100 (2000 = 20.00%)
  quote_amount_net: number;            // pence
  quote_amount_gross: number;          // pence
  quote_total_cost: number;            // pence
  quote_profit: number;                // pence
  quote_margin_percentage: number;     // x100 (2500 = 25.00%)
  reference: string | null;
  notes: string | null;
  valid_until: string | null;
  job_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuoteSection {
  id: string;
  quote_id: string;
  org_id: string;
  title: string;
  trade_type: string | null;
  sort_order: number;
  is_subcontract: boolean;
  // Inputs
  labour_days: number;
  labour_day_rate: number;             // pence per day
  subcontract_cost: number;            // pence
  material_cost_total: number;         // pence
  margin_percentage: number;           // x100 (2500 = 25.00%)
  // Calculated
  labour_cost: number;                 // pence
  section_cost_total: number;          // pence
  section_revenue_total: number;       // pence
  section_profit: number;              // pence
  created_at: string;
  updated_at: string;
}

export interface QuoteLineItem {
  id: string;
  quote_id: string;
  quote_section_id: string | null;
  org_id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price_net: number;              // pence per unit
  line_total_net: number;              // pence
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// -- Job Layer --

export interface Job {
  id: string;
  org_id: string;
  source_quote_id: string;
  client_id: string | null;
  title: string;
  address: string | null;
  status: JobStatus;
  target_start_date: string | null;
  target_end_date: string | null;
  google_calendar_event_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobLineItem {
  id: string;
  job_id: string;
  org_id: string;
  source_quote_line_id: string | null;
  description: string;
  quantity: number;
  unit: string;
  unit_price_net: number;              // pence
  line_total_net: number;              // pence
  status: JobLineItemStatus;
  is_variation: boolean;
  variation_reason: string | null;
  source_variation_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Variation {
  id: string;
  job_id: string;
  org_id: string;
  description: string;
  reason: string | null;
  quantity: number;
  unit: string;
  unit_price_net: number;              // pence
  line_total_net: number;              // pence
  status: VariationStatus;
  approved_at: string | null;
  job_line_item_id: string | null;
  created_at: string;
  updated_at: string;
}

// -- Invoice Layer --

export interface Invoice {
  id: string;
  org_id: string;
  source_job_id: string;
  invoice_number: string;
  invoice_type: InvoiceType;
  amount_net: number;                  // pence
  vat_rate: number;                    // basis points x100
  amount_gross: number;                // pence
  status: InvoiceStatus;
  issue_date: string;
  due_date: string | null;
  paid_at: string | null;
  stripe_payment_link: string | null;
  stripe_payment_intent_id: string | null;
  xero_invoice_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  org_id: string;
  source_job_line_id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price_net: number;              // pence
  line_total_net: number;              // pence
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// -- Finance Layer --

export interface MoneyPot {
  id: string;
  org_id: string;
  pot_type: MoneyPotType;
  balance: number;                     // pence
  allocation_percentage: number;       // x100 (5000 = 50.00%)
  income_floor: number;                // pence
  created_at: string;
  updated_at: string;
}

export interface CashflowEntry {
  id: string;
  org_id: string;
  pot_type: MoneyPotType;
  amount: number;                      // pence (positive = in, negative = out)
  description: string | null;
  source_invoice_id: string | null;
  created_at: string;
}
