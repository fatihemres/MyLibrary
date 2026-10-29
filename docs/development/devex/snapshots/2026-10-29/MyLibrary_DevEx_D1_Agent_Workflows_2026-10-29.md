# MyLibrary DEVEX — D1 ilk grup: ajan iş akışı ve skill sistemi

**Sürüm:** araştırma notu v0.1 • **Tarih:** 2026-10-29 • **Takip:** https://github.com/fatihemres/MyLibrary/issues/47
**Kaynak niteliği:** araçların GitHub README ve resmî belgeleri, belirtilen HEAD SHA değerleri, MyLibrary `AGENTS.md` (83bdc097...). Bu belge statik kaynak incelemesidir; pilot, kurulum, güvenlik denetimi veya bağımsız benchmark değildir.

## Kısa sonuç

- **Var olan sözleşmeyi koru:** MyLibrary `AGENTS.md`, `docs/DECISIONS.md`, `docs/v2/ROADMAP.md`, `PROJECT_STATUS.md` ve `VERIFICATION.md` otoritedir. Haricî tool/skill bunları override edemez.
- **Tek bir tam workflow seçmemek:** Spec Kit ve Superpowers gibi kapsamlı sistemler ile Matt Pocock / Addy Osmani gibi modüler skill paketleri ayrı değerlendirilmelidir.
- **Pilot önerisi (karar değil):** 1 adet küçük mühendislik skill + 1 adet plan/inceleme metodolojisi; araçsız baseline ile aynı sentetik görevlerde deneme. Yeni çalışma için önce kurulu skill/MCP/agent envanteri gerekir.
- **Yüksek riskli taraflar:** otomatik iş yürütme, repo üzerinde yeni constitution/branch/worktree üretimi, hook/installer, CLI oturum hakları, repo verisinin dışarı taşınması ve PO approval sözleşmesinin gölgelenmesi.

## İlk karşılaştırma (7 repo)

| Aday (HEAD) | Ne sunuyor? | MyLibrary için temel çatışma | Kanıt değeri / önerilen pilot | Durum |
|---|---|---|---|---|
| [github/spec-kit](https://github.com/github/spec-kit/tree/99e047e9b48c) `99e047e9b` | İş akışı çatısı / SDD: Spec → plan → tasks → implement; constitution, extension, preset, workflow; fikir değerlendirme ve bug triage yolu | Mevcut AGENTS/DECISIONS/ROADMAP sözleşmesiyle ikinci bir constitution veya scope otoritesi doğabilir; otomatik implement aşaması izinleri aşabilir | Önce read-only spesifikasyon/assessment örneği; eski iş üzerinde uygulama değil | ARAŞTIR / sınırlı pilot adayı |
| [obra/superpowers](https://github.com/obra/superpowers/tree/2ce8aa15d05b) `2ce8aa15d` | Tam süreç / skill sistemi: Brainstorm, plan, TDD, ajan-alt görev ve code review; Codex ve Antigravity adapter | Otomatik aktivasyon, kendi worktree açma/bitirme/merge adımları PO explicit gate ve Codex App-managed worktree ile çakışabilir | Sadece TDD/review tekniklerini kurulum olmadan incele | ARAŞTIR / full kurulum şimdilik değil |
| [mattpocock/skills](https://github.com/mattpocock/skills/tree/59db609eb1e1) `59db609eb` | Modüler mühendislik skills: grill-with-docs, tdd, diagnosing-bugs, architecture survey, issue triage | Setup skill dokümanları/ADR/issue tracker düzenini değiştirebilir; mevcut sözleşme ve issue schema korunmalı | Önce tdd + diagnosing-bugs tekil SKILL.md ve yönetişimde çakışma analizi | YÜKSEK ÖNCELİK / izole skill pilotu |
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills/tree/eb07f19f52c2) `eb07f19f5` | Yaşam döngüsü skill paketi: /spec, /plan, /build, /test, /review, /ship ve tekil mühendislik skillleri | /ship ve auto-build davranışları kendi başına onay değil; tek-skill dağıtımında paylaşılan references eksik olabilir (repo issue #361) | Tekil review/TDD örneği; bağımlılık referanslarının tamlığını sınama | ARAŞTIR / seçerek pilot |
| [vercel-labs/skills](https://github.com/vercel-labs/skills/tree/92a9a34ac3bf) `92a9a34ac` | Skill paket yöneticisi (CLİ): Skills keşfi, tek tek yükleme, denetleme, kaldırma, skill init; çoklu ajan hostu | Üçüncü taraf SKILL.md talimatlarının güvenli yürütülmesi garanti değil; experimental sync paketlerden talimat taşır; npx latest sürüm kayması | Önce güvenilir kaynak/tam pin ve scope ile local/dry plan; kurulumu sonraya | ARAŞTIR / kurulum köprüsü adayı |
| [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail/tree/7801d061243d) `7801d0612` | Kod sadeliği / inceleme skill: Gereksiz kodu azaltma, test şartı, risk odaklı diff ve repo audit | Yayıncının benchmark iddiaları bağımsız kanıt değil; Codex plugin yaşam döngüsü hooks/izin incelemesi; AGENTS.md üstüne yazılmamalı | Karşılaştırmalı küçük düzeltme + regression test görevi, hooks OFF | ARAŞTIR / bağımsız benchmark |
| [chaseai-yt/claudex-loop](https://github.com/chaseai-yt/claudex-loop/tree/53cddc42e393) `53cddc42e` | Cross-model plan/review orkestrasyonu: Bağımsız plan eleştirisi + cross-provider son inceleme, log ve hash-bound approval | Claude ve Codex CLI kimlik doğrulaması ve token/kota; modelin APPROVED çıktısı PO onayı veya GitHub Approve değil; build/delegation önce ayrı yetki | Önce yalnızca read-only plan review örneği, otomatik build devre dışı | ARAŞTIR / mevcut review protokolüyle kıyasla |

## Kaynakça / doğrudan incelenen belgeler

- [github/spec-kit README](https://github.com/github/spec-kit/blob/99e047e9b48c3ecbbc5c3e530fb45bed671960bc/README.md) — `99e047e9b48c3ecbbc5c3e530fb45bed671960bc`
- [obra/superpowers README](https://github.com/obra/superpowers/blob/2ce8aa15d05bd57213e6f746f953aafb7ded7a8b/README.md) — `2ce8aa15d05bd57213e6f746f953aafb7ded7a8b`
- [mattpocock/skills README](https://github.com/mattpocock/skills/blob/59db609eb1e18aaf59b63284d0e52255aff0c63c/README.md) — `59db609eb1e18aaf59b63284d0e52255aff0c63c`
- [addyosmani/agent-skills README](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/README.md) — `eb07f19f52c2669f2364897aaa293e2aaddd7b1c`
- [vercel-labs/skills README](https://github.com/vercel-labs/skills/blob/92a9a34ac3bf88e695e468b90c7bf32f163d32c8/README.md) — `92a9a34ac3bf88e695e468b90c7bf32f163d32c8`
- [DietrichGebert/ponytail README](https://github.com/DietrichGebert/ponytail/blob/7801d061243d7b753bad0e0b3c057cd250b11755/README.md) — `7801d061243d7b753bad0e0b3c057cd250b11755`
- [chaseai-yt/claudex-loop README](https://github.com/chaseai-yt/claudex-loop/blob/53cddc42e39346fb8c6d5d612281a3b1add14e66/README.md) — `53cddc42e39346fb8c6d5d612281a3b1add14e66`
- [Spec Kit özelleştirme belgeleri](https://github.github.io/spec-kit/guides/customization.html): proje override ve yönetilen preset/extension/workflow yolları.
- [Spec Kit mevcut projeye adaptasyon](https://github.github.io/spec-kit/guides/customization.html) — bağımsız repo yapısını koruyabilme ihtimali; somut pratik henüz test edilmedi.
- [Superpowers Codex App worktree uyumluluk tasarımı](https://github.com/obra/superpowers/blob/main/docs/superpowers/specs/2026-03-23-codex-app-compatibility-design.md) — Codex App çalışma ortamı ile worktree komutlarının çakışma riski (tasarım belge delili, mevcut sürümde çalışma testi değil).
- [Addy Osmani skill tekli kurulum referans boşluğu](https://github.com/addyosmani/agent-skills/issues/361) — README açıkça uyarıyor.

## Pilot taslağı (yalnızca onay öncesi tasarım)

**Pilot A — doğrulanabilir küçük bugfix / test disiplini:** MyLibrary ile aynı teknolojiye sahip **sentetik bir kopya** üzerinde izolasyonlu React/TS veya Rust hata örneği. 1) araçsız ajan, 2) tekil TDD skill, 3) Ponytail-lint/review prompt etkisi. Kapsam sabit; yanlış regresyon, test kalitesi, gereksiz satır/diff, kullanıcı izin ihlali, süre, token/kota ölçülecek.
**Pilot B — discovery/spec kalitesi:** Bir var olan Issue için salt-okunur plan üretimi; 1) mevcut MyLibrary yöntemi, 2) Spec Kit assessment/spec aşaması, 3) bir modüler grill-with-docs yaklaşımı. Ürün kapsamını genişletme ve repo/Issue otomatik yazma yasak; mevcut PO kararlarının doğru taşınması ölçülecek.
**Pilot C — review bağımsızlığı:** Var olan sentetik PR diff ve ekili hata üzerinden model A plan inceleme + model B kod inceleme, `claudex-route`/manuel handoff karşılaştırması; model `APPROVED` sonucu gerçek GitHub Review veya PO entegrasyon izni sayılmaz.

## Geçiş kapıları

1. D0 cihaz envanteri (hangi CLI sürümleri, plugin/skill/MCP kurulu, kullanıcı kotası/planı, ağ egress ve gizlilik politikaları) tamamlanmalı.
2. Kurulum komutları ve skill içerikleri sabit exact SHA’dan, read-only tedarik zinciri denetimi yapılmalı; otomatik update, hook ve telemetri varsayılanlarına bakılmalı.
3. Kaynak repo ve eklenti varsayılanları gerçek MyLibrary repo yetkilerini gölgelerse pilot reddedilecek.
4. Pilot için PO’dan ayrı kapsam/onay; izole sentetik MYLIBRARY_DATA_DIR ve ayrı WebView2 profili; release/merge yetkisi yok.
5. Ölçülen faydadan sonra `adopt / pilot / watch / reject` kararı PO’ya döner; kalıcı repo sözleşmeleri ancak ayrı doküman PR izniyle güncellenir.

**D1 durum:** Bu 7 adayda README ve yakın dokümanların ilk turu yapıldı, exact GitHub `HEAD` snapshot kaydı alındı. Tam kaynak bağımlılık, saldırı yüzeyi, installer/hook ve release uyumu incelenmedi. Diğer 26 adayın derin incelemesi bekliyor.
