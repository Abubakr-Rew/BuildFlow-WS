const NBSP = ' ';

// A short word (preposition, conjunction, particle) or a number such as "2" or "20–30".
const SHORT_WORD = /(^|[\s«("])([а-яё]{1,2}|\d+(?:[–-]\d+)?)\s+/giu;

/**
 * Russian line-break rules: short words and numbers stay on the same line as
 * the next word, and a dash never starts a line.
 */
export function typograph(text: string): string {
  let result = text;
  let previous: string;
  // Repeat for runs of short words ("и в", "а то").
  do {
    previous = result;
    result = result.replace(SHORT_WORD, `$1$2${NBSP}`);
  } while (result !== previous);
  return result.replace(/\s+—/g, `${NBSP}—`);
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
