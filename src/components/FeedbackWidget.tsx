import { useState } from "react";

type FeedbackCategory = "idea" | "confusing" | "bug" | "other";
type SubmissionState = "idle" | "sending" | "sent" | "error";

const LAST_SENT_KEY = "minis-mini-arena-simulator:last-feedback";
const COOLDOWN_MS = 60_000;

function acquisitionValue(name: string): string {
  return new URLSearchParams(window.location.search).get(name) ?? "";
}

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>("idea");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<SubmissionState>("idle");
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanMessage = message.trim();
    if (cleanMessage.length < 10) {
      setError("Tell us a little more (at least 10 characters).");
      return;
    }

    try {
      const lastSent = Number(localStorage.getItem(LAST_SENT_KEY) ?? 0);
      if (Date.now() - lastSent < COOLDOWN_MS) {
        setError("Thanks — wait a minute before sending another suggestion.");
        return;
      }
    } catch {
      // Feedback still works when browser storage is disabled.
    }

    setState("sending");
    setError("");
    try {
      const endpoint = new URL("./api/feedback", window.location.href);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "omit",
        body: JSON.stringify({
          category,
          message: cleanMessage,
          website,
          page: window.location.pathname,
          source: acquisitionValue("utm_source"),
          campaign: acquisitionValue("utm_campaign"),
        }),
      });
      if (!response.ok) throw new Error("Feedback could not be sent.");
      try {
        localStorage.setItem(LAST_SENT_KEY, String(Date.now()));
      } catch {
        // The success state is enough when storage is unavailable.
      }
      setMessage("");
      setState("sent");
    } catch {
      setState("error");
      setError("Could not send it right now. Please try again later.");
    }
  };

  if (!open) {
    return <button type="button" className="feedback-launcher" onClick={() => setOpen(true)}>Feedback</button>;
  }

  return (
    <aside className="feedback-widget" aria-label="Beta feedback">
      <div className="feedback-heading">
        <div><span>BETA FEEDBACK</span><strong>Help shape the next update</strong></div>
        <button type="button" aria-label="Close feedback" onClick={() => setOpen(false)}>×</button>
      </div>

      {state === "sent" ? (
        <div className="feedback-success" role="status">
          <strong>Suggestion received.</strong>
          <p>We review useful ideas and implement them with gameplay and privacy in mind.</p>
          <button type="button" className="small-button" onClick={() => { setState("idle"); setOpen(false); }}>Done</button>
        </div>
      ) : (
        <form onSubmit={(event) => void submit(event)}>
          <p>This beta is being actively tested. Tell us what feels confusing, missing, or worth improving.</p>
          <label>
            Type
            <select value={category} onChange={(event) => setCategory(event.target.value as FeedbackCategory)}>
              <option value="idea">Suggestion</option>
              <option value="confusing">Something is unclear</option>
              <option value="bug">Bug</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            Message
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={800}
              rows={5}
              placeholder="Example: make cast bars move like the in-game frames…"
              required
            />
          </label>
          <label className="feedback-honeypot" aria-hidden="true">
            Website
            <input value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" />
          </label>
          <div className="feedback-meta"><span>Don't include personal information.</span><span>{message.length}/800</span></div>
          {error && <p className="feedback-error" role="alert">{error}</p>}
          <button type="submit" className="primary-button" disabled={state === "sending"}>
            {state === "sending" ? "Sending…" : "Send feedback"}
          </button>
        </form>
      )}
    </aside>
  );
}
