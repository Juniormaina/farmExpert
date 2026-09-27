import type { Locale } from "../types";

interface Props {
  source: "live" | "cache" | "bundled";
  cachedAt?: string;
  locale: Locale;
}

export function SourceTag({ source, cachedAt, locale }: Props) {
  const time = cachedAt ? new Date(cachedAt).toLocaleString() : "";
  const text =
    source === "live"
      ? locale === "sw" ? "Chanzo: seva ya moja kwa moja" : "Source: live server"
      : source === "cache"
        ? locale === "sw" ? `Chanzo: iliyohifadhiwa kwenye kifaa (${time})` : `Source: saved on this device (${time})`
        : locale === "sw" ? "Chanzo: data ya mfano iliyo ndani ya programu" : "Source: sample data built into the app";
  return <p className="source-tag">{text}</p>;
}
