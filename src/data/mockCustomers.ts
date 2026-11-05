import { Customer } from '../types/customer';

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

/** Public demo never imports previously stored personal data. */
export function loadStoredCustomers(): Customer[] {
  return INITIAL_DEMO_CUSTOMERS.map((customer) => ({ ...customer }));
}

export function saveStoredCustomer(_customer: Customer): Customer[] {
  throw new Error('In dieser öffentlichen Demo sind nur synthetische Beispielkunden erlaubt.');
}
