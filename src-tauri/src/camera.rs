use std::{sync::Mutex, time::Instant};
#[cfg(target_os = "linux")]
use tauri::Manager;

#[derive(Default)]
pub struct CameraLease(Mutex<Option<(String, Instant)>>);

fn local_main(webview: &tauri::Webview) -> bool {
    webview.label() == "main"
        && webview.url().is_ok_and(|url| {
            (url.port().is_none()
                && url.username().is_empty()
                && url.password().is_none()
                && ((url.scheme() == "tauri" && url.host_str() == Some("localhost"))
                    || (url.scheme() == "http" && url.host_str() == Some("tauri.localhost"))))
                || (cfg!(debug_assertions)
                    && url.scheme() == "http"
                    && matches!(url.host_str(), Some("localhost" | "127.0.0.1"))
                    && url.port() == Some(1420))
        })
}

impl CameraLease {
    fn update(&self, token: String, active: bool) -> Result<(), String> {
        let mut lease = self.0.lock().map_err(|_| "camera.denied")?;
        if active {
            *lease = Some((token, Instant::now()));
        } else if lease.as_ref().is_some_and(|(id, _)| id == &token) {
            *lease = None;
        }
        Ok(())
    }

    #[cfg(any(target_os = "linux", test))]
    fn consume(&self) -> bool {
        self.0.lock().is_ok_and(|mut lease| {
            lease
                .take()
                .is_some_and(|(_, start)| start.elapsed().as_secs() < 30)
        })
    }
}

#[tauri::command]
pub fn camera_session(
    webview: tauri::Webview,
    state: tauri::State<'_, CameraLease>,
    token: String,
    active: bool,
) -> Result<(), String> {
    if !local_main(&webview) || uuid::Uuid::parse_str(&token).is_err() {
        return Err("camera.denied".into());
    }
    state.update(token, active)
}

pub fn configure(builder: tauri::Builder<tauri::Wry>) -> tauri::Builder<tauri::Wry> {
    let builder = builder.manage(CameraLease::default());
    #[cfg(target_os = "linux")]
    let builder = builder.on_permission_request(|webview, kind| {
        use tauri::webview::{PermissionKind, PermissionResponse};
        if matches!(kind, PermissionKind::Camera) && local_main(&webview) {
            let state = webview.state::<CameraLease>();
            if state.consume() {
                return PermissionResponse::Allow;
            }
        }
        // A combined audio/video request is also denied by Wry's microphone-first check.
        PermissionResponse::Deny
    });
    builder
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn camera_permission_requires_a_fresh_single_use_session() {
        let lease = CameraLease::default();
        assert!(!lease.consume());
        lease.update("session".into(), true).unwrap();
        assert!(lease.consume());
        assert!(!lease.consume());
        *lease.0.lock().unwrap() = Some((
            "expired".into(),
            Instant::now() - std::time::Duration::from_secs(31),
        ));
        assert!(!lease.consume());
    }
    #[test]
    fn old_cleanup_cannot_revoke_a_new_session() {
        let lease = CameraLease::default();
        lease.update("new".into(), true).unwrap();
        lease.update("old".into(), false).unwrap();
        assert!(lease.consume());
        lease.update("new".into(), true).unwrap();
        lease.update("new".into(), false).unwrap();
        assert!(!lease.consume());
    }
}
