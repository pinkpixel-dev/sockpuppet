import "./Toolbar.css";

const INTERVAL_LABELS = {
  2000: "2s",
  5000: "5s",
  10000: "10s",
  30000: "30s",
};

function Toolbar({
  filter,
  onFilterChange,
  protocolFilter,
  onProtocolChange,
  stateFilter,
  onStateChange,
  refreshInterval,
  onRefreshIntervalChange,
  intervals,
  isPaused,
  onTogglePause,
  onRefreshNow,
  pulseKey,
  resultCount,
  totalCount,
}) {
  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <div className="search-wrap">
          <span className="search-icon">⌕</span>
          <input
            className="search-input"
            type="text"
            placeholder="Filter by port, process, address..."
            value={filter}
            onChange={e => onFilterChange(e.target.value)}
            spellCheck={false}
          />
          {filter && (
            <button className="search-clear" onClick={() => onFilterChange("")}>✕</button>
          )}
        </div>

        <div className="filter-group">
          {["ALL", "TCP", "UDP"].map(p => (
            <button
              key={p}
              className={`filter-btn ${protocolFilter === p ? "active" : ""}`}
              onClick={() => onProtocolChange(p)}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="filter-group">
          {["ALL", "LISTEN", "ESTABLISHED", "TIME_WAIT"].map(s => (
            <button
              key={s}
              className={`filter-btn filter-btn--state ${stateFilter === s ? "active" : ""} ${s !== "ALL" ? `state-${s.toLowerCase().replace("_", "-")}` : ""}`}
              onClick={() => onStateChange(s)}
            >
              {s === "ALL" ? "ALL STATES" : s}
            </button>
          ))}
        </div>
      </div>

      <div className="toolbar-right">
        {resultCount !== totalCount && (
          <span className="result-count">
            {resultCount} / {totalCount}
          </span>
        )}

        <div className="interval-group">
          {intervals.map(iv => (
            <button
              key={iv}
              className={`filter-btn ${refreshInterval === iv ? "active" : ""}`}
              onClick={() => onRefreshIntervalChange(iv)}
              title={`Refresh every ${INTERVAL_LABELS[iv]}`}
            >
              {INTERVAL_LABELS[iv]}
            </button>
          ))}
        </div>

        <button
          className={`icon-btn ${isPaused ? "icon-btn--accent" : ""}`}
          onClick={onTogglePause}
          title={isPaused ? "Resume auto-refresh" : "Pause auto-refresh"}
        >
          {isPaused ? "▶" : "⏸"}
        </button>

        <button
          className="icon-btn pulse-btn"
          onClick={onRefreshNow}
          title="Refresh now"
          key={pulseKey}
        >
          ↻
        </button>
      </div>
    </div>
  );
}

export default Toolbar;
