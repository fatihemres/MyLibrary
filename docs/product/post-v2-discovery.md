# MyLibrary — V2 Sonrası Ürün Fikirleri / Idea Vault

> **Repository discovery copy:** This Turkish discovery inventory is adapted from the PO-provided review package; it is not independently verified as a verbatim original inventory. **Not an approved roadmap or implementation authorization.** The canonical V2 scope is [ROADMAP.md](../v2/ROADMAP.md); accepted decisions are in [DECISIONS.md](../DECISIONS.md). Ideas remain opt-in, local-first and privacy-preserving.

> **19 Ekim 2026 · PO vizyonunu koruyan Discovery arşivi.** **Hiçbir madde milestone'a ekleme, teknik uygulama, ödeme modeli, yol haritası/deadline veya release onayı değildir.** Mevcut `docs/v2/ROADMAP.md` M3–M6 kapsamı değişmeden kalır. Geçmiş fikirlerin tamamının birebir transkripti değildir; erişilebilen ürün fikirlerini ve kararları tematik ve izlenebilir biçimde toplar.

## 1 — Ürünün değişmeyen kimliği

MyLibrary fiziksel kitapların baskılarını (**Edition**) ve somut **Physical Copy** nüshalarını ayrı yöneten, Windows-first/cross-platform, Tauri2+React/TS+Rust+SQLite, local/offline-first kişisel kütüphane uygulamasıdır. Kendi içinde zorunlu sunucu, hesap, senkronizasyon, telemetri veya sosyal ağ kurmayacaktır. Başlık eşitliği ile edition otomatik birleşmez; Work tablosu yok. Kütüphanedeki bilgiler, kapaklar, attachment'lar, backup/restore, V1 migrasyon kimlikleri korunur.

**Ana tasarım gerilimi:** Derin, güçlü kataloglama özellikleri korunurken yeni veya sade kullanım isteyen kullanıcıya hafif, güzel, rahat bir ilk deneyim sunmak. İkinci ana fikir: Kullanıcının kitaplığı *özel kalır*, ama kullanıcı isterse kitap/okuma yolculuğundan estetik görseller üretebilir.

## 2 — UX-POST-01: Sade / Gelişmiş arayüz (öncelikli discovery)

**PO fikri:** Kullanıcı ilk kurulumda daha kısa/sade veya daha kapsamlı filtrelerle, ihtiyacına göre özellikleri seçebilsin; sonra dilediği zaman ayarlardan değiştirebilsin. Sade görünüm yeni ayrı ürün, ayrı SQLite, eksik Edition/Copy semantiği, gizli migration veya özelliklerin veri silerek kapatılması **değildir**.

**Aday başlangıç seçimi:** `Sade başla` / `Kendim seçeyim` / `Tüm özellikleri göster`. Atlanabilir onboarding. Sade modda temel “kitap ekle / kütüphane / bul / okuma durumu”, gelişmiş modda koleksiyon, nüsha/konum, import/export, loan, metadata, tarayıcı, ayrıntılı filtre gibi yüzeyler daha görünür. Bunlar UX *örnekleri* olup hangi menünün gizleneceği PO kararıyla ve erişilebilirlik testleriyle belirlenecek.

**Kritik davranışlar:**

- Aynı kütüphane kaydı ve domain model; tek tek özelleştirilebilen navigasyon/feature visibility; geri alınabilir.
- Sade mod, verilerin silinmesi veya saklanamaması değil, **progressive disclosure** yaklaşımıdır; kullanıcı derin ayarlara ihtiyaç duyduğunda güvenle ulaşmalı.
- İlk deneyimde hızlı başarı, ancak düşük keşfedilebilirlik ve feature-lock yanılsamasından kaçınma; anlaşılır “Gelişmiş görünümde aç” kısa yolları.
- Dil (TR/EN), klavye, ekran okuyucu, odak, reduced motion, dar ekranlar; açıkça saklanan kullanıcı tercihi.
- Özellik devre dışı iken otomatik sunucu/ağ isteği olmamalı; kritik güvenlik/backup kontrolleri gizlenmemeli.

**Açık ürün soruları:** Minimum sade mod menüsü nedir? Kullanıcı tek tek modülleri açabilir mi? Wizard atlanırsa varsayılan görünüm ne? Basit ve Gelişmiş seçimleri ile bireysel özellik tercihleri nasıl bir arada tutulur? Kullanıcılar ilk kez açtığında fiziksel nüsha ayrımı nasıl net anlatılır?

## 3 — SHARE-POST-01: Dışarı paylaşılabilen statik görsel kartlar

**PO fikri:** Kullanıcı Top 5 kitabını, favori seçkilerini ve ilerideki okuma istatistiklerini güzel, kişisel paylaşılabilir görsellere dönüştürebilsin. İlk tercih: **yerelde/offline PNG üretimi**, isteğe bağlı kullanıcı kaydetmesi. Uygulama otomatik olarak Instagram'a veya başka siteye paylaşım yapmaz.

**Kavram taslakları (araştırma, kapsam taahhüdü değil):**

| Taslak | İçerik | Bağımlılık / etik sınır |
|---|---|---|
| Benim İlk 5 / Top 5 | Kullanıcının elle seçtiği 5 Edition / kitap kapağı; sıralama | Çoklu physical copy'yi yanlışlıkla çoğaltma; seçimi açık yap |
| Kitap önerim | Kapak, başlık, yazar; opsiyonel puan ve paylaşım için ayrı kısa not | Private okuma notunu otomatik dışarı aktarma |
| Yılın okuma özeti / Wrapped | Yıl içi tamamlanan kitaplar/sayfalar/türler | Geçmiş veri M4'te güvenilir biçimde tutulmalı; eksik veri uydurulmaz |
| Kütüphanemden seçkiler | Raf/tema/etikete göre manuel koleksiyon görseli | Fiziksel konum, içe aktarma yolu ve özel açıklamalar paylaşılmaz |
| Garden/Profile kartı | Kullanıcının isteğiyle başarı görseli | PII ve hassas alanlarda privacy preview |

**Aday çıktı formatları**: 1080×1350 (4:5), 1080×1080 (kare), 1080×1920 (story). Bunlar araştırma spesifikasyonu, **PO onaylı ekran ölçüsü/kabul kriteri değil**. Kapakları esnetme veya rastgele kırpma; farklı oranları doğal yerleştir. TR/EN, uzun kitap adları, ekran okuyucu/alternatif açıklama ve okunurluk üzerinde çalış.

**Privacy-first paylaşım süreci:** Kart şablonu → dahil edilecek kitap/alan seçimi → özel alanları gizleme → anlık önizleme → yerel dosyaya kaydet. Kullanıcı eylemi olmadan dış iletişim/üçüncü taraf API'si yok. **Fiziksel ev konumu, raf, özel not, ödünç alan kişi, iletişim, kapak/attachment dosya yolları, edinim fiyatı, backup path** varsayılan export'a dahil edilmez. PNG içine gereksiz metadata ekleme; örnek özel kitaplık verisini testte kullanma.

## 4 — PROFILE-POST-01: Yerel kişisel okur profili

Profilin anlamı giriş/kayıt zorunluluğu değil. Kullanıcı isterse takma ad, avatar, birkaç gönüllü okuma göstergesi, favoriler ve tema seçer. **Varsayılan gizli ve yerel**, dışa yalnızca seçilmiş alanlar çıkabilir. Profil kullanıcı verisinin ikinci, ayrı sunucu kopyası değildir.

Araştırma başlıkları: anonim profili kullanabilme, profil kartı varyantı, hangi istatistikler güvenilir, profil paylaşımında kişisel veri kontrolü, sil/geri al, başka cihaz olmadan PDF/PNG çıktılar.

**Ürün sınırı:** sosyal takipçiler, feed, beğeni, yorum, DM, kamuya açık zorunlu profil, kullanıcı veri madenciliği/remote profiling **yok**. Kullanıcı görseli kendi seçtiği dış kanalda paylaşır.

## 5 — GARDEN-POST-01: Yaşayan Kütüphane / Reading Garden

**PO'nun yaratıcı fikri:** Okuma yolculuğuna göre büyüyen sevimli, sakin bir çiçek/kelebek/kişisel doğa alanı. Çiçek açma, yeni türlerle çeşitlenme, mevsimler, kozmetik keşifler gibi fikirler. Alternatif metaforlar **Book Constellation** ve **Book Island**; hangisinin gerçek tasarım yönü olacağı henüz seçilmedi.

**Aday seviye tasarımı:** ilk okuma = tohum; devam eden okuma = yavaş büyüme; bitirilen kitap = çiçek açma; yeni tür keşfi = farklı renk/çiçek/kelebek; reread = özel kozmetik işaret; kullanıcıdan alınmayan verileri uydurma. Bu sadece örnek mapping.

**PO kararı açık:** Garden yalnızca **bitirilen kitaplar** ile mi gelişecek, yoksa **devam eden okuma ilerlemesi** de gelişmeyi etkileyecek mi? İlgili ilerleme manuel takibe mi, okumaların zaman kaydına mı, yoksa bir karma modele mi dayanmalı? Bu sorular ileride açılacak; varsayılan onaylanmadı.

**Olumsuz/cezalandırıcı döngü yok:** Okumaya ara verince çiçek ölmesi, streak sıfırlama, birikmiş kazanımların silinmesi, günlük baskı veya rekabetçi kıyas dayatılmamalı. Kullanıcı opt-in/opt-out yapabilmeli, reduced-motion/ses kapatma, erişilebilir alternatif/sade görünüm olmalı.

**Mimari doğruluk:** 3 fiziksel copy = otomatik 3 okuma ya da 3 başarı **değildir**. Etkinlikleri Edition/Physical Copy ile doğru ilişkilendiren okuma olayları/seansları ancak M4 veri modeli ve PO kararıyla tanımlanır; **Work tablosu eklenmez**, title match ile sessiz birleştirme yapılmaz. Aynı baskının tekrar okunması ayrı reread event olabilir ama istatistik algoritması onaylanmadan sayı taahhüdü yok.

## 6 — ACHIEVEMENTS-POST-01: Başarımlar / rozetler

**Aday temalar**: İlk Filiz (ilk okuma), Kök Salıyor (ilk bitirme), Tür Kaşifi (çeşitli türler), Eski Bir Dost (reread), Kütüphane Hafızası (not/alıntı), Mevsimler Geçerken (zaman içinde tutarlılık). Bunlar ismi ve tetikleyicisi **onaylanmış görevler değil**, yaratıcı prototip başlıkları. Çok kitap/çok hızlı okuma tek norm değildir; yavaş okuma ve okumaya ara verme cezalandırılmaz. Privacy-first/opt-in olmalı.

## 7 — THEMES-POST-01: Premium tema/şablon fikri

Paylaşım ve kişiselleştirme şablonlarının ileride opsiyonel ücretli tema paketleriyle genişletilip genişletilemeyeceği **pazar araştırması** olarak konuşuldu. Şu aşamada ödeme altyapısı, mağaza, fiyat, abonelik, kilitli ana özellik veya reklam kararı **yok**. Ücretsiz/ücretli sınırının PO kararı ve kullanıcı değeri kanıtı gerekir. Local-first gizliliği/fonksiyonellik hiçbir gelir fikri adına gevşetilemez.

## 8 — V2 M3–M6 ile bağımlılıklar (kapsam aktarımı DEĞİL)

| Milestone | Mevcut resmî yön | Post-V2 fikirlerle yalnızca kavramsal ilişki |
|---|---|---|
| M3 Organization | Manual/Smart Collections, Real Wishlist, Advanced Search, Visual Shelves | Seçki kartlarına/kullanıcı segmentasyonuna veri sağlayabilir, ama paylaşım/garden M3 kapsamına girmez |
| M4 Reading Intelligence | Sessions, Goals, Statistics, Rereads, Insights | Özet/Garden için geçmişin güvenilir kaydına bağımlılık olabilir; Garden M4 içine eklenmiş sayılmaz |
| M5 Data Ecosystem | Goodreads/StoryGraph/Calibre, PDF/HTML, Backup V2, opsiyonel encryption | Yerel export privacy ve backup kalitesiyle ortak ilkeler |
| M6 Productization | Native Windows/macOS/Linux, signing/updater, a11y/QA/release | Sonradan tasarlanacak görsellerin platform ve erişilebilirlik sınırları |

## 9 — Bağımsız iyileştirme adayları (milestone atanmamış; ayrı PO kapsam onayı gerekir)

- **CQ-02-B:** kapak image object-URL cache için bounded/in-flight dedup, aktif görsele zarar vermeden revoke, ölçümlü bellek baseline.
- **CQ-02-C:** orphan/managed cover file lifecycle, salt okunur analiz ve rapor; **otomatik silme yok**; backup/trash/history referanslarını koru.
- **CQ-02-D/E:** metadata provider hata semantiği, candidate quality, preview/selection UX; Google Books kalıcı görsel için telif/ToS araştırması; self-directed external downloader yok.
- **CQ-03:** metadata alan bazlı toplu uygula / karşılaştırma.
- **CQ-UX-LOC-01:** konum navigasyonu / hiyerarşi okunabilirliği.
- **DEV-01:** Windows Vite `.cache`/WebView2/Cookies `EBUSY` watcher çakışması.
- Detay ekranı created/updated tarihlerinin TR/EN yerelleştirmesi; tema/görsel estetik ve ergonomi; kaynak kapsamı ayrı.
- Paket, 17 Ekim `MYLIBRARY_WORKFLOW_PLAYBOOK_DRAFT_2026-10-17.md` taslağına atıf yapıyor. Asıl belge bu incelemede mevcut değildi; güncel review durumu doğrulanmadı ve atıf yeni kod yetkisi vermez.

## 10 — M3 Discovery'deki PO yönü ve açık kararların sürekliliği

Paket, `MyLibrary_V2_M3_Product_Discovery.pdf` belgesine atıf yapıyor; PDF bu incelemede mevcut değildi, sayfa sayısı ve içeriği bağımsız doğrulanmadı. **Öneri satırları otomatik onay değildir.** Aşağıdaki Wishlist/export yönleri 19 Ekim PO Master Handoff'unda kayıtlı discovery yönleri olarak korunur; asıl handoff burada bağımsız incelenmedi ve ayrıca bir yeniden onay tarihi ileri sürülmez. Bunlar M3 implementation kapsamı değil, PO discovery yönüdür:

- Wishlist gerçek ayrı sahip olunmayan kayıt, fake Copy değil. Satın alınca kullanıcı kararıyla Edition/Copy; Wishlist kaydı **Fulfilled/Purchased** olarak arşivlenir ve geçmiş korunur (PO yönü).
- Birden çok retailer link ve para birimi bazlı bütçe özetinin M3 içinde ele alınması PO tercihi; şema/UX/test ayrıca scoped onay ister.
- Katalog export varsayılan **Library**; kullanıcı Wishlist/Collections gibi grupları seçebilir; **All Data** opsiyonu araştırılır. Tam Backup ≠ katalog export.
- Paketin PDF'ye atfettiği PO-03 (wishlist ögeleri manual collection üyesi olabilir mi?), PO-04 (Visual Shelf cover/spine kapsamı) ve schema/UX önerileri PO teyidi gerektirir; pdf'deki “recommended default” kullanıcı onayı yerine geçmez.
- M3 başlangıcı henüz onaylanmadı. M2 resmi kapanış kararı ayrı.

## 11 — Yalnızca aday sıraya koyma (öncelik/roadmap kararı değil)

Araştırmada tartışılan doğal veri bağımlılığı: `[Sade/Gelişmiş keşfi] → [yerel kart üretimi + Reader Profile] → [isteğe bağlı Achievements/Garden] → [premium template pazar araştırması]`. Bu **uygulanacak sıralama değildir**; PO yol haritasını ve milestone tarihlerini değiştirmez.

## 12 — Kullanıcıya daha sonra sorulabilecek tekil PO kararları

- M2 milestone kapanışını entegre M2-D ve kalan acceptance kriterleriyle nasıl ele alacağız?
- Post-V2 için Sade/Gelişmiş görünüm detay seviyesi nasıl olacak; feature bazlı seçim kaç katmanlı?
- Garden'ın gelişim sinyali ongoing progress içerir mi?
- Profil paylaşımında hangi alanlar opt-in, hangileri kesin dışarıda?
- Card templates içinde öncelik Top5 mi, yıllık özet mi, kitap önerim mi?
- Premium şablonlar için hiç gelir modeli araştırmasına girilsin mi?
- Bu fikirler V2 sonrasının hangi ürünü/sürümü için değerlendirilir? **Henüz karar yok**.
