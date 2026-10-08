//! Native boundaries. Never open a path supplied by imported content.
use serde_json::{json, Value};
pub fn info(root: &std::path::Path) -> Value {
    json!({"os": std::env::consts::OS, "arch": std::env::consts::ARCH,
        "version": env!("CARGO_PKG_VERSION"), "schema": crate::migrations::CURRENT_SCHEMA,
        "channel": "stable", "updatesConfigured": false, "paths": {"data": root, "cache":root.join("cache"), "temporary":root.join("cache/tmp"), "backups":root.join("backups")}})
}
