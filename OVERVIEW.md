# Overview

Sockpuppet is a lightweight, premium port and process monitor built specifically for Linux. It displays active ports and connections, mappings to the processes that hold them, and provides a quick desktop interface to manage them.

## Technical Stack

- **Frontend:** React, Vite, CSS Variables
- **Backend:** Rust, Tauri v2
- **Key Crates:** `sysinfo`, `tokio`, `serde`, `tauri-plugin-shell`

## System Architecture

Sockpuppet uses standard Linux APIs to get connection and process info without executing heavy command line utilities:
- **Connection list:** Scans `/proc/net/tcp`, `/proc/net/tcp6`, `/proc/net/udp`, and `/proc/net/udp6`.
- **Process tracking:** Resolves sockets to PIDs using the socket inodes from `/proc/<pid>/fd/` symlinks.
- **Process info / Control:** Uses `sysinfo` to read CPU, memory, status, and safely terminate processes.

## Directory Structure

- `/` (Root): Frontend React application code, styles, and asset configuration
- `/src-tauri/`: Tauri v2 Rust project
  - `src/lib.rs`: Tauri command definitions (`get_connections`, `get_process_info`, `kill_process`) and application runner
  - `src/main.rs`: Entrypoint
  - `capabilities/default.json`: Application capabilities and permissions (`shell:allow-open` for tauri-plugin-shell)
  - `tauri.conf.json`: Tauri application configuration
  - `Cargo.toml`: Backend Rust dependencies and profile configuration

## IPC Commands

1. **`get_connections`**
   - Returns a list of active network connections (TCP and UDP) sorted by listening status and port number.
2. **`get_process_info`**
   - Returns CPU usage, memory, and status of a specific process.
3. **`kill_process`**
   - Attempts to terminate a process by PID.
