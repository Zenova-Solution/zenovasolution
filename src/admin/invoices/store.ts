import { useEffect, useReducer, useRef } from 'react';
import type { Invoice, CompanyInfo } from './types';
import { DEFAULT_COMPANY } from './types';

type Listener = () => void;

const INVOICES_KEY = 'zenova.invoices';
const COMPANY_KEY = 'zenova.invoices.company';
const SEQ_KEY = 'zenova.invoices.seq';

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
}

class InvoiceStore {
  private invoices: Invoice[] = [];
  private company: CompanyInfo = DEFAULT_COMPANY;
  private seq = 1;
  private listeners = new Set<Listener>();

  constructor() {
    this.invoices = loadJSON<Invoice[]>(INVOICES_KEY, []);
    this.company = loadJSON<CompanyInfo>(COMPANY_KEY, DEFAULT_COMPANY);
    this.seq = loadJSON<number>(SEQ_KEY, 1);
  }

  getInvoices(): Invoice[] {
    return this.invoices;
  }

  getInvoice(id: string): Invoice | undefined {
    return this.invoices.find((i) => i.id === id);
  }

  getCompany(): CompanyInfo {
    return this.company;
  }

  getNextSeq(): number {
    return this.seq;
  }

  saveInvoice(invoice: Invoice) {
    const idx = this.invoices.findIndex((i) => i.id === invoice.id);
    const updated = { ...invoice, updatedAt: new Date().toISOString() };
    if (idx >= 0) {
      this.invoices[idx] = updated;
    } else {
      this.invoices.unshift(updated);
    }
    saveJSON(INVOICES_KEY, this.invoices);
    this.emit();
  }

  deleteInvoice(id: string) {
    this.invoices = this.invoices.filter((i) => i.id !== id);
    saveJSON(INVOICES_KEY, this.invoices);
    this.emit();
  }

  duplicateInvoice(id: string): Invoice | null {
    const src = this.getInvoice(id);
    if (!src) return null;
    const now = new Date().toISOString();
    const copy: Invoice = {
      ...src,
      id: crypto.randomUUID(),
      number: `INV-${String(this.seq).padStart(4, '0')}`,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      items: src.items.map((item) => ({ ...item, id: crypto.randomUUID() })),
    };
    this.seq++;
    saveJSON(SEQ_KEY, this.seq);
    this.invoices.unshift(copy);
    saveJSON(INVOICES_KEY, this.invoices);
    this.emit();
    return copy;
  }

  saveCompany(info: CompanyInfo) {
    this.company = info;
    saveJSON(COMPANY_KEY, info);
    this.emit();
  }

  bumpSeq() {
    this.seq++;
    saveJSON(SEQ_KEY, this.seq);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }
}

export const invoiceStore = new InvoiceStore();

export function useInvoices() {
  const [, force] = useReducer((x: number) => x + 1, 0);
  const ref = useRef(invoiceStore);
  useEffect(() => ref.current.subscribe(force), []);
  return invoiceStore.getInvoices();
}

export function useInvoice(id: string) {
  const [, force] = useReducer((x: number) => x + 1, 0);
  const ref = useRef(invoiceStore);
  useEffect(() => ref.current.subscribe(force), []);
  return invoiceStore.getInvoice(id);
}

export function useCompanyInfo() {
  const [, force] = useReducer((x: number) => x + 1, 0);
  const ref = useRef(invoiceStore);
  useEffect(() => ref.current.subscribe(force), []);
  return invoiceStore.getCompany();
}
