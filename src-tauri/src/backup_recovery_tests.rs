use super::*;
use serde_json::Value;
use std::{cell::RefCell, process::Command};

thread_local! { static FAILURES: RefCell<Vec<String>> = const { RefCell::new(Vec::new()) }; }

pub(super) fn point(name: &str) -> Result<()> {
    if name == "before-move" && std::env::var_os("MYLIBRARY_TEST_SIDECARS").is_some() {
        let root = PathBuf::from(std::env::var_os("MYLIBRARY_TEST_SYNTHETIC_ROOT").unwrap());
        for name in ["library.sqlite3-wal", "library.sqlite3-shm"] {
            let mut f = fs::OpenOptions::new()
                .write(true)
                .create_new(true)
                .open(root.join(name))?;
            f.write_all(format!("synthetic companion bytes {name}").as_bytes())?;
            f.sync_all()?;
        }
    }
    if std::env::var("MYLIBRARY_TEST_CRASH_POINT").as_deref() == Ok(name) {
        // Only the explicitly selected synthetic child test may terminate itself.
        assert!(std::env::var_os("MYLIBRARY_TEST_SYNTHETIC_ROOT").is_some());
        std::process::exit(86);
    }
    if FAILURES.with(|f| f.borrow().iter().any(|v| v == name)) {
        return Err(format!("injected {name}").into());
    }
    Ok(())
}

fn seed(root: &Path, label: &str) -> Store {
    let s = Store::open(root.to_path_buf()).unwrap();
    fs::write(
        root.join("covers/sentinel.png"),
        format!("{label} cover bytes"),
    )
    .unwrap();
    fs::write(
        root.join("attachments/sentinel.bin"),
        format!("{label} attachment bytes"),
    )
    .unwrap();
    let copy = s.save(&json!({"title":format!("{label} first Edition"),"cover":"covers/sentinel.png","extra":{},"copy_extra":{},"custom":{}})).unwrap();
    s.mutate("copy", &json!({"id":copy})).unwrap();
    s.save(
        &json!({"title":format!("{label} second Edition"),"extra":{},"copy_extra":{},"custom":{}}),
    )
    .unwrap();
    let edition = s.snapshot("", false).unwrap()["books"][0]["edition_id"].clone();
    s.conn().unwrap().execute("INSERT INTO attachments(id,copy_id,name,path,created_at) VALUES('attachment-sentinel',?,'synthetic','attachments/sentinel.bin','2026-11-06')", [&copy]).unwrap();
    let d: crate::wishlist::Draft = serde_json::from_value(json!({"id":"","edition_id":edition,"title":format!("{label} Wishlist sentinel"),"author":"Synthetic","isbn10":"","isbn13":"","preference":"Specific","edition_description":"","priority":"High","status":"Wishing","target_minor":"1234","currency":"TRY","notes":"synthetic","archived":false,"updated_at":"","retailers":[]})).unwrap();
    let r = s.wishlist_save(&d, None).unwrap();
    if r["saved"] == false {
        s.wishlist_save(&d, r["review_token"].as_str()).unwrap();
    }
    for cycle in 0..2 {
        let d: crate::wishlist::Draft =
            serde_json::from_value(s.wishlist_list("").unwrap()["items"][0]["draft"].clone())
                .unwrap();
        let request: crate::wishlist_acquisition::Request = serde_json::from_value(json!({"item":d.id,"updated_at":d.updated_at,"edition_id":d.edition_id,"title":d.title,"author":d.author,"isbn10":"","isbn13":"","physical":{"barcode":"","inventory_code":"","location_id":"","source":"","acquisition_date":"","condition":"Good"}})).unwrap();
        let review = s.wishlist_acquisition(&request, None).unwrap();
        let acquired = s
            .wishlist_acquisition(&request, review["review_token"].as_str())
            .unwrap();
        if cycle == 0 {
            let updated = s.wishlist_list("").unwrap()["items"][0]["draft"]["updated_at"]
                .as_str()
                .unwrap()
                .to_owned();
            s.wishlist_reopen_acquisition(
                &request.item,
                &updated,
                acquired["acquisition"].as_str().unwrap(),
            )
            .unwrap();
        }
    }
    s
}

fn records(s: &Store) -> Value {
    let mut v = s.snapshot("", false).unwrap();
    v.as_object_mut().unwrap().remove("dataDir");
    v["wishlist"] = s.wishlist_list("").unwrap();
    v["acquisition_rows"] = json!(crate::wishlist_acquisition::history(
        &s.conn().unwrap(),
        v["wishlist"]["items"][0]["draft"]["id"].as_str().unwrap()
    )
    .unwrap());
    v
}

#[test]
fn restore_crash_child() {
    let Some(root) = std::env::var_os("MYLIBRARY_TEST_SYNTHETIC_ROOT") else {
        return;
    };
    let root = PathBuf::from(root);
    assert_eq!(
        fs::read(root.parent().unwrap().join("synthetic-only")).unwrap(),
        b"Issue54 synthetic fixture"
    );
    let s = Store::open(root).unwrap();
    if let Ok(failures) = std::env::var("MYLIBRARY_TEST_FAILURES") {
        FAILURES.with(|f| *f.borrow_mut() = failures.split(',').map(str::to_owned).collect());
    }
    s.restore(&PathBuf::from(
        std::env::var_os("MYLIBRARY_TEST_ARCHIVE").unwrap(),
    ))
    .unwrap();
    panic!("crash point not reached");
}

#[test]
fn process_interruptions_fail_closed_on_repeated_startup() {
    let mut failures = Vec::new();
    for (point, injected_failures) in [
        ("before-move", ""),
        ("moved:library.sqlite3", ""),
        ("moved:covers", ""),
        ("moved:attachments", ""),
        ("installed:library.sqlite3", ""),
        ("installed:covers", ""),
        ("installed:attachments", ""),
        ("undo-install:library.sqlite3", "install:covers"),
        ("undo-move:covers", "install:covers"),
    ] {
        let dir = tempfile::tempdir().unwrap();
        fs::write(
            dir.path().join("synthetic-only"),
            b"Issue54 synthetic fixture",
        )
        .unwrap();
        let source = seed(&dir.path().join("source"), "incoming");
        let archive = dir.path().join("input.zip");
        source.backup(&archive).unwrap();
        let root = dir.path().join("live");
        let live = seed(&root, "original");
        let before = records(&live);
        drop(live);
        let status = Command::new(std::env::current_exe().unwrap())
            .args([
                "--exact",
                "backup::recovery_tests::restore_crash_child",
                "--nocapture",
            ])
            .env("MYLIBRARY_TEST_SYNTHETIC_ROOT", &root)
            .env("MYLIBRARY_TEST_ARCHIVE", &archive)
            .env("MYLIBRARY_TEST_CRASH_POINT", point)
            .env("MYLIBRARY_TEST_FAILURES", injected_failures)
            .status()
            .unwrap();
        assert_eq!(status.code(), Some(86), "{point}");
        let preserved = tree(&root);
        for attempt in 0..2 {
            match Store::open(root.clone()) {
                Ok(s) => failures.push(format!(
                    "{point} startup {attempt} opened {} copies",
                    s.snapshot("", false).unwrap()["books"]
                        .as_array()
                        .unwrap()
                        .len()
                )),
                Err(e) => assert!(e.to_string().contains("recovery"), "{e}"),
            }
            assert_eq!(tree(&root), preserved, "{point}: startup changed artifacts");
        }
        let safety = fs::read_dir(root.join("backups"))
            .unwrap()
            .next()
            .unwrap()
            .unwrap()
            .path();
        let rescued = Store::open(dir.path().join("rescue")).unwrap();
        rescued.restore(&safety).unwrap();
        assert_eq!(records(&rescued), before);
        assert_eq!(
            fs::read(rescued.root.join("covers/sentinel.png")).unwrap(),
            b"original cover bytes"
        );
        assert_eq!(
            fs::read(rescued.root.join("attachments/sentinel.bin")).unwrap(),
            b"original attachment bytes"
        );
    }
    assert!(failures.is_empty(), "{}", failures.join("\n"));
}

#[test]
fn secondary_rollback_failure_preserves_all_errors_and_other_recovery_steps() {
    let dir = tempfile::tempdir().unwrap();
    let source = seed(&dir.path().join("source"), "incoming");
    let archive = dir.path().join("input.zip");
    source.backup(&archive).unwrap();
    let live = seed(&dir.path().join("live"), "original");
    FAILURES.with(|f| {
        *f.borrow_mut() = vec![
            "install:covers".into(),
            "undo-install:library.sqlite3".into(),
        ]
    });
    let error = live.restore(&archive).unwrap_err().to_string();
    FAILURES.with(|f| f.borrow_mut().clear());
    assert!(
        error.contains("install:covers") && error.contains("undo-install:library.sqlite3"),
        "{error}"
    );
    assert_eq!(
        fs::read(live.root.join("covers/sentinel.png")).unwrap(),
        b"original cover bytes"
    );
    assert_eq!(
        fs::read(live.root.join("attachments/sentinel.bin")).unwrap(),
        b"original attachment bytes"
    );
    assert!(live.conn().is_err());
    assert!(fs::read_dir(&live.root).unwrap().any(|e| e
        .unwrap()
        .file_name()
        .to_string_lossy()
        .starts_with(".restore-")));
}

#[test]
fn missing_referenced_media_cannot_publish_a_completed_backup() {
    for missing in ["covers/sentinel.png", "attachments/sentinel.bin"] {
        let dir = tempfile::tempdir().unwrap();
        let s = seed(&dir.path().join("live"), "original");
        let before = records(&s);
        fs::remove_file(s.root.join(missing)).unwrap();
        let destination = dir.path().join("incomplete.zip");
        assert!(s.backup(&destination).is_err(), "{missing}");
        assert!(!destination.exists());
        assert_eq!(records(&s), before);
    }
}

struct FailedRead(bool);
impl Read for FailedRead {
    fn read(&mut self, b: &mut [u8]) -> std::io::Result<usize> {
        if self.0 {
            return Err(std::io::Error::other(
                "injected destination copy interruption",
            ));
        }
        self.0 = true;
        let n = 16.min(b.len());
        b[..n].fill(b'P');
        Ok(n)
    }
}
#[test]
fn partial_destination_write_never_leaves_a_final_filename() {
    let dir = tempfile::tempdir().unwrap();
    let destination = dir.path().join("completed.zip");
    assert!(publish_backup(&mut FailedRead(false), &destination).is_err());
    assert!(!destination.exists(), "partial final ZIP remains");
}

fn tree(root: &Path) -> std::collections::BTreeMap<PathBuf, Vec<u8>> {
    fn visit(root: &Path, dir: &Path, out: &mut std::collections::BTreeMap<PathBuf, Vec<u8>>) {
        for entry in fs::read_dir(dir).unwrap() {
            let path = entry.unwrap().path();
            // Windows may enumerate this already-deleted transient entry after child exit.
            if path
                .file_name()
                .unwrap()
                .to_string_lossy()
                .eq_ignore_ascii_case("library.sqlite3-shm.tmp")
            {
                continue;
            }
            if path.is_dir() {
                out.insert(path.strip_prefix(root).unwrap().to_path_buf(), Vec::new());
                visit(root, &path, out);
            } else {
                out.insert(
                    path.strip_prefix(root).unwrap().to_path_buf(),
                    if path.file_name().unwrap() == ".library.lock" {
                        Vec::new()
                    } else {
                        fs::read(&path).unwrap_or_else(|e| {
                            panic!("Cannot fingerprint {}: {e}", path.display())
                        })
                    },
                );
            }
        }
    }
    let mut out = std::collections::BTreeMap::new();
    visit(root, root, &mut out);
    out
}

pub(super) struct DestinationWriter {
    file: File,
    written: usize,
}
impl DestinationWriter {
    pub(super) fn new(file: File) -> Self {
        Self { file, written: 0 }
    }
    pub(super) fn sync_all(&self) -> std::io::Result<()> {
        point("publish-sync").map_err(|e| std::io::Error::other(e.to_string()))?;
        self.file.sync_all()
    }
}
impl Write for DestinationWriter {
    fn write(&mut self, bytes: &[u8]) -> std::io::Result<usize> {
        let fail = FAILURES.with(|f| f.borrow().iter().any(|s| s == "publish-write"));
        if fail && self.written >= 16 {
            return Err(std::io::Error::other("injected destination write failure"));
        }
        let bytes = if fail {
            &bytes[..bytes.len().min(16 - self.written)]
        } else {
            bytes
        };
        let n = self.file.write(bytes)?;
        self.written += n;
        Ok(n)
    }
    fn flush(&mut self) -> std::io::Result<()> {
        self.file.flush()
    }
}

#[test]
fn write_sync_and_publication_failures_leave_no_final_or_owned_temp() {
    for point in ["publish-write", "publish-sync", "publish"] {
        let dir = tempfile::tempdir().unwrap();
        let destination = dir.path().join("completed.zip");
        FAILURES.with(|f| *f.borrow_mut() = vec![point.into()]);
        let result = publish_backup(&mut std::io::Cursor::new(vec![b'P'; 1024]), &destination);
        FAILURES.with(|f| f.borrow_mut().clear());
        assert!(result.is_err(), "{point}");
        assert!(!destination.exists(), "{point}");
        assert_eq!(fs::read_dir(dir.path()).unwrap().count(), 0, "{point}");
    }
}

#[test]
fn concurrent_publishers_never_overwrite_an_existing_backup() {
    let dir = tempfile::tempdir().unwrap();
    let destination = dir.path().join("completed.zip");
    let barrier = std::sync::Arc::new(std::sync::Barrier::new(2));
    let threads: Vec<_> = [b"first".to_vec(), b"second".to_vec()]
        .into_iter()
        .map(|bytes| {
            let destination = destination.clone();
            let barrier = barrier.clone();
            std::thread::spawn(move || {
                barrier.wait();
                publish_backup(&mut std::io::Cursor::new(bytes), &destination).is_ok()
            })
        })
        .collect();
    assert_eq!(
        threads
            .into_iter()
            .map(|t| t.join().unwrap() as usize)
            .sum::<usize>(),
        1
    );
    let bytes = fs::read(&destination).unwrap();
    assert!(bytes == b"first" || bytes == b"second");
    assert!(publish_backup(&mut std::io::Cursor::new(b"third"), &destination).is_err());
    assert_eq!(fs::read(destination).unwrap(), bytes);
    assert_eq!(fs::read_dir(dir.path()).unwrap().count(), 1);
}

#[test]
fn all_safe_rollback_steps_continue_after_multiple_failures() {
    let dir = tempfile::tempdir().unwrap();
    let source = seed(&dir.path().join("source"), "incoming");
    let archive = dir.path().join("input.zip");
    source.backup(&archive).unwrap();
    let live = seed(&dir.path().join("live"), "original");
    FAILURES.with(|f| {
        *f.borrow_mut() = vec![
            "install:attachments".into(),
            "undo-install:covers".into(),
            "undo-move:library.sqlite3".into(),
        ]
    });
    let error = live.restore(&archive).unwrap_err().to_string();
    FAILURES.with(|f| f.borrow_mut().clear());
    for expected in [
        "install:attachments",
        "undo-install:covers",
        "undo-move:library.sqlite3",
        "destination already exists",
    ] {
        assert!(error.contains(expected), "{error}");
    }
    assert!(!live.root.join("library.sqlite3").exists());
    assert_eq!(
        fs::read(live.root.join("attachments/sentinel.bin")).unwrap(),
        b"original attachment bytes"
    );
    assert_eq!(
        fs::read(live.root.join("covers/sentinel.png")).unwrap(),
        b"incoming cover bytes"
    );
    let previous = fs::read_dir(&live.root)
        .unwrap()
        .map(|e| e.unwrap().path())
        .find(|p| {
            p.file_name()
                .unwrap()
                .to_string_lossy()
                .starts_with(".previous-")
        })
        .unwrap();
    assert!(previous.join("library.sqlite3").is_file());
    assert_eq!(
        fs::read(previous.join("covers/sentinel.png")).unwrap(),
        b"original cover bytes"
    );
    let before = tree(&live.root);
    assert!(live.conn().is_err());
    assert_eq!(tree(&live.root), before);
}

#[test]
fn pending_and_legacy_recovery_evidence_never_bootstrap_a_database() {
    for artifact in [
        PENDING_RESTORE,
        ".previous-old",
        ".restore-old",
        "library.sqlite3-wal",
        "library.sqlite3-shm",
    ] {
        let dir = tempfile::tempdir().unwrap();
        fs::write(dir.path().join(artifact), b"uncertain recovery evidence").unwrap();
        for _ in 0..2 {
            assert!(Store::open(dir.path().to_path_buf()).is_err(), "{artifact}");
            assert!(!dir.path().join("library.sqlite3").exists());
            assert!(!dir.path().join("covers").exists());
            assert!(!dir.path().join("attachments").exists());
            assert_eq!(
                fs::read(dir.path().join(artifact)).unwrap(),
                b"uncertain recovery evidence"
            );
        }
    }
    let dir = tempfile::tempdir().unwrap();
    fs::create_dir(dir.path().join(PENDING_RESTORE)).unwrap();
    assert!(Store::open(dir.path().to_path_buf()).is_err());
    let fresh = tempfile::tempdir().unwrap();
    let s = Store::open(fresh.path().to_path_buf()).unwrap();
    assert!(s.snapshot("", false).unwrap()["books"]
        .as_array()
        .unwrap()
        .is_empty());
}

#[test]
fn journal_failure_is_before_live_moves_and_keeps_staging() {
    let dir = tempfile::tempdir().unwrap();
    let source = seed(&dir.path().join("source"), "incoming");
    let archive = dir.path().join("input.zip");
    source.backup(&archive).unwrap();
    let live = seed(&dir.path().join("live"), "original");
    let db = fs::read(live.root.join("library.sqlite3")).unwrap();
    FAILURES.with(|f| *f.borrow_mut() = vec!["journal-sync".into()]);
    let error = live.restore(&archive).unwrap_err().to_string();
    FAILURES.with(|f| f.borrow_mut().clear());
    assert!(error.contains("journal-sync"));
    assert_eq!(fs::read(live.root.join("library.sqlite3")).unwrap(), db);
    assert_eq!(
        fs::read(live.root.join("covers/sentinel.png")).unwrap(),
        b"original cover bytes"
    );
    assert!(live.root.join(PENDING_RESTORE).is_file());
    assert!(live.conn().is_err());
}

#[test]
fn incomplete_live_media_and_invalid_safety_archive_stop_before_pending() {
    for fault in ["covers/sentinel.png", "attachments/sentinel.bin", "schema"] {
        let dir = tempfile::tempdir().unwrap();
        let source = seed(&dir.path().join("source"), "incoming");
        let archive = dir.path().join("input.zip");
        source.backup(&archive).unwrap();
        let live = seed(&dir.path().join("live"), "original");
        if fault == "schema" {
            live.conn()
                .unwrap()
                .execute_batch("CREATE TABLE unsupported_safety_probe(value TEXT)")
                .unwrap();
        } else {
            fs::remove_file(live.root.join(fault)).unwrap();
        }
        let before = records(&live);
        let error = live.restore(&archive).unwrap_err().to_string();
        assert!(
            error.contains("Source library is incomplete")
                || error.contains("safety backup failed staged validation"),
            "{error}"
        );
        assert!(!live.root.join(PENDING_RESTORE).exists());
        assert!(!fs::read_dir(&live.root).unwrap().any(|e| e
            .unwrap()
            .file_name()
            .to_string_lossy()
            .starts_with(".previous-")));
        assert_eq!(records(&live), before);
    }
}

#[test]
fn busy_wal_checkpoint_preserves_committed_records_and_sidecars() {
    let dir = tempfile::tempdir().unwrap();
    let source = seed(&dir.path().join("source"), "incoming");
    let archive = dir.path().join("input.zip");
    source.backup(&archive).unwrap();
    let live = seed(&dir.path().join("live"), "original");
    let writer = live.conn().unwrap();
    writer
        .execute_batch(
            "PRAGMA wal_autocheckpoint=0; INSERT INTO settings VALUES('wal-sentinel','first')",
        )
        .unwrap();
    let reader = live.conn().unwrap();
    reader
        .execute_batch("BEGIN; SELECT * FROM settings;")
        .unwrap();
    writer
        .execute(
            "UPDATE settings SET value='committed WAL sentinel' WHERE key='wal-sentinel'",
            [],
        )
        .unwrap();
    assert!(
        fs::metadata(live.root.join("library.sqlite3-wal"))
            .unwrap()
            .len()
            > 0
    );
    let before = records(&live);
    let error = live.restore(&archive).unwrap_err().to_string();
    assert!(error.contains("checkpoint is busy"), "{error}");
    assert!(!live.root.join(PENDING_RESTORE).exists());
    assert_eq!(records(&live), before);
    assert!(live.root.join("library.sqlite3-wal").is_file());
    let safety = fs::read_dir(live.root.join("backups"))
        .unwrap()
        .next()
        .unwrap()
        .unwrap()
        .path();
    let rescue = Store::open(dir.path().join("rescue")).unwrap();
    rescue.restore(&safety).unwrap();
    assert_eq!(records(&rescue), before);
    reader.execute_batch("ROLLBACK").unwrap();
    drop(reader);
    drop(writer);
    checkpoint(&live.conn().unwrap()).unwrap();
}

#[test]
fn writer_restore_byte_budget_boundary_is_enforced_without_gigabyte_fixtures() {
    let mut total = MAX_RESTORE_BYTES - 3;
    let mut output = Vec::new();
    write_backup_member(&b"abc"[..], &mut output, &mut total).unwrap();
    assert_eq!(total, MAX_RESTORE_BYTES);
    assert!(write_backup_member(&b"d"[..], &mut output, &mut total).is_err());
    assert_eq!(output, b"abcd");
    let mut total = MAX_RESTORE_BYTES - 3;
    let mut output = Vec::new();
    assert!(write_backup_member(&b"abcdef"[..], &mut output, &mut total).is_err());
    assert_eq!(output.len(), 4);
}

#[test]
fn edition_without_copies_and_nonflat_media_references_are_checked() {
    let dir = tempfile::tempdir().unwrap();
    let live = seed(&dir.path().join("live"), "original");
    let c = live.conn().unwrap();
    c.execute("INSERT INTO editions(id,title,created_at,updated_at) VALUES('orphan-edition','synthetic second Edition','2026-11-06','2026-11-06')", []).unwrap();
    c.execute(
        "UPDATE editions SET cover='covers/missing.png' WHERE id='orphan-edition'",
        [],
    )
    .unwrap();
    let destination = dir.path().join("invalid.zip");
    assert!(live.backup(&destination).is_err());
    c.execute("UPDATE editions SET cover='' WHERE id='orphan-edition'", [])
        .unwrap();
    for path in [
        "covers//sentinel.png",
        "covers/./sentinel.png",
        "covers/nested/sentinel.png",
    ] {
        fs::create_dir_all(live.root.join("covers/nested")).unwrap();
        fs::write(
            live.root.join("covers/nested/sentinel.png"),
            b"nested bytes",
        )
        .unwrap();
        c.execute(
            "UPDATE editions SET cover=? WHERE id='orphan-edition'",
            [path],
        )
        .unwrap();
        assert!(live.backup(&destination).is_err(), "{path}");
        assert!(!destination.exists());
    }
}

#[cfg(unix)]
#[test]
fn unreferenced_media_symlink_cannot_export_external_bytes() {
    let dir = tempfile::tempdir().unwrap();
    let live = seed(&dir.path().join("live"), "original");
    let outside = dir.path().join("outside-synthetic.txt");
    fs::write(&outside, b"outside bytes").unwrap();
    std::os::unix::fs::symlink(&outside, live.root.join("covers/unreferenced.png")).unwrap();
    let destination = dir.path().join("invalid.zip");
    assert!(live.backup(&destination).is_err());
    assert!(!destination.exists());
    assert_eq!(fs::read(outside).unwrap(), b"outside bytes");
}

#[cfg(windows)]
#[test]
fn windows_file_lock_failure_retains_original_and_pending_evidence() {
    use std::os::windows::fs::OpenOptionsExt;
    let dir = tempfile::tempdir().unwrap();
    let source = seed(&dir.path().join("source"), "incoming");
    let archive = dir.path().join("input.zip");
    source.backup(&archive).unwrap();
    let live = seed(&dir.path().join("live"), "original");
    let db = fs::read(live.root.join("library.sqlite3")).unwrap();
    // Permit SQLite read/write, but deny Windows FILE_SHARE_DELETE for the swap.
    let held = fs::OpenOptions::new()
        .read(true)
        .share_mode(0x1 | 0x2)
        .open(live.root.join("library.sqlite3"))
        .unwrap();
    let error = live.restore(&archive).unwrap_err().to_string();
    assert!(error.contains("Restore failed"), "{error}");
    assert!(live.root.join(PENDING_RESTORE).is_file());
    assert_eq!(fs::read(live.root.join("library.sqlite3")).unwrap(), db);
    assert_eq!(
        fs::read(live.root.join("covers/sentinel.png")).unwrap(),
        b"original cover bytes"
    );
    assert!(live.conn().is_err());
    drop(held);
}

#[test]
fn failed_original_db_undo_keeps_synthetic_sidecar_bytes_beside_it() {
    let dir = tempfile::tempdir().unwrap();
    fs::write(
        dir.path().join("synthetic-only"),
        b"Issue54 synthetic fixture",
    )
    .unwrap();
    let source = seed(&dir.path().join("source"), "incoming");
    let archive = dir.path().join("input.zip");
    source.backup(&archive).unwrap();
    let root = dir.path().join("live");
    drop(seed(&root, "original"));
    let status = Command::new(std::env::current_exe().unwrap())
        .args([
            "--exact",
            "backup::recovery_tests::restore_crash_child",
            "--nocapture",
        ])
        .env("MYLIBRARY_TEST_SYNTHETIC_ROOT", &root)
        .env("MYLIBRARY_TEST_ARCHIVE", &archive)
        .env("MYLIBRARY_TEST_CRASH_POINT", "undo-move:covers")
        .env(
            "MYLIBRARY_TEST_FAILURES",
            "install:covers,undo-install:library.sqlite3",
        )
        .env("MYLIBRARY_TEST_SIDECARS", "1")
        .status()
        .unwrap();
    assert_eq!(status.code(), Some(86));
    let previous = fs::read_dir(&root)
        .unwrap()
        .map(|e| e.unwrap().path())
        .find(|p| {
            p.file_name()
                .unwrap()
                .to_string_lossy()
                .starts_with(".previous-")
        })
        .unwrap();
    assert!(previous.join("library.sqlite3").is_file());
    for name in ["library.sqlite3-wal", "library.sqlite3-shm"] {
        assert_eq!(
            fs::read(previous.join(name)).unwrap(),
            format!("synthetic companion bytes {name}").as_bytes()
        );
        assert!(!root.join(name).exists());
    }
    let before = tree(&root);
    for _ in 0..2 {
        assert!(Store::open(root.clone()).is_err());
        assert_eq!(tree(&root), before);
    }
}

#[test]
fn marker_removal_failure_stays_closed_and_completed_interruption_reopens_new_generation() {
    for failure in [true, false] {
        let dir = tempfile::tempdir().unwrap();
        fs::write(
            dir.path().join("synthetic-only"),
            b"Issue54 synthetic fixture",
        )
        .unwrap();
        let source = seed(&dir.path().join("source"), "incoming");
        let incoming = records(&source);
        let archive = dir.path().join("input.zip");
        source.backup(&archive).unwrap();
        let root = dir.path().join("live");
        let live = seed(&root, "original");
        if failure {
            FAILURES.with(|f| *f.borrow_mut() = vec!["marker-remove".into()]);
            let error = live.restore(&archive).unwrap_err().to_string();
            FAILURES.with(|f| f.borrow_mut().clear());
            assert!(error.contains("marker-remove"));
            assert!(live.root.join(PENDING_RESTORE).is_file());
            assert!(live.conn().is_err());
        } else {
            drop(live);
            let status = Command::new(std::env::current_exe().unwrap())
                .args([
                    "--exact",
                    "backup::recovery_tests::restore_crash_child",
                    "--nocapture",
                ])
                .env("MYLIBRARY_TEST_SYNTHETIC_ROOT", &root)
                .env("MYLIBRARY_TEST_ARCHIVE", &archive)
                .env("MYLIBRARY_TEST_CRASH_POINT", "completed")
                .status()
                .unwrap();
            assert_eq!(status.code(), Some(86));
            let opened = Store::open(root).unwrap();
            assert_eq!(records(&opened), incoming);
            assert_eq!(
                fs::read(opened.root.join("covers/sentinel.png")).unwrap(),
                b"incoming cover bytes"
            );
        }
    }
}
