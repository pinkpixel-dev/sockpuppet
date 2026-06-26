import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import ConnectionTable from "./components/ConnectionTable";
import Toolbar from "./components/Toolbar";
import KillModal from "./components/KillModal";
import StatusBar from "./components/StatusBar";
import "./App.css";
import logo from "./assets/logo.png";


const REFRESH_INTERVALS = [2000, 5000, 10000, 30000];
const DEFAULT_INTERVAL = 5000;

const KNOWN_PORTS = {
  21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP",
  53: "DNS", 80: "HTTP", 443: "HTTPS", 3000: "Dev",
  3306: "MySQL", 5173: "Vite", 5432: "Postgres",
  6379: "Redis", 8080: "HTTP-Alt", 8443: "HTTPS-Alt",
  27017: "MongoDB", 9000: "PHP-FPM", 4000: "Dev-Alt",
  9090: "Prometheus", 9200: "Elasticsearch",
};

function App() {
  const [connections, setConnections] = useState([]);
  const [filter, setFilter] = useState("");
  const [protocolFilter, setProtocolFilter] = useState("ALL");
  const [stateFilter, setStateFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(DEFAULT_INTERVAL);
  const [isPaused, setIsPaused] = useState(false);
  const [killTarget, setKillTarget] = useState(null);
  const [pulseKey, setPulseKey] = useState(0);
  const [customLabels, setCustomLabels] = useState(() => {
    try {
      const saved = localStorage.getItem("sockpuppet_port_labels");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const intervalRef = useRef(null);

  const saveCustomLabel = useCallback((port, label) => {
    setCustomLabels(prev => {
      const next = { ...prev };
      if (label && label.trim()) {
        next[port] = label.trim();
      } else {
        delete next[port];
      }
      localStorage.setItem("sockpuppet_port_labels", JSON.stringify(next));
      return next;
    });
  }, []);


  const fetchConnections = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const data = await invoke("get_connections");
      setConnections(data);
      setLastRefresh(new Date());
      setError(null);
      setPulseKey(k => k + 1);
    } catch (err) {
      setError(String(err));
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchConnections(true);
  }, [fetchConnections]);

  // Auto-refresh
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!isPaused) {
      intervalRef.current = setInterval(() => fetchConnections(false), refreshInterval);
    }
    return () => clearInterval(intervalRef.current);
  }, [refreshInterval, isPaused, fetchConnections]);

  const handleKillRequest = useCallback((conn) => {
    setKillTarget(conn);
  }, []);

  const handleKillConfirm = useCallback(async () => {
    if (!killTarget?.pid) return;
    try {
      await invoke("kill_process", { pid: killTarget.pid });
      setKillTarget(null);
      await fetchConnections(false);
    } catch (err) {
      setError(String(err));
      setKillTarget(null);
    }
  }, [killTarget, fetchConnections]);

  const filteredConnections = connections.filter(conn => {
    const q = filter.toLowerCase();
    const matchesSearch =
      !q ||
      String(conn.local_port).includes(q) ||
      (conn.process_name?.toLowerCase().includes(q)) ||
      (conn.local_addr?.toLowerCase().includes(q)) ||
      (conn.state?.toLowerCase().includes(q)) ||
      (KNOWN_PORTS[conn.local_port]?.toLowerCase().includes(q));

    const matchesProtocol =
      protocolFilter === "ALL" ||
      conn.protocol.startsWith(protocolFilter);

    const matchesState =
      stateFilter === "ALL" ||
      conn.state === stateFilter;

    return matchesSearch && matchesProtocol && matchesState;
  });

  const enrichedConnections = filteredConnections.map(conn => {
    const customLabel = customLabels[conn.local_port];
    return {
      ...conn,
      service: customLabel || KNOWN_PORTS[conn.local_port] || null,
      isCustomLabel: !!customLabel,
    };
  });

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">
          <img src={logo} className="app-logo" alt="logo" />
          <span className="app-name">sockpuppet</span>
        </div>
        <div className="app-subtitle">port &amp; process monitor</div>
      </header>

      <Toolbar
        filter={filter}
        onFilterChange={setFilter}
        protocolFilter={protocolFilter}
        onProtocolChange={setProtocolFilter}
        stateFilter={stateFilter}
        onStateChange={setStateFilter}
        refreshInterval={refreshInterval}
        onRefreshIntervalChange={setRefreshInterval}
        intervals={REFRESH_INTERVALS}
        isPaused={isPaused}
        onTogglePause={() => setIsPaused(p => !p)}
        onRefreshNow={() => fetchConnections(false)}
        pulseKey={pulseKey}
        resultCount={enrichedConnections.length}
        totalCount={connections.length}
      />

      <main className="app-main">
        {loading ? (
          <div className="state-empty">
            <div className="spinner" />
            <span>Scanning connections...</span>
          </div>
        ) : error ? (
          <div className="state-empty state-error">
            <span className="state-icon">⚠</span>
            <span>{error}</span>
            <button className="btn-retry" onClick={() => fetchConnections(true)}>Retry</button>
          </div>
        ) : enrichedConnections.length === 0 ? (
          <div className="state-empty">
            <span className="state-icon">🔍</span>
            <span>No connections match your filter</span>
          </div>
        ) : (
          <ConnectionTable
            connections={enrichedConnections}
            onKillRequest={handleKillRequest}
            onSaveLabel={saveCustomLabel}
          />
        )}
      </main>

      <StatusBar
        lastRefresh={lastRefresh}
        isPaused={isPaused}
        refreshInterval={refreshInterval}
        totalCount={connections.length}
      />

      {killTarget && (
        <KillModal
          connection={killTarget}
          onConfirm={handleKillConfirm}
          onCancel={() => setKillTarget(null)}
        />
      )}
    </div>
  );
}

export default App;
