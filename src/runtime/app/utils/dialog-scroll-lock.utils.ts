/** Each document owns its locks so closing one cropper cannot unlock another. */
const scrollLocks = new WeakMap<Document, { count: number; overflow: string; priority: string }>();

/** Locks page scrolling until the returned, idempotent cleanup releases the last dialog. */
export function lockDialogScroll(ownerDocument: Document): () => void {
  const style = ownerDocument.documentElement.style;
  let lock = scrollLocks.get(ownerDocument);

  // Preserve inline values, including !important, instead of assuming the page was unlocked.
  if (!lock) {
    lock = {
      count: 0,
      overflow: style.getPropertyValue("overflow"),
      priority: style.getPropertyPriority("overflow"),
    };
    scrollLocks.set(ownerDocument, lock);
    style.setProperty("overflow", "hidden", "important");
  }

  lock.count++;
  let released = false;

  return () => {
    // Native close events and component disposal may both request cleanup.
    if (released) return;
    released = true;
    lock.count--;

    if (lock.count === 0) {
      style.setProperty("overflow", lock.overflow, lock.priority);
      scrollLocks.delete(ownerDocument);
    }
  };
}
