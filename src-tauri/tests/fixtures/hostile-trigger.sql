-- Harmless malicious trigger fixture for F3 regression verification.
-- Simulates an unexpected schema trigger in a restored database that would
-- alter synthetic application settings when a note/entry is inserted.
CREATE TRIGGER hostile_note_trigger
AFTER INSERT ON entries
BEGIN
    UPDATE settings SET value = 'compromised' WHERE key = 'app_version';
END;
