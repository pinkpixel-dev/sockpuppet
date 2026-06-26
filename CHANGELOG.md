# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-06-26

### Changed
- Replaced the placeholder socks emoji logo in the top-left corner with the custom `logo.png` asset

### Fixed
- Fixed project structure configuration and build crash under `tauri dev` / `cargo metadata`
- Relocated custom Rust backend (`Cargo.toml`, `lib.rs`, `main.rs`), configuration (`tauri.conf.json`), and capabilities (`default.json`) from root directory to standard `src-tauri/` location
- Relocated custom React frontend files (`App.jsx`, `App.css`, `main.jsx`, `index.css`, and components) from root directory to their proper standard locations inside `src/` and `src/components/`
- Deleted redundant duplicate configuration/Rust source files in the project root
- Resolved E0255 naming conflicts in `src-tauri/src/lib.rs` by removing unnecessary `pub` visibility modifiers from commands


