import type { Locale } from "../types";

interface Props {
  source: "live" | "cache" | "bundled";
  cachedAt?: string;
  locale: Locale;
}

export function SourceTag({ source, cachedAt, locale }: Props) {
  const parsed = cachedAt ? new Date(cachedAt) : undefined;
  const time = parsed && !Number.isNaN(parsed.getTime()) ? parsed.toLocaleString() : "";
  const text =
    source === "live"
      ? locale === "sw"
        ? "Bei za mfano, zimepakiwa kutoka kwa Farm Expert."
        : "Demo prices, loaded from Farm Expert."
      : source === "cache"
        ? locale === "sw"
          ? `Bei za mfano, zimehifadhiwa kwenye kifaa hiki${time ? ` (${time})` : ""}.`
          : `Demo prices, saved on this device${time ? ` (${time})` : ""}.`
        : locale === "sw"
          ? "Bei za mfano zilizopo ndani ya programu."
          : "Demo prices saved in the app.";
  return <p className="source-tag">{text}</p>;
}
