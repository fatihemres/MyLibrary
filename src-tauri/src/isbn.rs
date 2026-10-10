#[derive(Debug, PartialEq, Eq)]
pub struct Isbn {
    pub isbn13: String,
    pub isbn10: Option<String>,
}
fn check13(body: &str) -> char {
    let sum: u32 = body
        .bytes()
        .enumerate()
        .map(|(i, c)| u32::from(c - b'0') * if i % 2 == 0 { 1 } else { 3 })
        .sum();
    char::from_digit((10 - sum % 10) % 10, 10).unwrap()
}
fn check10(body: &str) -> char {
    let sum: u32 = body
        .bytes()
        .enumerate()
        .map(|(i, c)| u32::from(c - b'0') * (10 - i as u32))
        .sum();
    let n = (11 - sum % 11) % 11;
    if n == 10 {
        'X'
    } else {
        char::from_digit(n, 10).unwrap()
    }
}
pub fn parse(input: &str) -> Result<Isbn, String> {
    let v: String = input
        .chars()
        .filter(|c| *c != ' ' && *c != '-')
        .map(|c| c.to_ascii_uppercase())
        .collect();
    let b = v.as_bytes();
    if b.len() == 10
        && b[..9].iter().all(u8::is_ascii_digit)
        && (b[9].is_ascii_digit() || b[9] == b'X')
        && check10(&v[..9]) as u8 == b[9]
    {
        let body = format!("978{}", &v[..9]);
        return Ok(Isbn {
            isbn13: format!("{body}{}", check13(&body)),
            isbn10: Some(v),
        });
    }
    if b.len() == 13
        && b.iter().all(u8::is_ascii_digit)
        && (v.starts_with("978") || v.starts_with("979"))
        && check13(&v[..12]) as u8 == b[12]
    {
        let isbn10 = if v.starts_with("978") {
            Some(format!("{}{}", &v[3..12], check10(&v[3..12])))
        } else {
            None
        };
        return Ok(Isbn { isbn13: v, isbn10 });
    }
    Err("metadata.invalidIsbn".into())
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn checksums_and_conversion() {
        for (ten, thirteen) in [
            ("0306406152", "9780306406157"),
            ("080442957X", "9780804429573"),
        ] {
            assert_eq!(parse(ten).unwrap().isbn13, thirteen);
            assert_eq!(parse(thirteen).unwrap().isbn10.as_deref(), Some(ten));
        }
        assert_eq!(
            parse(" 0-8044-2957-x ").unwrap().isbn10.as_deref(),
            Some("080442957X")
        );
        assert!(parse("9791090636071").unwrap().isbn10.is_none());
    }
    #[test]
    fn invalid_identifiers() {
        for v in [
            "0306406153",
            "0804429571",
            "9780306406158",
            "4006381333931",
            "036000291452",
            "X306406152",
            "978030640615X",
            "💣000000000",
            "978\n0306406157",
        ] {
            assert!(parse(v).is_err(), "{v}");
        }
    }
}
