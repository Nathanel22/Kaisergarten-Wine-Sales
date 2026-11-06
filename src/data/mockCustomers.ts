import { CUSTOMERS_STORAGE_KEY } from '../utils/demoStorage';
import { Customer, validateCustomerData } from '../types/customer';

// Explicitly fictional identities and non-routable example.invalid contacts.
export const INITIAL_DEMO_CUSTOMERS: readonly Customer[] = [1, 2, 3].map((number) => ({
  id: `DEMO-CUSTOMER-${number}`,
  salutation: 'Firma',
  firstName: 'Demo',
  lastName: `Beispielkunde ${number}`,
  company: `Fiktive Demofirma ${number}`,
  street: 'Fiktive Testadresse 0',
  zip: '8000',
  city: 'Demo-Ort',
  country: 'Schweiz',
  email: `demo-${number}@example.invalid`,
  phone: '',
  notes: 'Rein synthetischer Datensatz, keine reale Person oder Lieferadresse.',
  createdAt: '2026-11-05T00:00:00.000Z',
}));

export interface CustomerDraft {
  kind: 'Privatperson' | 'Firma';
  firstName: string;
  lastName: string;
  company: string;
  street: string;
  houseNumber: string;
  zip: string;
  city: string;
  country: string;
  email: string;
  phone: string;
  fictional: boolean;
}

type LocalRecord = { id: string; createdAt: string; draft: CustomerDraft };

function toCustomer({ id, createdAt, draft }: LocalRecord): Customer {
  if (!draft.fictional || !['Privatperson', 'Firma'].includes(draft.kind)) {
    throw new Error('Bitte ausschliesslich synthetische Testdaten verwenden und bestätigen.');
  }
  if (!draft.street.trim() || !/^\d[\w /-]*$/.test(draft.houseNumber.trim())) {
    throw new Error('Bitte Strasse und Hausnummer angeben.');
  }
  const email = draft.email.trim().toLowerCase();
  const phone = draft.phone.trim();
  if (email && !/^[^\s@]+@example\.invalid$/.test(email)) {
    throw new Error('Für Testadressen bitte die Endung @example.invalid verwenden.');
  }
  if (phone && !/^0{7,15}$/.test(phone.replace(/[\s-]/g, ''))) {
    throw new Error('Als Testtelefon bitte 7 bis 15 Nullen eingeben.');
  }
  const company = draft.kind === 'Firma' ? draft.company.trim() : undefined;
  const customer: Customer = {
    id, createdAt, salutation: draft.kind, company,
    firstName: company !== undefined ? '' : draft.firstName.trim(),
    lastName: company ?? draft.lastName.trim(), street: `${draft.street.trim()} ${draft.houseNumber.trim()}`,
    zip: draft.zip.trim(), city: draft.city.trim(), country: draft.country.trim() || 'Schweiz', email, phone,
  };
  const validation = validateCustomerData(customer);
  if (!validation.isValid) throw new Error(Object.values(validation.errors).join(' '));
  return customer;
}

function readRecords(): LocalRecord[] {
  const raw = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
  if (raw === null) return [];
  const records: LocalRecord[] = JSON.parse(raw);
  if (!Array.isArray(records)) throw new Error('Ungültige Demokundenliste.');
  for (const record of records) {
    if (!/^DEMO-NEU-[\da-f-]{36}$/.test(record.id)) throw new Error('Ungültige Demokundennummer.');
    toCustomer(record);
  }
  return records;
}

export function loadStoredCustomers(): Customer[] {
  try { return [...INITIAL_DEMO_CUSTOMERS, ...readRecords().map(toCustomer)]; }
  catch { return [...INITIAL_DEMO_CUSTOMERS]; }
}

export function saveStoredCustomer(draft: CustomerDraft): Customer {
  const record = { id: `DEMO-NEU-${crypto.randomUUID()}`, createdAt: new Date().toISOString(), draft };
  const customer = toCustomer(record);
  // Store only the active identity fields, even if the type was changed mid-form.
  record.draft = { ...draft, firstName: customer.firstName, lastName: draft.kind === 'Firma' ? '' : customer.lastName,
    company: customer.company ?? '', email: customer.email, phone: customer.phone };
  try {
    const serialized = JSON.stringify([...readRecords(), record]);
    localStorage.setItem(CUSTOMERS_STORAGE_KEY, serialized);
    if (localStorage.getItem(CUSTOMERS_STORAGE_KEY) !== serialized) throw new Error('Schreibfehler');
  } catch { throw new Error('Demokunde konnte lokal nicht gespeichert werden. Bitte den Browserspeicher prüfen.'); }
  return customer;
}

