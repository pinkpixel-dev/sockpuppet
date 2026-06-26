import { useEffect } from "react";
import "./KillModal.css";

function KillModal({ connection, onConfirm, onCancel }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onConfirm, onCancel]);

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-icon">⚠</span>
          <span className="modal-title">Kill Process</span>
        </div>

        <div className="modal-body">
          <p className="modal-desc">
            This will send <code>SIGKILL</code> to:
          </p>
          <div className="modal-target">
            <div className="modal-target-row">
              <span className="modal-label">Process</span>
              <span className="modal-value">{connection.process_name || "unknown"}</span>
            </div>
            <div className="modal-target-row">
              <span className="modal-label">PID</span>
              <span className="modal-value mono">{connection.pid}</span>
            </div>
            <div className="modal-target-row">
              <span className="modal-label">Port</span>
              <span className="modal-value mono">{connection.local_port}</span>
            </div>
          </div>
          <p className="modal-warning">
            This cannot be undone. Any unsaved data in that process will be lost.
          </p>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onCancel}>
            Cancel <span className="key-hint">Esc</span>
          </button>
          <button className="btn-kill" onClick={onConfirm}>
            Kill it <span className="key-hint">↵</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default KillModal;
