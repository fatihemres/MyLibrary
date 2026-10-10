use mylibrary_lib::db::Store;
use serde_json::json;
use std::{
    fs,
    io::{Read, Write},
    path::Path,
};
use zip::{write::SimpleFileOptions, ZipArchive, ZipWriter};

fn fixture() -> (tempfile::TempDir, Store, Store) {
    let base = Path::new(env!("CARGO_MANIFEST_DIR")).join("target/test-data");
    fs::create_dir_all(&base).unwrap();
    let dir = tempfile::tempdir_in(base).unwrap();
    let source = Store::open(dir.path().join("source")).unwrap();
    let live = Store::open(dir.path().join("live")).unwrap();
    for (store, title) in [(&source, "Synthetic source"), (&live, "Keep live data")] {
        store
            .save(&json!({"title":title,"status":"Unread","extra":{},"copy_extra":{},"custom":{}}))
            .unwrap();
    }
    (dir, source, live)
}

fn rejected_without_live_changes(live: &Store, archive: &Path, message: &str) {
    let before = live.snapshot("", false).unwrap();
    let error = live.restore(archive).unwrap_err().to_string();
    assert!(error.contains(message), "Unexpected rejection: {error}");
    assert_eq!(before, live.snapshot("", false).unwrap());
    assert!(!live.root.join("covers/probe.bin").exists());
    assert_eq!(fs::read_dir(live.root.join("backups")).unwrap().count(), 0);
    assert!(!fs::read_dir(&live.root).unwrap().any(|entry| entry
        .unwrap()
        .file_name()
        .to_string_lossy()
        .starts_with(".restore-")));
    live.save(&json!({"title":"Write after rejection","extra":{},"copy_extra":{},"custom":{}}))
        .unwrap();
}

// Modify the real ZIP's central uncompressed-size field, optionally its local
// field too. Leave compressed bytes and CRC intact, as in the validated F1 PoC.
fn alter_member(archive: &Path, name: &str, size: u32, local: bool, bad_crc: bool) {
    let mut bytes = fs::read(archive).unwrap();
    let u16_at = |b: &[u8], at| u16::from_le_bytes(b[at..at + 2].try_into().unwrap()) as usize;
    let u32_at = |b: &[u8], at| u32::from_le_bytes(b[at..at + 4].try_into().unwrap()) as usize;
    let end = bytes.windows(4).rposition(|b| b == b"PK\x05\x06").unwrap();
    let mut at = u32_at(&bytes, end + 16);
    for _ in 0..u16_at(&bytes, end + 10) {
        assert_eq!(&bytes[at..at + 4], b"PK\x01\x02");
        let length = u16_at(&bytes, at + 28);
        let next = at + 46 + length + u16_at(&bytes, at + 30) + u16_at(&bytes, at + 32);
        if &bytes[at + 46..at + 46 + length] == name.as_bytes() {
            let local_at = u32_at(&bytes, at + 42);
            bytes[at + 24..at + 28].copy_from_slice(&size.to_le_bytes());
            if local {
                bytes[local_at + 22..local_at + 26].copy_from_slice(&size.to_le_bytes());
            }
            if bad_crc {
                bytes[at + 16] ^= 1;
            }
            fs::write(archive, bytes).unwrap();
            return;
        }
        at = next;
    }
    panic!("Missing synthetic ZIP member");
}

#[test]
fn understated_sizes_central_only_and_central_plus_local_fail_real_restore() {
    for local in [false, true] {
        let (dir, source, live) = fixture();
        fs::write(source.root.join("covers/probe.bin"), vec![b'P'; 65536]).unwrap();
        let archive = dir.path().join("hostile.zip");
        source.backup(&archive).unwrap();
        alter_member(&archive, "covers/probe.bin", 1, local, false);
        // Assert this fixture really crosses the locked ZIP decoder's boundary.
        let mut zip = ZipArchive::new(fs::File::open(&archive).unwrap()).unwrap();
        let mut member = zip.by_name("covers/probe.bin").unwrap();
        assert_eq!(member.size(), 1);
        let mut decoded = Vec::new();
        member.read_to_end(&mut decoded).unwrap();
        assert_eq!(decoded.len(), 65536);
        drop(member);
        drop(zip);
        rejected_without_live_changes(&live, &archive, "size mismatch");
    }
}

#[test]
fn overstated_size_and_bad_crc_fail_real_restore() {
    for bad_crc in [false, true] {
        let (dir, source, live) = fixture();
        fs::write(source.root.join("covers/probe.bin"), vec![b'P'; 65536]).unwrap();
        let archive = dir.path().join("invalid.zip");
        source.backup(&archive).unwrap();
        alter_member(
            &archive,
            "covers/probe.bin",
            if bad_crc { 65536 } else { 65537 },
            true,
            bad_crc,
        );
        rejected_without_live_changes(
            &live,
            &archive,
            if bad_crc { "checksum" } else { "size mismatch" },
        );
    }
}

fn with_manifest(source: &Store, archive: &Path, length: usize) {
    let original = archive.with_extension("original.zip");
    source.backup(&original).unwrap();
    let mut input = ZipArchive::new(fs::File::open(original).unwrap()).unwrap();
    let mut output = ZipWriter::new(fs::File::create(archive).unwrap());
    let options = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);
    for i in 0..input.len() {
        let mut member = input.by_index(i).unwrap();
        output.start_file(member.name(), options).unwrap();
        if member.name() == "manifest.json" {
            let mut bytes = Vec::new();
            member.read_to_end(&mut bytes).unwrap();
            // Valid JSON with legal trailing whitespace isolates size rejection
            // from parse/format/schema rejection. Compression keeps the ZIP tiny.
            assert!(bytes.len() < length);
            bytes.resize(length, b' ');
            let _: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
            output.write_all(&bytes).unwrap();
        } else {
            std::io::copy(&mut member, &mut output).unwrap();
        }
    }
    output.finish().unwrap();
}

#[test]
fn oversized_valid_manifest_is_rejected_by_manifest_limit() {
    let (dir, source, live) = fixture();
    let archive = dir.path().join("large-manifest.zip");
    with_manifest(&source, &archive, 64 * 1024 + 1);
    rejected_without_live_changes(&live, &archive, "manifest exceeds the 64 KiB limit");
}

#[test]
fn understated_oversized_manifest_cannot_bypass_streaming_limit() {
    let (dir, source, live) = fixture();
    let archive = dir.path().join("understated-manifest.zip");
    with_manifest(&source, &archive, 64 * 1024 + 1);
    alter_member(&archive, "manifest.json", 1, true, false);
    rejected_without_live_changes(&live, &archive, "size mismatch");
}

#[test]
fn manifest_at_limit_and_empty_asset_restore_successfully() {
    let (dir, source, live) = fixture();
    fs::write(source.root.join("covers/empty.bin"), []).unwrap();
    let archive = dir.path().join("at-limit.zip");
    with_manifest(&source, &archive, 64 * 1024);
    let safety = live.restore(&archive).unwrap();
    assert!(safety.is_file());
    let mut expected = source.snapshot("", false).unwrap();
    // The destination's runtime data-directory display intentionally differs.
    expected["dataDir"] = json!(live.root.to_string_lossy());
    assert_eq!(expected, live.snapshot("", false).unwrap());
    assert_eq!(
        fs::metadata(live.root.join("covers/empty.bin"))
            .unwrap()
            .len(),
        0
    );
}
