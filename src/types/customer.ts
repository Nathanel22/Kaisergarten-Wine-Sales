export type Salutation = 'Herr' | 'Frau' | 'Familie' | 'Firma';

export interface Customer {
  readonly id: string;
  readonly salutation: Salutation;
  readonly firstName: string;
  readonly lastName: string;
  readonly company?: string;
  readonly street: string;
  readonly zip: string; // 4-stellig CH (z.B. "8001")
  readonly city: string;
  readonly canton?: string; // z.B. "ZH"
  readonly country: string; // Default: "Schweiz"
  readonly email: string;
  readonly phone: string;
  readonly notes?: string;
  readonly createdAt: string;
}

export interface CustomerValidationResult {
  readonly isValid: boolean;
  readonly errors: Readonly<Record<string, string>>;
}

/**
 * Validiert Kundendaten nach Schweizer Standards
 */
export function validateCustomerData(data: Partial<Customer>): CustomerValidationResult {
  const errors: Record<string, string> = {};

  if (!data.lastName || !data.lastName.trim()) {
    errors.lastName = 'Nachname ist erforderlich';
  }

  if (data.salutation !== 'Firma' && (!data.firstName || !data.firstName.trim())) {
    errors.firstName = 'Vorname ist erforderlich';
  }

  if (data.salutation === 'Firma' && (!data.company || !data.company.trim())) {
    errors.company = 'Firmenname ist bei Firmen erforderlich';
  }

  if (!data.street || !data.street.trim()) {
    errors.street = 'Strasse und Hausnummer sind erforderlich';
  }

  // Schweizer PLZ ist 4-stellig numerisch (1000 - 9999)
  const zipTrimmed = data.zip?.trim() ?? '';
  if (!zipTrimmed) {
    errors.zip = 'PLZ ist erforderlich';
  } else if (!/^[1-9]\d{3}$/.test(zipTrimmed)) {
    errors.zip = 'Schweizer PLZ muss aus 4 Ziffern bestehen (z.B. 8001)';
  }

  if (!data.city || !data.city.trim()) {
    errors.city = 'Ort ist erforderlich';
  }

  // Kontakt: Entweder gültige E-Mail oder Telefonnummer muss vorhanden sein
  const emailTrimmed = data.email?.trim() ?? '';
  const phoneTrimmed = data.phone?.trim() ?? '';

  if (!emailTrimmed && !phoneTrimmed) {
    errors.contact = 'Mindestens E-Mail-Adresse oder Telefonnummer muss angegeben werden';
  }

  if (emailTrimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
    errors.email = 'Ungültiges E-Mail-Format';
  }

  if (phoneTrimmed && phoneTrimmed.replace(/[\s\-\+\(\)\/]/g, '').length < 7) {
    errors.phone = 'Telefonnummer ist zu kurz';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
