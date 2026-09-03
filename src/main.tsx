import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { initializeAnalytics } from "./analytics";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import { redirectToCanonicalDeployment } from "./deployment";
import "./styles.css";

const redirecting = redirectToCanonicalDeployment();

if (!redirecting) {
  const showingStats = new URLSearchParams(window.location.search).has("stats");
  if (!showingStats) initializeAnalytics();

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      {showingStats ? <AnalyticsDashboard /> : <App />}
    </StrictMode>,
  );
}
