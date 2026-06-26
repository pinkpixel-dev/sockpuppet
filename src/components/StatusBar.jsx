import { useState, useEffect } from "react";
import "./StatusBar.css";

function formatTime(date) {
  if (!date) return "—";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function StatusBar({ lastRefresh, isPaused, refreshInterval, totalCount }) {
  const [, setTick] = useState(0);

  // Re-render every second so "last refresh" feels live
  useEffect(() => {
    const t = setInterval(() => setTick(k => k + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const secondsAgo = lastRefresh
    ? Math.floor((Date.now() - lastRefresh.getTime()) / 1000)
    : null;

  return (
    <div className="status-bar">
      <div className="status-left">
        <span className={`status-dot ${isPaused ? "status-dot--paused" : "status-dot--live"}`} />
        <span className="status-text">
          {isPaused ? "Paused" : `Refreshing every ${refreshInterval / 1000}s`}
        </span>
      </div>

      <div className="status-right">
        <span className="status-text">
          {totalCount} connection{totalCount !== 1 ? "s" : ""}
        </span>
        <span className="status-divider">·</span>
        <span className="status-text">
          Last update:{" "}
          {secondsAgo !== null
            ? secondsAgo < 5
              ? "just now"
              : `${secondsAgo}s ago`
            : "—"}
        </span>
        <span className="status-divider">·</span>
        <span className="status-text">{formatTime(lastRefresh)}</span>
      </div>
    </div>
  );
}

export default StatusBar;
