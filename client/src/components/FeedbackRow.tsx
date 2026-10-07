import { useState } from "react";
import { sendFeedback } from "../api/client";
import { UI_STRINGS } from "../i18n";
import type { Locale } from "../types";

export function FeedbackRow({ context, locale }: { context: "web" | "sms" | "ussd" | "budget" | "fertilizer" | "prices"; locale: Locale }) {
  const t = UI_STRINGS[locale];
  const [sent, setSent] = useState(false);
  const [askWhy, setAskWhy] = useState(false);
  const [comment, setComment] = useState("");
  const [note, setNote] = useState("");

  async function submit(rating: "helpful" | "not_helpful", text?: string) {
    try {
      await sendFeedback({ rating, comment: text?.trim() || undefined, context });
      setSent(true);
      setNote(t.feedbackThanks);
    } catch {
      setNote(t.feedbackFailed);
    }
  }

  if (sent) {
    return (
      <p className="feedback-note" role="status">
        {note}
      </p>
    );
  }

  return (
    <div className="feedback-row">
      <p className="feedback-prompt">{t.feedbackPrompt}</p>
      <div className="feedback-actions">
        <button type="button" className="btn-secondary" onClick={() => submit("helpful")}>
          {t.feedbackHelpful}
        </button>
        <button type="button" className="btn-secondary" onClick={() => setAskWhy(true)}>
          {t.feedbackNot}
        </button>
      </div>
      {askWhy && (
        <form
          className="feedback-why"
          onSubmit={(event) => {
            event.preventDefault();
            submit("not_helpful", comment);
          }}
        >
          <label htmlFor={`feedback-${context}`}>
            {t.feedbackComment}
            <textarea id={`feedback-${context}`} maxLength={280} value={comment} onChange={(event) => setComment(event.target.value)} />
          </label>
          <button type="submit" className="btn-primary">
            {t.send}
          </button>
        </form>
      )}
      {note && (
        <p className="feedback-note" role="status">
          {note}
        </p>
      )}
    </div>
  );
}
