# DevEx source-data erratum — 2026-10-29

**Applies to:** PO-supplied `MyLibrary_GitHub_Stars_2026-10-29.json`, original normalized v0.1, first-pass report and handoff. **Research data correction; not a product change.**

## Observed evidence

- The raw export is one object with column arrays of length 33 for `Repo`, `URL`, `Description`, `Language`, `Stars`, `Updated`, `Archived`, but **length 32 for `License`**.
- **We do not know the missing license value's position**. The original normalization preserved 33 repository identities but assumed all 32 license values aligned to the first 32 rows and that the last license was missing. That alignment is an **unverified assumption** and can wrongly attribute licenses to other repositories.
- Repo READMEs and exported license values can differ. Neither GitHub stars nor badges alone establish a particular commit's legal license.

## Correction / authoritative use

1. Preserve the PO's raw export and the original normalized **v0.1** unchanged as historical evidence.
2. Use [normalized **v0.2**](MyLibrary_DevEx_Stars_Inventory_Normalized_2026-10-29_v0.2.json) for research. It maintains all 33 identities and other 33-length fields, but explicitly sets **every** `License` to `null` with `LicenseStatus=UNVERIFIED_POSITIONAL_ALIGNMENT`.
3. During D2, verify each shortlisted repository's exact ref, LICENSE file, any third-party license notices and relevant distribution restrictions separately. Store that evidence with a dated source ref; do not retroactively rewrite the raw export.
4. Other metadata fields (including counts and `pushed_at`) remain **user-provided snapshots**, not an independent live verification of all 33 repositories.

**Provenance:** This defect was discovered during repository library candidate integrity review. No tools were installed; no security scan/benchmark was performed.
