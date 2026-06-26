import "./ConnectionTable.css";

const STATE_CLASS = {
  LISTEN: "state-listen",
  ESTABLISHED: "state-established",
  TIME_WAIT: "state-time-wait",
  CLOSE_WAIT: "state-other",
  SYN_SENT: "state-other",
  SYN_RECV: "state-other",
  FIN_WAIT1: "state-other",
  FIN_WAIT2: "state-other",
  CLOSING: "state-other",
  UNKNOWN: "state-other",
};

function StateChip({ state }) {
  const cls = STATE_CLASS[state] || "state-other";
  return (
    <span className={`state-chip ${cls}`}>{state}</span>
  );
}

function ConnectionRow({ conn, onKillRequest }) {
  const hasRemote = conn.remote_addr && conn.remote_port;

  return (
    <tr className="conn-row">
      <td className="col-port">
        <span className="port-number">{conn.local_port}</span>
        {conn.service && (
          <span className="port-service">{conn.service}</span>
        )}
      </td>
      <td className="col-proto">
        <span className="proto-badge">{conn.protocol}</span>
      </td>
      <td className="col-local">
        <span className="addr-text">{conn.local_addr || "0.0.0.0"}</span>
      </td>
      <td className="col-remote">
        {hasRemote ? (
          <span className="addr-text">
            {conn.remote_addr}:{conn.remote_port}
          </span>
        ) : (
          <span className="addr-empty">—</span>
        )}
      </td>
      <td className="col-state">
        <StateChip state={conn.state} />
      </td>
      <td className="col-pid">
        {conn.pid ? (
          <span className="mono-text">{conn.pid}</span>
        ) : (
          <span className="addr-empty">—</span>
        )}
      </td>
      <td className="col-process">
        {conn.process_name ? (
          <span className="process-name">{conn.process_name}</span>
        ) : (
          <span className="addr-empty">unknown</span>
        )}
      </td>
      <td className="col-action">
        {conn.pid && (
          <button
            className="kill-btn"
            onClick={() => onKillRequest(conn)}
            title={`Kill PID ${conn.pid}`}
          >
            kill
          </button>
        )}
      </td>
    </tr>
  );
}

function ConnectionTable({ connections, onKillRequest }) {
  return (
    <div className="table-wrap">
      <table className="conn-table">
        <thead>
          <tr>
            <th className="col-port">Port</th>
            <th className="col-proto">Proto</th>
            <th className="col-local">Local Addr</th>
            <th className="col-remote">Remote</th>
            <th className="col-state">State</th>
            <th className="col-pid">PID</th>
            <th className="col-process">Process</th>
            <th className="col-action"></th>
          </tr>
        </thead>
        <tbody>
          {connections.map((conn, i) => (
            <ConnectionRow
              key={`${conn.protocol}-${conn.local_port}-${conn.pid}-${i}`}
              conn={conn}
              onKillRequest={onKillRequest}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ConnectionTable;
