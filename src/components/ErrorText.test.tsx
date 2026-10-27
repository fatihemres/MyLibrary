import { afterEach, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ErrorText } from './ErrorText';
import { setLanguage, t } from '../i18n';
import { parseJson } from '../services/transfer';
import { exportWishlist } from '../domain/wishlist';
afterEach(() => setLanguage('en'));
it.each(['en', 'tr'])('localizes the actual Wishlist import rejection in %s', async (language) => {
  await setLanguage(language);
  let error: unknown;
  try {
    parseJson(exportWishlist([]));
  } catch (e) {
    error = e;
  }
  expect(error).toBeInstanceOf(Error);
  expect(renderToStaticMarkup(<ErrorText message={String(error)} />)).toBe(
    t('wishlist.importUnsupported'),
  );
  expect(renderToStaticMarkup(<ErrorText message="wishlist.importUnsupported" />)).toBe(
    t('wishlist.importUnsupported'),
  );
});
it('does not misclassify unrelated errors or key-like details', async () => {
  await setLanguage('en');
  for (const message of [
    'Cannot read file',
    'Error: wishlist.importUnsupported extra',
    'wishlist.unknown',
  ]) {
    expect(renderToStaticMarkup(<ErrorText message={message} />)).toBe(message);
  }
});
