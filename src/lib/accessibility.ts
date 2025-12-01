/**
 * Accessibility helpers for client-side enhancements.
 *
 * Exposes a simple focus trap utility so modal dialogs keep
 * keyboard focus constrained while open. Returns a cleanup fn
 * to remove the listeners when the modal closes.
 */
export type FocusTrapCleanup = () => void;

const FOCUSABLE_SELECTOR = [
  'a[href]','button','textarea','input','select',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

export function trapFocus(element: HTMLElement | null): FocusTrapCleanup {
  if (!element) {
    return () => {};
  }

  const focusable = Array.from(
    element.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  ).filter((node) => !node.hasAttribute('disabled'));

  if (focusable.length === 0) {
    return () => {};
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    if (event.shiftKey) {
      if (document.activeElement === first) {
        last.focus();
        event.preventDefault();
      }
    } else {
      if (document.activeElement === last) {
        first.focus();
        event.preventDefault();
      }
    }
  };

  element.addEventListener('keydown', handleKeyDown);

  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}
