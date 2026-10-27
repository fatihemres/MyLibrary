import currencyDigits from './currencies.json';
export const currencies: Record<string, number> = currencyDigits;
export const wishStatuses = ['Wishing', 'On Order', 'Pre-Order', 'Cancelled'] as const;
export const wishPriorities = ['Low', 'Medium', 'High', 'Urgent'] as const;
export interface Retailer {
  id: string;
  name: string;
  url: string;
  offer_minor: string | null;
  currency: string;
  notes: string;
}
export interface WishlistDraft {
  id: string;
  edition_id: string | null;
  title: string;
  author: string;
  isbn10: string;
  isbn13: string;
  preference: 'Any' | 'Specific';
  edition_description: string;
  priority: (typeof wishPriorities)[number];
  status: (typeof wishStatuses)[number];
  target_minor: string | null;
  currency: string;
  notes: string;
  archived: boolean;
  updated_at: string;
  retailers: Retailer[];
}
export interface WishlistItem {
  draft: WishlistDraft;
  cover: string;
  history: { status: string; created_at: string }[];
}
export interface WishlistSnapshot {
  items: WishlistItem[];
  budget: { currency: string; minor: string }[];
  missing_prices: number;
}
export interface WishlistReview {
  kind: 'edition' | 'wishlist';
  id: string;
  title: string;
  archived?: boolean;
  exact: boolean;
}
export type WishlistSave =
  { saved: true; id: string } | { saved: false; review: WishlistReview[]; review_token: string };
export function emptyWish(): WishlistDraft {
  return {
    id: '',
    edition_id: null,
    title: '',
    author: '',
    isbn10: '',
    isbn13: '',
    preference: 'Any',
    edition_description: '',
    priority: 'Medium',
    status: 'Wishing',
    target_minor: null,
    currency: 'TRY',
    notes: '',
    archived: false,
    updated_at: '',
    retailers: [],
  };
}
export function amountToMinor(input: string, currency: string): string | null {
  const digits = currencies[currency];
  if (digits === undefined) throw new Error('wishlist.invalidCurrency');
  if (input === '') return null;
  if (!/^\d+(?:\.\d+)?$/.test(input) || input.length > 25)
    throw new Error('wishlist.invalidAmount');
  const [whole, fraction = ''] = input.split('.');
  if (fraction.length > digits) throw new Error('wishlist.invalidAmount');
  const value = BigInt(whole) * 10n ** BigInt(digits) + BigInt(fraction.padEnd(digits, '0') || '0');
  if (value > 9223372036854775807n) throw new Error('wishlist.invalidAmount');
  return value.toString();
}
export function amountText(minor: string | null, currency: string): string {
  if (minor === null) return '';
  const digits = currencies[currency];
  if (digits === undefined || !/^\d+$/.test(minor)) throw new Error('wishlist.invalidAmount');
  const text = minor.padStart(digits + 1, '0');
  return digits ? `${text.slice(0, -digits)}.${text.slice(-digits)}` : text;
}
export function exportWishlist(items: WishlistItem[], notes = false, retailers = false): string {
  return JSON.stringify(
    {
      format: 'MyLibrary Wishlist catalogue',
      version: 1,
      items: items.map(({ draft: d }) => ({
        title: d.title,
        author: d.author,
        isbn10: d.isbn10,
        isbn13: d.isbn13,
        preference: d.preference,
        edition_description: d.edition_description,
        priority: d.priority,
        status: d.status,
        target_minor: d.target_minor,
        currency: d.currency,
        archived: d.archived,
        ...(notes ? { notes: d.notes } : {}),
        ...(retailers
          ? {
              retailers: d.retailers.map(
                ({ name, url, offer_minor, currency, notes: retailerNotes }) => ({
                  name,
                  url,
                  offer_minor,
                  currency,
                  ...(notes ? { notes: retailerNotes } : {}),
                }),
              ),
            }
          : {}),
      })),
    },
    null,
    2,
  );
}
