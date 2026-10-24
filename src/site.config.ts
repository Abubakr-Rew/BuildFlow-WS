/**
 * Site settings: address, contacts, prefilled messages and optional author info.
 * Every value marked TODO is a placeholder. Replace it before publishing;
 * the build prints a warning while placeholders are still in place.
 */
export interface SiteConfig {
  siteName: string;
  /** Final public address, without a trailing slash. A path is allowed (GitHub Pages). */
  siteUrl: string;
  /** Telegram username without the @. */
  telegramUsername: string;
  /** WhatsApp number in international format, digits only: 996 and 9 digits. */
  whatsappNumber: string;
  email: string;
  /** Texts prefilled in Telegram and WhatsApp when a visitor taps a button. */
  messages: {
    pilot: string;
    interview: string;
  };
  /** Optional. An empty value hides that part of the "О проекте" section. */
  author: {
    name: string;
    /** Path to a square photo inside public/, for example '/author.jpg'. */
    photo: string;
  };
}

export const siteConfig: SiteConfig = {
  siteName: 'BuildBetter',
  siteUrl: 'https://example.com', // TODO: real site address after deploying
  telegramUsername: 'buildbetter_todo', // TODO: real Telegram username
  whatsappNumber: '996000000000', // TODO: real WhatsApp number
  email: 'todo@example.com', // TODO: real contact email
  messages: {
    pilot: 'Здравствуйте! Хочу бесплатный пилот BuildBetter.',
    interview: 'Здравствуйте! Готов поговорить о BuildBetter.',
  },
  author: {
    name: '', // TODO: optional author name
    photo: '', // TODO: optional author photo, e.g. '/author.jpg'
  },
};

/** Names of contact settings that still hold placeholder values. */
export function unfilledSettings(config: SiteConfig = siteConfig): string[] {
  const placeholder = /example\.com|todo|^9960+$/i;
  const fields = {
    siteUrl: config.siteUrl,
    telegramUsername: config.telegramUsername,
    whatsappNumber: config.whatsappNumber,
    email: config.email,
  };
  return Object.entries(fields)
    .filter(([, value]) => placeholder.test(value))
    .map(([name]) => name);
}
