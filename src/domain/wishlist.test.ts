import { describe, it, expect } from 'vitest';
import {
  amountToMinor,
  amountText,
  emptyWish,
  exportWishlist,
  type WishlistItem,
  currencies,
} from './wishlist';
import { parseJson } from '../services/transfer';
import en from '../i18n/locales/en.json';
import tr from '../i18n/locales/tr.json';
describe('Wishlist independent contracts', () => {
  it('creates only a standalone draft', () => {
    expect(emptyWish().edition_id).toBeNull();
    expect(emptyWish()).not.toHaveProperty('copy_id');
    expect(emptyWish().status).toBe('Wishing');
  });
  it.each([
    ['12.34', 'TRY', '1234'],
    ['12', 'JPY', '12'],
    ['1.234', 'KWD', '1234'],
    ['1.2345', 'CLF', '12345'],
    ['92233720368547758.07', 'USD', '9223372036854775807'],
  ])('converts %s %s exactly', (v, c, m) => {
    expect(amountToMinor(v, c)).toBe(m);
    expect(amountText(m, c)).toBe(v);
  });
  it.each(['-1', '1.234', 'Infinity', '1e2', '0x10', '1,23', '92233720368547758.08', '1.', ' '])(
    'rejects invalid USD %s',
    (v) => expect(() => amountToMinor(v, 'USD')).toThrow(),
  );
  it('preserves missing prices and validates currency-specific precision', () => {
    expect(amountToMinor('', 'TRY')).toBeNull();
    expect(() => amountToMinor('1.1', 'JPY')).toThrow();
    expect(() => amountToMinor('1', 'XXX')).toThrow();
    expect(Object.keys(currencies).length).toBeGreaterThan(150);
  });
  it('defaults to a private-data-free wishlist JSON catalogue', () => {
    const item: WishlistItem = {
      draft: {
        ...emptyWish(),
        title: 'Test',
        notes: 'secret',
        retailers: [
          {
            id: 'r',
            name: 'shop',
            url: 'https://shop.example/',
            offer_minor: '10',
            currency: 'USD',
            notes: 'retailer secret',
          },
        ],
      },
      cover: 'covers/private.png',
      history: [{ status: 'Wishing', created_at: 'time' }],
    };
    const data = JSON.parse(exportWishlist([item]));
    expect(data.items[0]).not.toHaveProperty('notes');
    expect(data.items[0]).not.toHaveProperty('retailers');
    expect(data.items[0]).not.toHaveProperty('edition_id');
    expect(data.items[0]).not.toHaveProperty('cover');
    expect(JSON.parse(exportWishlist([item], true, true)).items[0].retailers[0].notes).toBe(
      'retailer secret',
    );
    expect(
      JSON.parse(exportWishlist([item], false, true)).items[0].retailers[0],
    ).not.toHaveProperty('notes');
    expect(() => parseJson(exportWishlist([item]))).toThrow('wishlist.importUnsupported');
  });
  it('keeps EN/TR keys symmetric', () =>
    expect(Object.keys(en).sort()).toEqual(Object.keys(tr).sort()));
});
