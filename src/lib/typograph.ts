const NBSP = ' ';

// A short word (preposition, conjunction, particle) or a number such as "2" or "20–30",
// followed by an ordinary space. The lookbehind leaves the preceding space unconsumed,
// so runs like "на 2 недели" are all bound in one pass.
const SHORT_WORD = /(?<=^|[\s«("])([а-яё]{1,2}|\d+(?:[–-]\d+)?) +/giu;

/**
 * Russian line-break rules: short words and numbers stay on the same line as
 * the next word, and a dash never starts a line.
 */
export function typograph(text: string): string {
  return text.replace(SHORT_WORD, `$1${NBSP}`).replace(/\s+—/g, `${NBSP}—`);
}

/** Applies typograph() to every string in a nested object or array. */
export function typographAll<T>(value: T): T {
  if (typeof value === 'string') return typograph(value) as T;
  if (Array.isArray(value)) return value.map((item) => typographAll(item)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, typographAll(item)]),
    ) as T;
  }
  return value;
}
