/* global window, document */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Runs inside the existing isolated native harness, against real Rust/SQLite IPC.
export async function verifyWishlistAcquisition({ page, nav, snapshot, runDir }) {
  const aliases = JSON.parse(await readFile(join(process.cwd(), 'src/i18n/aliases.json'), 'utf8'));
  const invoke = (action, payload = {}) =>
    page.evaluate(
      ({ action, payload }) => window.__TAURI_INTERNALS__.invoke('database', { action, payload }),
      { action, payload },
    );
  for (const language of ['en', 'tr']) {
    const previous = await page.locator('html').getAttribute('lang');
    await nav(previous === 'tr' ? 'Ayarlar' : 'Settings');
    await page
      .getByLabel(previous === 'tr' ? 'Uygulama dili' : 'Application language', { exact: true })
      .selectOption(language);
    const tr = JSON.parse(
      await readFile(join(process.cwd(), 'src/i18n/locales', language + '.json'), 'utf8'),
    );
    const title = `M3C ${language} synthetic acquisition`;
    const draft = {
      id: '',
      edition_id: null,
      title,
      author: 'M3C synthetic author',
      isbn10: '',
      isbn13: '',
      preference: 'Any',
      edition_description: '',
      priority: 'Medium',
      status: 'Wishing',
      target_minor: '2500',
      currency: 'TRY',
      notes: 'Keep private intention',
      archived: false,
      updated_at: '',
      retailers: [],
    };
    const saved = await invoke('wishlist_save', { draft });
    assert.equal(saved.saved, true);
    const initial = await snapshot();
    const originalWish = await invoke('wishlist_list');
    const active = await invoke('wishlist_active_count');
    await nav(language === 'tr' ? 'İstek listesi' : 'Wishlist');
    await page.getByLabel(tr['wishlist.search'], { exact: true }).fill(title);
    const card = page.locator('.wish-card').filter({ hasText: title });
    await card.waitFor();
    const add = card.getByRole('button', { name: tr['acquisition.add'], exact: true });
    await add.focus();
    await page.keyboard.press('Enter');
    let dialog = page.getByRole('dialog', { name: tr['acquisition.add'], exact: true });
    await dialog.waitFor();
    assert.equal(
      await dialog
        .getByLabel(tr['acquisition.editionChoice'])
        .evaluate((el) => el === document.activeElement),
      true,
    );
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    assert.equal(await add.evaluate((el) => el === document.activeElement), true);
    assert.deepEqual((await snapshot()).books, initial.books);
    await add.click();
    dialog = page.getByRole('dialog', { name: tr['acquisition.add'], exact: true });
    await dialog.getByLabel(tr['acquisition.editionChoice']).selectOption('new');
    await dialog
      .getByLabel(tr[aliases.Barcode], { exact: true })
      .fill('SyntheticLongBarcode'.repeat(20));
    await dialog.getByRole('button', { name: tr['acquisition.review'], exact: true }).click();
    await dialog.getByRole('heading', { name: tr['acquisition.confirmTitle'] }).waitFor();
    assert.deepEqual((await snapshot()).books, initial.books);
    assert.deepEqual(await invoke('wishlist_list'), originalWish);
    await dialog.getByRole('button', { name: tr['acquisition.back'], exact: true }).click();
    await dialog.getByRole('button', { name: tr['acquisition.review'], exact: true }).click();
    await dialog.getByRole('heading', { name: tr['acquisition.confirmTitle'] }).waitFor();
    await dialog.getByRole('button', { name: tr['ui.cancel'], exact: true }).click();
    const confirm = page.getByRole('dialog', { name: tr['ui.pleaseConfirm'], exact: true });
    await confirm.getByRole('button', { name: tr['ui.cancel'], exact: true }).click();
    await dialog.getByRole('heading', { name: tr['acquisition.confirmTitle'] }).waitFor();
    await page.keyboard.press('Escape');
    await confirm.getByRole('button', { name: tr['ui.continue'], exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });
    assert.deepEqual((await snapshot()).books, initial.books);
    assert.deepEqual(await invoke('wishlist_list'), originalWish);
    await add.click();
    dialog = page.getByRole('dialog', { name: tr['acquisition.add'], exact: true });
    await dialog.getByLabel(tr['acquisition.editionChoice']).selectOption('new');
    await dialog
      .getByLabel(tr[aliases.Barcode], { exact: true })
      .fill('SyntheticLongBarcode'.repeat(20));
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      assert.equal(
        await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
        true,
        'Review fields overflow',
      );
      assert.equal(
        await dialog.locator('.dialog-body').evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
        true,
        'Review body overflow',
      );
      await page.screenshot({
        path: join(runDir, `m3c-fields-${language}-${width}.png`),
        animations: 'disabled',
      });
    }
    await dialog.getByRole('button', { name: tr['acquisition.review'], exact: true }).click();
    await dialog.getByRole('heading', { name: tr['acquisition.confirmTitle'] }).waitFor();
    await page.setViewportSize({ width: 390, height: 800 });
    assert.equal(
      await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
      true,
      'Confirmation overflow',
    );
    assert.equal(
      await dialog.locator('.dialog-body').evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
      true,
      'Long confirmation values overflow',
    );
    assert.equal(
      await dialog.locator('footer').evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
      true,
      'Confirmation actions overflow',
    );
    await page.screenshot({
      path: join(runDir, `m3c-confirm-${language}.png`),
      animations: 'disabled',
    });
    await dialog
      .getByRole('button', { name: tr['acquisition.confirm'], exact: true })
      .evaluate((el) => {
        el.click();
        el.click();
      });
    await dialog.getByText(tr['acquisition.success'], { exact: true }).waitFor();
    const after = await snapshot();
    assert.equal(after.books.length, initial.books.length + 1);
    const copy = after.books.find((b) => !initial.books.some((old) => old.id === b.id));
    assert(copy);
    assert.equal(copy.title, title);
    assert.equal(copy.copy_extra.ownership, 'Owned');
    for (const book of initial.books)
      assert.deepEqual(
        after.books.find((b) => b.id === book.id),
        book,
      );
    const acquired = (await invoke('wishlist_list')).items.find((i) => i.draft.id === saved.id);
    assert.equal(acquired.acquisition.copy_id, copy.id);
    assert.equal(await invoke('wishlist_active_count'), active - 1);
    await dialog.getByRole('button', { name: tr['acquisition.viewCopy'], exact: true }).click();
    await page.locator('.detail-hero h1').filter({ hasText: title }).waitFor();
    await page.setViewportSize({ width: 1280, height: 800 });
    await nav(language === 'tr' ? 'İstek listesi' : 'Wishlist');
    await page.getByLabel(tr['wishlist.search'], { exact: true }).fill(title);
    await card.getByRole('button', { name: tr['acquisition.reopen'], exact: true }).click();
    await page
      .getByRole('dialog', { name: tr['ui.pleaseConfirm'], exact: true })
      .getByRole('button', { name: tr['ui.continue'], exact: true })
      .click();
    await card.getByRole('button', { name: tr['acquisition.add'], exact: true }).waitFor();
    await page.waitForFunction(
      (id) => document.getElementById('wish-' + id)?.contains(document.activeElement),
      saved.id,
    );
    assert.deepEqual((await snapshot()).books, after.books);
    assert.equal(await invoke('wishlist_active_count'), active);
    // Same wish can deliberately acquire another independent Copy of a chosen Edition.
    await add.click();
    dialog = page.getByRole('dialog', { name: tr['acquisition.add'], exact: true });
    await dialog.getByLabel(tr['acquisition.editionChoice']).selectOption('existing');
    await dialog.getByLabel(tr['wishlist.search'], { exact: true }).fill(title);
    await dialog.getByRole('button', { name: tr['wishlist.findEdition'], exact: true }).click();
    await dialog.getByRole('radio').check();
    await dialog.getByRole('button', { name: tr['acquisition.review'], exact: true }).click();
    await dialog.getByRole('heading', { name: tr['acquisition.confirmTitle'] }).waitFor();
    await dialog.getByRole('button', { name: tr['acquisition.confirm'], exact: true }).click();
    await dialog.getByText(tr['acquisition.success'], { exact: true }).waitFor();
    const second = await snapshot();
    assert.equal(second.books.length, after.books.length + 1);
    for (const book of after.books)
      assert.deepEqual(
        second.books.find((b) => b.id === book.id),
        book,
      );
    assert.equal(second.books.filter((b) => b.edition_id === copy.edition_id).length, 2);
    await dialog
      .locator('footer')
      .getByRole('button', { name: tr['ui.closeDialog'], exact: true })
      .click();
    await page.waitForFunction(
      (id) => document.getElementById('wish-' + id)?.contains(document.activeElement),
      saved.id,
    );
    const linked = (await invoke('wishlist_list')).items.find((i) => i.draft.id === saved.id)
      .acquisition.copy_id;
    await invoke('trash', { ids: [linked] });
    await card.getByRole('button', { name: tr['acquisition.viewCopy'], exact: true }).click();
    await page.locator('.detail-hero h1').filter({ hasText: title }).waitFor();
    assert((await invoke('snapshot', { trash: true })).books.some((b) => b.id === linked));
  }
  return await invoke('wishlist_list');
}
