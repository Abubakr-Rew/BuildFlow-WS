import { siteConfig } from '../site.config';

const digitsOnly = (value: string) => value.replace(/\D/g, '');

// Both messengers read a URL-encoded `text` parameter as the draft message.
const withText = (url: string, text?: string) =>
  text ? `${url}?text=${encodeURIComponent(text)}` : url;

/** https://t.me/<username>?text=<message> */
export const telegramUrl = (text?: string) =>
  withText(`https://t.me/${siteConfig.telegramUsername.replace(/^@/, '')}`, text);

/** https://wa.me/<number>?text=<message>, the number without "+" or separators. */
export const whatsappUrl = (text?: string) =>
  withText(`https://wa.me/${digitsOnly(siteConfig.whatsappNumber)}`, text);

export const emailUrl = (subject?: string) =>
  subject
    ? `mailto:${siteConfig.email}?subject=${encodeURIComponent(subject)}`
    : `mailto:${siteConfig.email}`;

/** Readable phone number: +996 555 123 456 for Kyrgyz numbers, +<digits> otherwise. */
export function formatPhone(value: string): string {
  const digits = digitsOnly(value);
  const kg = /^996(\d{3})(\d{3})(\d{3})$/.exec(digits);
  return kg ? `+996 ${kg[1]} ${kg[2]} ${kg[3]}` : `+${digits}`;
}

/** Every outgoing contact link on the page, built from site.config.ts. */
export const contactLinks = {
  pilot: {
    telegram: telegramUrl(siteConfig.messages.pilot),
    whatsapp: whatsappUrl(siteConfig.messages.pilot),
  },
  interview: {
    telegram: telegramUrl(siteConfig.messages.interview),
    whatsapp: whatsappUrl(siteConfig.messages.interview),
  },
  telegram: telegramUrl(),
  whatsapp: whatsappUrl(),
  email: emailUrl(siteConfig.siteName),
};
