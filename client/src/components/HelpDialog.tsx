import { useId, useRef, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { UI_STRINGS } from "../i18n";
import { supportPresentation } from "../support";
import { FeedbackRow } from "./FeedbackRow";

export function HelpDialog() {
  const { locale, clearSavedFarm } = useAppContext();
  const t = UI_STRINGS[locale];
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [deleted, setDeleted] = useState(false);
  const support = supportPresentation(import.meta.env.VITE_SUPPORT_CONTACT);

  return (
    <>
      <button type="button" className="pill-button" onClick={() => dialogRef.current?.showModal()}>
        {t.helpTitle}
      </button>
      <dialog ref={dialogRef} className="help-dialog" aria-labelledby={titleId}>
          <h2 id={titleId}>{t.helpTitle}</h2>
          <p>{t.helpBody}</p>
          <h3>{t.privacyTitle}</h3>
          <p>{t.privacyBody}</p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              clearSavedFarm();
              setDeleted(true);
            }}
          >
            {t.deleteProfile}
          </button>
          {deleted && (
            <p role="status" className="feedback-note">
              {t.profileDeleted}
            </p>
          )}
          <h3>{t.supportTitle}</h3>
          {support.kind === "missing" ? (
            <p>{t.supportMissing}</p>
          ) : support.kind === "link" ? (
            <p>
              <a href={support.href}>{support.label}</a>
            </p>
          ) : (
            <p>{support.label}</p>
          )}
          <h3>{t.feedbackTitle}</h3>
          <FeedbackRow context="web" locale={locale} />
          <div className="onboarding-actions">
            <button type="button" className="btn-primary" onClick={() => dialogRef.current?.close()}>
              {t.close}
            </button>
          </div>
        </dialog>
    </>
  );
}
