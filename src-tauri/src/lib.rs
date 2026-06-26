use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::net::Ipv4Addr;
use sysinfo::{Pid, System};
use tauri::command;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Connection {
    pub local_port: u16,
    pub local_addr: String,
    pub remote_addr: String,
    pub remote_port: Option<u16>,
    pub state: String,
    pub pid: Option<u32>,
    pub process_name: Option<String>,
    pub protocol: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProcessInfo {
    pub pid: u32,
    pub name: String,
    pub cpu_usage: f32,
    pub memory_mb: f64,
    pub status: String,
}

fn hex_to_ip(hex: &str) -> Option<String> {
    let n = u32::from_str_radix(hex.trim(), 16).ok()?;
    let ip = Ipv4Addr::from(u32::from_be(n));
    Some(ip.to_string())
}

fn hex_to_port(hex: &str) -> Option<u16> {
    u16::from_str_radix(hex.trim(), 16).ok()
}

fn parse_proc_net(path: &str, protocol: &str, pid_map: &HashMap<u32, String>) -> Vec<Connection> {
    let content = match fs::read_to_string(path) {
        Ok(c) => c,
        Err(_) => return vec![],
    };

    // Build inode -> pid map
    let inode_to_pid = build_inode_pid_map();

    let state_map: HashMap<&str, &str> = [
        ("01", "ESTABLISHED"),
        ("02", "SYN_SENT"),
        ("03", "SYN_RECV"),
        ("04", "FIN_WAIT1"),
        ("05", "FIN_WAIT2"),
        ("06", "TIME_WAIT"),
        ("07", "CLOSE"),
        ("08", "CLOSE_WAIT"),
        ("09", "LAST_ACK"),
        ("0A", "LISTEN"),
        ("0B", "CLOSING"),
    ]
    .iter()
    .cloned()
    .collect();

    let mut connections = vec![];

    for line in content.lines().skip(1) {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() < 10 {
            continue;
        }

        let local_parts: Vec<&str> = parts[1].split(':').collect();
        let remote_parts: Vec<&str> = parts[2].split(':').collect();

        if local_parts.len() != 2 || remote_parts.len() != 2 {
            continue;
        }

        let local_ip = hex_to_ip(local_parts[0]).unwrap_or_default();
        let local_port = hex_to_port(local_parts[1]).unwrap_or(0);
        let remote_ip = hex_to_ip(remote_parts[0]).unwrap_or_default();
        let remote_port = hex_to_port(remote_parts[1]);

        let state_hex = parts[3].to_uppercase();
        let state = state_map
            .get(state_hex.as_str())
            .copied()
            .unwrap_or("UNKNOWN")
            .to_string();

        let inode = parts[9].parse::<u64>().unwrap_or(0);
        let pid = inode_to_pid.get(&inode).copied();
        let process_name = pid.and_then(|p| pid_map.get(&p)).cloned();

        // Skip zero-port entries
        if local_port == 0 {
            continue;
        }

        connections.push(Connection {
            local_port,
            local_addr: local_ip,
            remote_addr: if remote_ip == "0.0.0.0" {
                String::new()
            } else {
                remote_ip
            },
            remote_port: if remote_port == Some(0) {
                None
            } else {
                remote_port
            },
            state,
            pid: pid.map(|p| p as u32),
            process_name,
            protocol: protocol.to_string(),
        });
    }

    connections
}

fn build_inode_pid_map() -> HashMap<u64, u32> {
    let mut map = HashMap::new();

    let proc_dir = match fs::read_dir("/proc") {
        Ok(d) => d,
        Err(_) => return map,
    };

    for entry in proc_dir.flatten() {
        let fname = entry.file_name();
        let pid_str = fname.to_string_lossy();
        let pid: u32 = match pid_str.parse() {
            Ok(p) => p,
            Err(_) => continue,
        };

        let fd_dir = format!("/proc/{}/fd", pid);
        let fds = match fs::read_dir(&fd_dir) {
            Ok(d) => d,
            Err(_) => continue,
        };

        for fd_entry in fds.flatten() {
            let link = match fs::read_link(fd_entry.path()) {
                Ok(l) => l,
                Err(_) => continue,
            };

            let link_str = link.to_string_lossy();
            if let Some(inode_str) = link_str.strip_prefix("socket:[") {
                if let Some(inode_str) = inode_str.strip_suffix(']') {
                    if let Ok(inode) = inode_str.parse::<u64>() {
                        map.insert(inode, pid);
                    }
                }
            }
        }
    }

    map
}

fn build_pid_name_map(sys: &System) -> HashMap<u32, String> {
    sys.processes()
        .iter()
        .map(|(pid, process)| (pid.as_u32(), process.name().to_string_lossy().to_string()))
        .collect()
}

#[command]
async fn get_connections() -> Result<Vec<Connection>, String> {
    let mut sys = System::new_all();
    sys.refresh_all();

    let pid_map = build_pid_name_map(&sys);

    let mut connections = vec![];
    connections.extend(parse_proc_net("/proc/net/tcp", "TCP", &pid_map));
    connections.extend(parse_proc_net("/proc/net/tcp6", "TCP6", &pid_map));
    connections.extend(parse_proc_net("/proc/net/udp", "UDP", &pid_map));
    connections.extend(parse_proc_net("/proc/net/udp6", "UDP6", &pid_map));

    // Sort: LISTEN first, then by port
    connections.sort_by(|a, b| {
        let a_listen = a.state == "LISTEN";
        let b_listen = b.state == "LISTEN";
        b_listen
            .cmp(&a_listen)
            .then(a.local_port.cmp(&b.local_port))
    });

    Ok(connections)
}

#[command]
async fn get_process_info(pid: u32) -> Result<ProcessInfo, String> {
    let mut sys = System::new_all();
    sys.refresh_all();

    let sysinfo_pid = Pid::from_u32(pid);

    if let Some(process) = sys.process(sysinfo_pid) {
        Ok(ProcessInfo {
            pid,
            name: process.name().to_string_lossy().to_string(),
            cpu_usage: process.cpu_usage(),
            memory_mb: process.memory() as f64 / 1024.0 / 1024.0,
            status: format!("{:?}", process.status()),
        })
    } else {
        Err(format!("Process {} not found", pid))
    }
}

#[command]
async fn kill_process(pid: u32) -> Result<String, String> {
    let mut sys = System::new_all();
    sys.refresh_all();

    let sysinfo_pid = Pid::from_u32(pid);

    if let Some(process) = sys.process(sysinfo_pid) {
        if process.kill() {
            Ok(format!("Process {} killed", pid))
        } else {
            Err(format!("Failed to kill process {} — permission denied?", pid))
        }
    } else {
        Err(format!("Process {} not found", pid))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_connections,
            get_process_info,
            kill_process,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
