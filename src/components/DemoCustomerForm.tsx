import { FormEvent, useState } from 'react';
import { CustomerDraft, saveStoredCustomer } from '../data/mockCustomers';
import { Customer } from '../types/customer';

const initialDraft: CustomerDraft = { kind: 'Privatperson', firstName: '', lastName: '', company: '',
  street: '', houseNumber: '', zip: '', city: '', country: 'Schweiz', email: '', phone: '', fictional: false };
const inputStyle = 'block w-full mt-1 min-h-11 rounded-lg border border-stone-300 bg-white px-3 py-2 text-base text-stone-900';

export function DemoCustomerForm({ onSave, onCancel }: { onSave: (c: Customer) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<CustomerDraft>(initialDraft);
  const [error, setError] = useState('');
  function field(key: Exclude<keyof CustomerDraft, 'kind' | 'fictional'>, label: string, required = true, type = 'text', placeholder = '') {
    return <label className="text-sm font-medium text-stone-800">{label}{required && ' *'}
      <input type={type} required={required} value={draft[key]} maxLength={120} autoComplete="off"
        placeholder={placeholder} onChange={e => setDraft({ ...draft, [key]: e.target.value })} className={inputStyle} />
    </label>;
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    try { onSave(saveStoredCustomer(draft)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.'); }
  }
  return <form onSubmit={submit} autoComplete="off" className="rounded-xl border border-wine-200 bg-wine-50 p-4 space-y-4">
    <h3 className="font-serif text-xl font-bold text-wine-950">Neuen Demokunden erfassen</h3>
    <strong className="block rounded-lg bg-gold-100 p-3 text-sm text-wine-950">Nur Testdaten eingeben – keine echten Kundendaten.</strong>
    <label className="block text-sm font-medium">Kundentyp
      <select className={inputStyle} value={draft.kind} onChange={e => setDraft({ ...draft, kind: e.target.value as CustomerDraft['kind'] })}>
        <option>Privatperson</option><option>Firma</option>
      </select>
    </label>
    <div className="grid gap-3 sm:grid-cols-2">
      {draft.kind === 'Firma' ? field('company', 'Firmenname') : <>{field('firstName', 'Vorname')}{field('lastName', 'Nachname')}</>}
      {field('street', 'Strasse')}{field('houseNumber', 'Hausnummer')}
      {field('zip', 'PLZ')}{field('city', 'Ort')}{field('country', 'Land', false)}
    </div>
    <p className="text-sm">Mindestens einen Testkontakt angeben: eine E-Mail mit @example.invalid oder eine Telefonnummer aus 7 bis 15 Nullen.</p>
    <div className="grid gap-3 sm:grid-cols-2">{field('email', 'E-Mail-Adresse', false, 'email', 'demo@example.invalid')}
      {field('phone', 'Telefonnummer', false, 'tel', '000 000 0000')}</div>
    <label className="flex min-h-11 items-center gap-2 text-sm"><input required type="checkbox" checked={draft.fictional}
      onChange={e => setDraft({ ...draft, fictional: e.target.checked })} />Ich verwende ausschliesslich fiktive Testdaten.</label>
    {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
    <div className="flex flex-wrap gap-3"><button type="submit" className="min-h-11 rounded-xl bg-wine-900 px-4 text-white font-semibold">Speichern und Verkäufer wählen</button>
      <button type="button" onClick={onCancel} className="min-h-11 rounded-xl border border-stone-300 px-4">Abbrechen</button></div>
  </form>;
}
