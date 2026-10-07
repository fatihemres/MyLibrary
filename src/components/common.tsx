import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { BookOpen, X } from 'lucide-react';
import type { Book } from '../domain/types';
import { api } from '../services/api';
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const el = ref.current;
    const previous = document.activeElement as HTMLElement;
    el?.showModal();
    return () => {
      el?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={wide ? 'modal wide' : 'modal'}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <header>
        <h2 id={titleId}>{title}</h2>
        <button className="icon" onClick={onClose} aria-label="Close dialog">
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
const cache = new Map<string, string>();
export function Cover({
  book,
  large = false,
}: {
  book: Pick<Book, 'cover' | 'title'>;
  large?: boolean;
}) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    let active = true;
    setUrl('');
    if (book.cover) {
      const known = cache.get(book.cover);
      if (known) setUrl(known);
      else
        api<number[]>('read_cover', { path: book.cover })
          .then((bytes) => {
            const u = URL.createObjectURL(new Blob([new Uint8Array(bytes)]));
            cache.set(book.cover, u);
            if (active) setUrl(u);
          })
          .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [book.cover]);
  return (
    <div className={`cover ${large ? 'large' : ''}`}>
      {url ? (
        <img src={url} alt={`Cover of ${book.title}`} />
      ) : (
        <>
          <BookOpen size={large ? 44 : 28} />
          <span>{book.title || 'Your next book'}</span>
          <i>MY LIBRARY</i>
        </>
      )}
    </div>
  );
}
export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <BookOpen size={40} />
      <h3>{title}</h3>
      {children}
    </div>
  );
}
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function Confirm({
  title,
  children,
  onYes,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onYes: () => void;
  onClose: () => void;
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <div className="dialog-body">{children}</div>
      <footer>
        <button onClick={onClose}>Cancel</button>
        <button className="danger" onClick={onYes}>
          Confirm
        </button>
      </footer>
    </Modal>
  );
}
