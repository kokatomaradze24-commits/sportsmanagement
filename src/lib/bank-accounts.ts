// Bank accounts used for subscription payments (bank transfer).
export interface BankAccount {
  bank: string;
  iban: string;
}

export const BANK_ACCOUNTS: BankAccount[] = [
  { bank: "TBC Bank", iban: "GE08TB7019336010100099" },
  { bank: "Bank of Georgia", iban: "GE67BG0000000611476449" },
];

// Email shown with payment instructions.
export const PAYMENT_CONTACT_EMAIL = "tkey24@yahoo.com";
