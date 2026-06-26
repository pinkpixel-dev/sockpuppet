# Memory

## Decisions

### 2026-06-26: Relocate Rust Backend and Configuration to `src-tauri/`

- **What was decided:** Move all custom Rust source files (`Cargo.toml`, `lib.rs`, `main.rs`), Tauri configuration (`tauri.conf.json`), and capability config (`default.json`) from the project root into `src-tauri/` (replacing boilerplate files). Relocate custom frontend React files (`App.jsx`, `App.css`, `main.jsx`, `index.css`, and custom components) from the root into `src/` and `src/components/`. Remove the `pub` visibility modifier from Tauri commands in `src-tauri/src/lib.rs`.
- **Why:** Tauri CLI v2 and Cargo expect the Rust package and configuration to live inside `src-tauri/`. A root-level `Cargo.toml` caused `cargo metadata` to fail because it couldn't find a library in the default path, and nested packages with the same name conflicted. Removing `pub` from commands defined in the same file as `tauri::generate_handler![]` resolves Rust macro E0255 name collisions. Frontend React files must be organized inside `src/` so they are correctly loaded by Vite (as referenced in `/index.html`) and import components properly.
- **What was rejected and why:** Setting up a Cargo Workspace with the root as workspace parent. Rejected because it is complex, non-standard for Tauri, and clutters the root directory with backend source files.

