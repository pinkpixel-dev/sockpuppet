# Roadmap

## Phase 1: Core Functionality (MVP) - Done
- [x] Basic TCP/UDP connection scanner reading `/proc/net/`
- [x] Process mapping using socket inodes to resolve PIDs
- [x] Process details view and ability to terminate selected processes
- [x] Standard Tauri v2 structure and React frontend

## Phase 2: UI/UX Enhancements
- [ ] Network traffic graphing (live bandwidth usage)
- [ ] Notifications/alerts when new ports begin listening
- [ ] Customizable search filters (e.g., protocol: TCP/UDP, state: LISTEN)
- [ ] Custom labels/notes for recognized local ports

## Phase 3: Advanced System Integration
- [ ] System tray minimizer to run quietly in background
- [ ] Historical logging of connections to detect anomalous activity
- [ ] Port scanning utility to check external accessibility
