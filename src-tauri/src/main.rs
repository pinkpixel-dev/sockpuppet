// Prevents additional console window on Windows in release, do not remove this
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    sockpuppet_lib::run();
}
