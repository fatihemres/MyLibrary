# MyLibrary — DevEx çalışma devri / sohbetler arası handoff

**Tarih:** 2026-10-29 • **Sürüm:** v0.1 • **Konu:** MyLibrary Product & Engineering / geliştirici deneyimi iyileştirme
**Kalıcı GitHub takip noktası:** https://github.com/fatihemres/MyLibrary/issues/47
**Statü:** keşif ve araştırma; kurulum, entegrasyon veya ürün roadmap kararı DEĞİL.

## Yeni sohbette ilk yapılacaklar

1. `https://github.com/fatihemres/MyLibrary` için canlı **`v2` HEAD / PR / Issue / CI** doğrulaması yap. Bugünkü doğrulanmış referans `83bdc097256171e1f1b629685f28ad8312249374`; tarihli SHA güncellik garantisi değildir.
2. `AGENTS.md` → `PROJECT_STATUS.md` → `docs/DECISIONS.md` → `docs/v2/ROADMAP.md` → `VERIFICATION.md` → `docs/development/issue-review-workflow.md` oku. Bu handoff bu kanonik sözleşmeleri ikame etmez.
3. **Issue #47** açıklama ve tüm yorumlarını oku; bir önceki D0/D1 checkpoint’i varsa onu esas al, aynı araştırmayı sıfırdan başlatma.
4. D0 eksik olan **Windows kurulu ajan/skill/MCP/plugin/CLI sürümleri ve model-kota envanteri** ile D1 detaylı değerlendirmeye devam et. Yeni adayları exact repo ve kaynak deliliyle katalogla.
5. Ayrı PO izni olmadan tool kurma, script/skill çalıştırma, repo dosyası / CI / settings değiştirme, commit/PR/merge/release yapma.

## PO hedefi (29 Ekim 2026)

Kullanıcı MyLibrary geliştirme süreçlerinin daha akıcı, ekonomik, güvenli, ölçülebilir ve tutarlı olmasını istiyor. 33 yıldızlı repo incelenecek; karşılaştırılacak, alternatifleri araştırılacak; güvenlik, yarar, kapasite, model/ajan rolleri ve quota ile kıyaslanıp PO onayıyla aşamalı benimseme yapılacak. Codex, Antigravity, Figma ve Playwright gibi entegre araçlar bu kapsamda değerlendirilecek. Bu, yeni MyLibrary ürün özelliği geliştirme izni değildir.

## Yapılanlar

- 2026-10-29: Issue #47 **OPEN** oluşturuldu: 8 aşamalı D0–D7 araştırma/geliştirme yolu ve PO kapıları. İlk D0 yıldız envanteri ilerleme yorumu Issue #47 içinde.
- PO public GitHub stars JSON yükledi. Veri biçimi: tek nesne, sütun başına listeler. **33/33 benzersiz repo**; `License` listesi 32, 33. kayıt (`GoogleCloudPlatform/microservices-demo`) lisansı boş bıraktık. `Updated` kaynakta `pushed_at`; bütün `Archived=false` dosya anlık verisi. Bu eksiklikleri sessizce uydurma.
- D0 yıldız verisi normalize edildi ve **8 kategoriye** bölündü. Öncelikler **araştırma sırası**, kurulum önerisi değildir.
- D1 ilk 7 ajan/workflow adayı GitHub resmî README + docs üzerinden ilk kaynak incelemesinden geçti ve komit SHA’ları kaydedildi (aşağıda). Kod security audit / runtime benchmark henüz YOK.
- MyLibrary `package.json` halihazırda `playwright-core` ve `test:desktop` barındırıyor: yeni browser aracı eklemeden önce mevcut desktop smoke testinin boşluğunu incele.

## Dosya seti (bu sohbetten Proje Kaynaklarına kullanıcı tarafından eklenmeli)

| Dosya | İçerik | SHA256 |
|---|---|---|
| `MyLibrary_DevEx_Stars_FirstPass_2026-10-29.md` | Öncelik ve sekiz kategori (ilk tarama) | `A85A94236BAF1E315FF210B46BC3132894A7F808CF3A7732DC90A57450C319CC` |
| `MyLibrary_DevEx_Stars_Inventory_Normalized_2026-10-29.json` | 33 tam kayıt ve metadata | `1FE976614F248A69AA3CD9995DE747DF2915974CCCC6627531433FF28B6E3A3B` |
| `MyLibrary_DevEx_D1_Agent_Workflows_2026-10-29.md` | İlk 7 aday kaynak bazlı karşılaştırma | `8681A901D5D9C3E46BC45C793F59A349891EB77C83AE587159C4DEDD5DA8FBD6` |
| `MyLibrary_GitHub_Stars_2026-10-29.json` | PO’nun özgün stars dışa aktarımı | `444484353A4B628E1F1B42C1368A11E6B0538AF6457AAF3A817FAAD18D126E0A` |
| `MYLIBRARY_DEVEX_HANDOFF_2026-10-29_v0.1.md` | Bu devredilebilir handoff | öz-referans sebebiyle hash verilmedi |

## Gerekli güvenlik ve ürün sınırları

- Windows-first Tauri2/React/TypeScript/Rust/SQLite, local/offline-first; Edition ve Physical Copy ayrımı; Work table yok, otomatik/sessiz birleşme yok; kişisel DB/WAL/kapak/attachment/backup/restore bütünlüğü mutlak.
- Gerçek kişisel kitaplıkta test YASAK. Pilotlar yalnızca sentetik izole `MYLIBRARY_DATA_DIR` ve ayrı WebView2 profilinde; cloud, telemetri, yetkisiz ağ, API anahtarı ihracı ve prompt/tool güvenlik riskleri sıfır toleransla incelenir.
- `main`, `v1-maintenance`, `v1.0.0` korunur; kapsamlı branch/worktree ve exact SHA FF protokolü, review/CI ve gerçek Windows PO kabulü birbirinden ayrı. M2 #31 ve M3-B #26 halen open son bilinen hâl; canlı bakılmalı.
- 29 Ekim Step 5 yerel temizlikte `C:\Dev\MyLibrary` v2 FF güncellendi; M2-E/M3-A/M3-B worktree kaldırıldı. M2-F dirty worktree korundu; tarihi tüm Git/evidence arşivleri korundu; alakasız Codex worktree `C:\Users\emre-\.codex\worktrees\edec\MyLibrary` ASLA ellemeyeceğiz.
- Önceki 2026-10-29 Step 5 yerel stdout: 9.679 evidence dosyası, M2-E/M2-F yeni complete Git bundle doğrulaması, M3-A/M3-B ve PR16 tarihsel arşivleri. Veriler PO Windows çıktısından; asistan doğrudan local FS görmedi.

## 8 aşamalı araştırma yol haritası / son durum

| Aşama | Konu | Durum |
|---|---|---|
| D0 | Yıldızlı repo ve mevcut araç/model envanteri | **Kısmi**: 33 stars kayıtlı; kurulu araç/model/kota envanteri eksik |
| D1 | Repo kategorileri, exact ID ve çalışma alanına göre sınıflama | **İlk tarama tamam**; 7 aday ilk derin kaynak karşılaştırmasında |
| D2 | Alternatifleri, sürümleri, bakım/lisansları araştırma | Başladı; tamamlanmadı |
| D3 | Installer, supply-chain, egress, permission ve güvenlik | Planlandı, tam denetim yapılmadı |
| D4 | Sentetik görevlerde kontrollü baseline + pilot | Bekliyor; onay gerekli |
| D5 | Codex/Antigravity/model rol ve kota matrisi | Bekliyor |
| D6 | PO seçimleriyle aşamalı tool benimseme | Bekliyor |
| D7 | Onaylı repo governance / skill docs senkronizasyonu | Bekliyor; repo edit izni ayrı |

## D1 ilk grup: kaynak bazlı özet (karar değil)

| Aday | Kaynak snapshot Git HEAD | İlk gözlem |
|---|---|---|
| [github/spec-kit](https://github.com/github/spec-kit) | `99e047e9b48c3ecbbc5c3e530fb45bed671960bc` | İş akışı çatısı / SDD; Mevcut AGENTS/DECISIONS/ROADMAP sözleşmesiyle ikinci bir constitution veya scope otoritesi doğabilir |
| [obra/superpowers](https://github.com/obra/superpowers) | `2ce8aa15d05bd57213e6f746f953aafb7ded7a8b` | Tam süreç / skill sistemi; Otomatik aktivasyon, kendi worktree açma/bitirme/merge adımları PO explicit gate ve Codex App-managed worktree ile çakışabilir |
| [mattpocock/skills](https://github.com/mattpocock/skills) | `59db609eb1e18aaf59b63284d0e52255aff0c63c` | Modüler mühendislik skills; Setup skill dokümanları/ADR/issue tracker düzenini değiştirebilir |
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | `eb07f19f52c2669f2364897aaa293e2aaddd7b1c` | Yaşam döngüsü skill paketi; /ship ve auto-build davranışları kendi başına onay değil |
| [vercel-labs/skills](https://github.com/vercel-labs/skills) | `92a9a34ac3bf88e695e468b90c7bf32f163d32c8` | Skill paket yöneticisi (CLİ); Üçüncü taraf SKILL.md talimatlarının güvenli yürütülmesi garanti değil |
| [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) | `7801d061243d7b753bad0e0b3c057cd250b11755` | Kod sadeliği / inceleme skill; Yayıncının benchmark iddiaları bağımsız kanıt değil |
| [chaseai-yt/claudex-loop](https://github.com/chaseai-yt/claudex-loop) | `53cddc42e39346fb8c6d5d612281a3b1add14e66` | Cross-model plan/review orkestrasyonu; Claude ve Codex CLI kimlik doğrulaması ve token/kota |

## Öncelikli araştırma soruları

1. Mevcut Codex/Antigravity sürümleri, yetkileri, plugin/skill/MCP kaynakları ve maliyet/kota planları nedir? Bu bilgiler eksikse otomatik araç yükleme planı verme.
2. Hangi tekil skill, bugfix plan/review/test kalitesini **mevcut hiçbir repo onay kapısını bypass etmeden** artırır? Matt `tdd/diagnosing-bugs`, Addy `code-review`, Ponytail `review` adayları.
3. Spec Kit (preset/override ile uyarlanabilir) mi, mevcut AGENTS/Issue şablonları mı, Superpowers’ın seçilmiş becerileri mi proje için daha düşük sürtünmeli?
4. Cross-provider plan/review için bağımsızlık nasıl korunmalı? Claudex Loop gibi runner kaynakları ve yetki yüzeyleri önce araştırılmalı; model “APPROVED” asla PO yetkisi değildir.
5. Sonraki gruplar: Playwright CLI/Skills vs MCP vs mevcut desktop smoke; Chrome DevTools MCP telemetri; Cloudflare audit vs Strix; Graphify vs Graphiti vs repo hafızası; UI UX Pro Max vs Taste vs Figma.

## Kullanıcıya ilerleme raporu formatı

Her checkpoint için: **kapsam ve tarih; canlı GitHub HEAD; incelenen exact repo/commit; gerçekte okunan kaynak; kanıt vs varsayım; test/pilot yapıldı mı; fayda, risk, maliyet; önerilen statü (araştır/denemeye aday/izle/ele); PO onay kapısı; yeni handoff versiyonu; Issue #47 yorumu**.

## Yeni sohbeti başlatmak için kısa mesaj (aynen yapıştırılabilir)

> MyLibrary DevEx çalışmasına kaldığımız yerden devam ediyoruz. Önce GitHub Issue #47 ve yorumlarını, ardından `MYLIBRARY_DEVEX_HANDOFF_2026-10-29_v0.1.md` ve `MyLibrary_DevEx_D1_Agent_Workflows_2026-10-29.md` dosyalarını incele. Canlı MyLibrary `v2` HEAD/PR/CI durumunu doğrula. D0 stars envanteri 33 repo, D1 ilk 7 karşılaştırma kaynak bazında yapıldı; hiçbir tool henüz kurulmadı veya pilot test edilmedi. Mevcut repo PO güvenlik/onay sözleşmesini koruyarak kurulu skill/MCP/model envanteri ve sonraki karşılaştırma ile ilerle. Araştırma veya issue yorumunu ürün uygulama onayı sayma.

## Doğruluk / kaynak hiyerarşisi

1. Canlı GitHub `v2` exact SHA, gerçek CI/source/test ve PO kararları
2. `AGENTS.md`, `PROJECT_STATUS.md`, `docs/DECISIONS.md`, `docs/v2/ROADMAP.md`, `VERIFICATION.md` ve mevcut Issue/PR kanıtı
3. Bu tarihli DevEx handoff + Issue #47 (DevEx çalışma kaydı)
4. Önceki ChatGPT handoff ve star metadata kayıtları, tarihsel delil

**Sonuç:** D1 analizi devam ediyor. Benimseme, kurulum, model stratejisi ve ürün milestone kararı VERİLMEDİ.
