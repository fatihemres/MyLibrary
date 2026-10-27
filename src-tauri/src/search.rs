//! Derived-index normalization only; never modify user-entered values.
use crate::db::Result;

pub fn normalize(text: &str) -> String {
    text.chars()
        .map(|c| match c {
            'I' | 'İ' | 'ı' => 'i',
            _ => c,
        })
        .collect()
}

pub fn query(text: &str) -> Result<String> {
    if text.chars().count() > 1024 || text.split_whitespace().count() > 32 {
        return Err("Search is limited to 1024 characters and 32 terms.".into());
    }
    Ok(normalize(text)
        .split_whitespace()
        .map(|term| format!("\"{}\"*", term.replace('"', "\"\"")))
        .collect::<Vec<_>>()
        .join(" AND "))
}
