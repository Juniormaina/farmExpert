export type SupportPresentation =
  | { kind: "missing" }
  | { kind: "link"; href: string; label: string }
  | { kind: "text"; label: string };

/** Turns a configured support route into a link when it is an email or a phone number. */
export function supportPresentation(contact: string | undefined): SupportPresentation {
  const value = contact?.trim() ?? "";
  if (!value) return { kind: "missing" };
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return { kind: "link", href: `mailto:${value}`, label: value };
  }
  const compact = value.replace(/[\s()-]/g, "");
  if (/^\+?[0-9]{8,15}$/.test(compact)) {
    return { kind: "link", href: `tel:${compact}`, label: value };
  }
  return { kind: "text", label: value };
}
