export interface Field {
  key: string;
  label: string;
  type?: 'number' | 'date' | 'checkbox' | 'textarea' | 'select';
  options?: string[];
}
export const editionFields: Record<string, Field[]> = {
  General: [
    { key: 'original_title', label: 'Original title' },
    { key: 'synopsis', label: 'Synopsis', type: 'textarea' },
    { key: 'personal_description', label: 'Personal description', type: 'textarea' },
    { key: 'keywords', label: 'Keywords' },
  ],
  Publication: [
    { key: 'original_publication_year', label: 'Original publication year', type: 'number' },
    { key: 'edition', label: 'Edition' },
    { key: 'printing', label: 'Printing / impression' },
    { key: 'original_language', label: 'Original language' },
    {
      key: 'binding',
      label: 'Binding',
      type: 'select',
      options: ['Hardcover', 'Paperback', 'Leather', 'Spiral', 'Other'],
    },
    { key: 'format', label: 'Format' },
    { key: 'dimensions', label: 'Dimensions (with units)' },
    { key: 'weight', label: 'Weight (with units)' },
  ],
  Classification: [
    { key: 'dewey', label: 'Dewey Decimal Classification' },
    { key: 'personal_classification', label: 'Personal classification' },
  ],
};
export const copyFields: Record<string, Field[]> = {
  Reading: [
    { key: 'date_started', label: 'Date started', type: 'date' },
    { key: 'date_finished', label: 'Date finished', type: 'date' },
    { key: 'times_read', label: 'Times read', type: 'number' },
    { key: 'priority', label: 'Priority', type: 'select', options: ['Low', 'Normal', 'High'] },
    { key: 'review', label: 'Review', type: 'textarea' },
    { key: 'reading_notes', label: 'Reading notes', type: 'textarea' },
  ],
  Ownership: [
    {
      key: 'ownership',
      label: 'Ownership status',
      type: 'select',
      options: ['Owned', 'Borrowed', 'Wishlist', 'Previously owned'],
    },
    { key: 'seller', label: 'Store / seller' },
    { key: 'purchase_price', label: 'Purchase price', type: 'number' },
    { key: 'currency', label: 'Currency' },
    { key: 'original_price', label: 'Original price', type: 'number' },
    { key: 'gift', label: 'Gift', type: 'checkbox' },
    { key: 'gifted_by', label: 'Gifted by' },
    { key: 'acquisition_notes', label: 'Acquisition notes', type: 'textarea' },
    { key: 'receipt', label: 'Receipt / reference' },
  ],
  Location: [
    { key: 'shelf_position', label: 'Shelf position' },
    { key: 'location_note', label: 'Location note', type: 'textarea' },
  ],
  Physical: [
    { key: 'signed', label: 'Signed copy', type: 'checkbox' },
    { key: 'first_edition', label: 'First edition', type: 'checkbox' },
    { key: 'special_edition', label: 'Special edition', type: 'checkbox' },
    { key: 'numbered_edition', label: 'Numbered edition' },
    { key: 'dust_jacket', label: 'Dust jacket', type: 'checkbox' },
    { key: 'condition_notes', label: 'Condition notes', type: 'textarea' },
  ],
  Notes: [
    { key: 'personal_notes', label: 'Personal notes', type: 'textarea' },
    { key: 'spoiler_notes', label: 'Spoiler notes', type: 'textarea' },
  ],
};
