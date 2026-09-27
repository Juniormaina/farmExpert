import { useEffect, useState } from "react";

export function formatClock(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function useClock(): string {
  const [now, setNow] = useState(() => formatClock(new Date()));
  useEffect(() => {
    const timer = setInterval(() => setNow(formatClock(new Date())), 15000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

export function PhoneStatusBar({ dark = false }: { dark?: boolean }) {
  const time = useClock();
  return (
    <div className={`status-bar ${dark ? "dark" : ""}`} aria-hidden="true">
      <span className="status-time">{time}</span>
      <span className="status-icons">
        <span className="signal">
          <i />
          <i />
          <i />
          <i />
        </span>
        <span className="battery">
          <i />
        </span>
      </span>
    </div>
  );
}
