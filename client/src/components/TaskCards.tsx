import { useAppContext } from "../context/AppContext";
import { UI_STRINGS } from "../i18n";

const TASKS = [
  { id: "crops", mark: "01", title: "taskCrop", body: "taskCropBody", action: "actionExplore" },
  { id: "markets", mark: "02", title: "taskMarket", body: "taskMarketBody", action: "actionPrices" },
  { id: "fertilizer", mark: "03", title: "taskFertilizer", body: "taskFertilizerBody", action: "actionCompare" },
  { id: "budget", mark: "04", title: "taskBudget", body: "taskBudgetBody", action: "actionCalculate" }
] as const;

export function TaskCards() {
  const { locale, setChannel } = useAppContext();
  const t = UI_STRINGS[locale];

  function open(id: string) {
    setChannel("web");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(() => {
      const target = document.getElementById(id);
      target?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      if (id === "ask") document.getElementById("ask-input")?.focus();
      else target?.focus({ preventScroll: true });
    }, 0);
  }

  return (
    <section className="task-section" id="tasks" aria-labelledby="task-heading">
      <h2 id="task-heading">{t.taskHeading}</h2>
      <div className="task-grid">
        {TASKS.map((task) => (
          <button key={task.id} type="button" className="task-card" onClick={() => open(task.id)}>
            <span className="task-mark" aria-hidden="true">
              {task.mark}
            </span>
            <span className="task-copy">
              <span className="task-title">{t[task.title]}</span>
              <span className="task-hint">{t[task.body]}</span>
            </span>
            <span className="task-go">
              {t[task.action]}
              <span aria-hidden="true"> →</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
