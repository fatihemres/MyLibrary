# MyLibrary — Ürün Fikirleri ve UX Talep Defteri

> **Repo kayıt sürümü:** 2026-10-22 · **Kaynak:** PO tarafından sağlanan `MYLIBRARY_IDEA_REGISTER_22102026_v0.43.md` (önceki v0.40/v0.42 zinciri). Bu, PO görüşmelerinin eksiksiz transkripti değil, kaynaklı ürün fikirleri envanteridir.
> **Güncel kapsam yetkisi:** [V2 roadmap](../v2/ROADMAP.md) ve [Decision Register](../DECISIONS.md). Fikirler bu iki sözleşmeyi değiştirmez.
> **Amaç:** Yalnız ürün fikirleri, PO talepleri, geçerli kapsam ve karar durumları. Kamera PoC'lerinin sayısal sonuçları, kod incelemeleri, test günlükleri ve DEV-01 hata dökümü ayrı, GitHub'a aktarılmamış **yerel araştırma/doğrulama arşivinde** korunur.
> **Yetki sınırı:** Bu dosya kod, commit, PR, entegrasyon, milestone kapatma veya release onayı değildir. Bu belge **fikirleri** izler; 22 Ekim V2 planlama kayıtları [PR #14](https://github.com/fatihemres/MyLibrary/pull/14) ile roadmap ve karar defterine entegre edildi. Entegrasyon **uygulama yetkisi değildir**.
> **Tamlık:** Bu, 20–22 Ekim 2026 arasında kaydedilmiş **ürün fikirlerinin** güncel envanteridir; eski `IDEA-0005` donanım kabul/test kaydı bir ürün fikri olmadığı için arşivlendi (ID yeniden kullanılmaz). Daha eski sohbetlerdeki bütün fikirlerin eksiksiz dökümü olduğu iddia edilmez.

## Kayıt ilkesi

Her bağımsız fikir için kalıcı ID kullanılır. **Doğrudan PO talebi**, **asistan önerisi** ve **araştırma hipotezi** birbirine karıştırılmaz. Güncel kapsam, eski önerileri sessizce silmez; değişiklik tarihi ve gerekçesi yazılır. Kabul edilmiş bir fikir, bağımsız kod geliştirme/entegrasyon izni değildir. Test metrikleri ve teknik çalışma günlükleri Idea Register'a yazılmaz; araştırma arşivine gider.

## IDEA-0001 — Kamera taramasında yönlendirme çerçevesi ve yeşil başarı bildirimi

- **İlk talep:** 17 Ekim 2026 (PO'nun 20 Ekim'de aktardığı tarih). **Kaynak:** PO tarafından aktarılan doğrudan UX talebi.
- **PO ifadesi:** “kullanıcının kamerayı açtığında barkodu bu alana getirin demesi, bir çerçeve olması ve barkod okunduğunda yeşile dönmesini istemiştim”.
- **İstenen davranış:** Canlı kamera görüntüsü üzerinde belirgin barkod hizalama alanı ve başarılı ISBN okumasında yeşil görsel geri bildirim.
- **İlişki:** V2 M2-D webcam UX takip çalışması.
- **Durum (22 Ekim):** Yerel `3696` UX adayı PO tarafından kısmen gözlendi; başarılı yeşil geri bildirim bildirildi. **Ayrı bir entegre GitHub değişikliği veya kapsamlı kabul doğrulanmadı.** Mevcut işi devam ettirmek için yeni izin gerekecek.
- **Teknik kanıt:** Araştırma arşivi, Kamera UX ve test gözlemi bölümünde. M2-D'nin ana kamera işlevinin GitHub'a daha önce entegrasyonu bu yerel UX adayının entegrasyonu anlamına gelmez.

## IDEA-0002 — USB/kamera ISBN okuması sonrası isteğe bağlı otomatik metadata sorgusu

- **İlk kayıt:** 20 Ekim 2026. **Kaynak:** PO tarafından aktarılan doğrudan ürün talebi.
- **PO sözleri:** “bir de şayet ISBN arattıysak bence otomatik olarak ISBN sorgusunu da yapması gerekiyor”; ayrıca kapsam için “ikisinde de olsun tabiki”.
- **İstenen davranış:** Hem USB hem kamera taramasında kullanıcı baştan **“tara ve kitap bilgilerini getir”** akışını seçtiğinde, geçerli ISBN'nin ardından ayrıca arama düğmesine basmadan Open Library/Google Books metadata önizlemesine geçmek.
- **Korunacak sınırlar:** Kullanıcı onayı olmadan ağa çıkma yok; çevrimdışı yalnız ISBN taraması kalır. Metadata **kendiliğinden uygulanmaz veya kaydedilmez**. Toplu sorgunun oran/iptal/başarısızlık davranışı ve tekrar eden fiziksel nüshaların ayrılması ayrıca tasarlanacak.
- **Durum:** [M2-F PLANNED](../v2/ROADMAP.md) (PR #14); uygulama için ayrıca PO izni gerekir. M2-E'nin kapsamıyla otomatik eşitleme yapılmaz.

## IDEA-0003 — Zor barkodlarda normal webcam okuma kalitesi / performansı

- **İlk kayıt:** 20 Ekim 2026. **Kaynak:** PO tarafından aktarılan fiziksel kullanım gözlemi ve kalite talebi.
- **PO sözleri:** “bir kitabı çok uzun süre sonra gördü ve okudu, biraz iyileştirilmesi lazım” ve “aydınlatma konusunda da benim görebildiğimi yazılımın daha iyi ayırt etmesi lazım bence”.
- **İstenen sonuç:** Normal webcam düşük kontrastlı/küçük barkodları makul kolaylıkla okuyabilsin; kullanıcı başarısızlıkta kilitlenmesin.
- **Güncel PO kararı — 22 Ekim 2026:** **ERTELENDİ / aktif araştırma durduruldu.** PO'nun son gerçek MyLibrary testinde telefon kamerası ve USB okuyucu çok iyi çalışıyor; normal webcam büyük/kolay barkodları okuyor ancak zor barkodlarda yetersiz. PO daha fazla kamera görüntüsü/algoritma/çözünürlük optimizasyonuna kaynak ayrılmamasını istedi.
- **Sınır:** Bu karar M2-D'deki entegre temel tarama özelliğini geri almaz, açık PoC kontrollerine geriye dönük PASS vermez, M2 milestone'unu kapatmaz. Yerel adaylar izinsiz birleştirilmez/silinmez.
- **Araştırma arşivi:** ZXing/ZBar A/B/C, EasyCamera/S22 Ultra-Iriun, çözünürlük, Still Photo r1–r4 ve DEV-01 kayıtlarının ayrıntıları başka dosyada saklandı.

## IDEA-0004 — Telefona ek uygulama kurmadan MyLibrary'ye ISBN taratma

- **İlk kayıt:** 21 Ekim 2026. **Kaynak:** PO tarafından aktarılan doğrudan ürün fikri.
- **PO talebi:** Iriun veya benzeri üçüncü taraf bir uygulama yükletmeden; dahili kamerası kötü olan veya **hiç kamerası olmayan PC** için telefonu MyLibrary'ye ISBN tarayıcı olarak bağlama seçeneği.
- **Güncel karar — 22 Ekim:** **Geleceğe bırakılan keşif.** Kamera performansında yeni çalışma yapılacaksa PO için öncelikli alternatif bu olabilir; şu anda uygulanması istenmiyor.
- **Öneri (PO kararı değil):** Telefon tarayıcısı/QR ile kısa ömürlü eşleşme ve yalnız doğrulanmış ISBN'nin aktarılması gibi uygulamasız seçenekleri araştırmak. Güvenli bağlam/TLS, telefon tarayıcısı izinleri, LAN/USB, Android/iOS ve Windows/macOS/Linux fizibilitesi henüz çözülmedi; hiçbir sunucu/bulut/hesap veya yeni ağ izni onaylanmış değildir.
- **Durum:** **KEŞİF / ERTELENDİ; implementasyon yetkisi yok.** Daha önce telefonun Iriun üzerinden webcam olarak iyi çalışması, doğrudan telefon entegrasyonunun zaten geliştirildiği anlamına gelmez.

## IDEA-0006 — Kitapların seri altında önerilmesi / onaylı seri oluşturma

- **İlk kayıt:** 22 Ekim 2026. **Kaynak:** Doğrudan PO ürün fikri; İnce Memed'in dört cildiyle yapılan USB tarama deneyiminden doğdu.
- **PO talebi:** Dört cilt ayrı kitaplar olarak kalsın, fakat aynı seriye ait oldukları bulunabilirse **“İnce Memed”** gibi bir seri adı ve **1–4 sıra bilgisi** önerilsin; kullanıcı onayıyla bir seri oluşturulabilsin veya mevcut seriye bağlanabilsin.
- **Ayrım:** Zaten kütüphanede bulunan kitaplara **toplu akıllı seri önerisi/organizasyonu**, ISBN sorgusu sırasında tek kitap için seri adayı göstermeye göre daha geniş bir fikir. Tamamı kendiliğinden M2-E'ye dahil edilmiş sayılmaz.
- **Sınırlar:** Başlık benzerliğiyle Edition/Physical Copy birleştirme yok; yayımcı dizisi edebi seri sanılmaz; tek ISBN'li çok ciltli baskılar parçalanmaz; kullanıcı onayı ve geri alınabilir düzenleme korunur.
- **Durum:** [M3 planlama](../v2/ROADMAP.md) yalnız kullanıcı onaylı mevcut Edition seri organizasyonunu kapsar; geniş katalog taraması için keşif/ayrı kapsam izni bekleniyor. `IDEA-0007` ile ilişkili ama eşdeğer değil.

## IDEA-0007 — ISBN metadata sırasında yalnız seri, cilt sırası ve tür önerisi

- **İlk kayıt:** 22 Ekim 2026. **Kaynak:** PO tarafından aktarılan doğrudan karar. Önce daha fazla bibliyografik alanı çekme fikri soruldu; aynı gün PO **kapsamı daralttı**.
- **Geçerli PO kararı:** “bence seri ve tür getirsek yeterli olur ya kalanına gerek yok, tabi olabiliyorsa”. ISBN metadata önizlemesine **seri adı**, kaynak açıkça destekliyorsa **seri/cilt sıra numarası**, güvenilir **genre/tür önerisi** eklenmesi isteniyor.
- **Kapsam dışı:** Yeni genel metadata zenginleştirmesi (çevirmen, ağırlık, boyut, Dewey, ilk yayın yılı, baskı bilgileri vb.) istenmiyor. **Mevcut** başlık, yazar, yayınevi, dil, ISBN, sayfa, kapak ve diğer hâlihazırdaki akışlar korunur.
- **Kaynak güvenilirliği:** Open Library konuları ve Google Books kategorileri doğrudan kesin tür demek değildir. Sağlayıcı seri/cilt bilgisini her kitap için vermeyebilir. Uydurma yok; çelişki veya belirsizlikte kullanıcının seçimi; kayıt önizlemesi **Apply** ve sonra ayrıca **Save**.
- **Roadmap kararı:** 22 Ekim'de PO seri/tür zenginleştirme kapsamının **V2 planına alınmasını** istedi; **“M2-E — Series & Genre Metadata Enrichment” dilim adı asistan önerisidir, ayrıca PO teyidine tabidir**. **PLANNED**, henüz geliştirme başlamadı. Bu planlama kararı [PR #14](https://github.com/fatihemres/MyLibrary/pull/14) ile GitHub roadmap/karar defterine işlendi. Bu, M2-E geliştirme yetkisi vermez.
- **Sınırlar:** Work tablosu yok; otomatik Edition/Copy merge, habersiz yeni seri kaydı/yeniden bağlama veya otomatik ağ isteği yok. `IDEA-0002` çevrimiçi tarama UX'i ve `IDEA-0006` katalog çapında seri önerisi ayrı.
- **Durum:** **PO V2 roadmap kapsam kararı mevcut; geliştirme, PR, entegrasyon ve M2 milestone kapanış yetkisi yok.**

## Kısa karar geçmişi

| Tarih | Değişiklik | Güncel sonuç |
| --- | --- | --- |
| 20 Ekim 2026 | Kamera rehberi, otomatik ISBN metadata, düşük ışıkta tarama talepleri kaydedildi | IDEA-0001–0003 |
| 21 Ekim 2026 | Telefona ek uygulama yükletmeden ISBN okutma talebi | IDEA-0004 — keşif |
| 22 Ekim 2026 | Gerçek USB okuyucu kullanımı | Eski IDEA-0005, **ürün fikri olmadığı için** doğrulama arşivine taşındı; ID saklı ve yeniden kullanılmayacak |
| 22 Ekim 2026 | Seriye otomatik öneri / oluşturma talebi | IDEA-0006 — geniş kapsam keşfi |
| 22 Ekim 2026 | Geniş metadata fikri **yalnız seri ve tür** olarak daraltıldı | IDEA-0007 — dar geçerli kapsam |
| 22 Ekim 2026 | Seri/tür V2 içinde bir gelişim aşamasına alınsın | IDEA-0007 — M2-E PLANNED; dokümantasyon PR #14 entegre |
| 22 Ekim 2026 | Kamera kalite/PoC optimizasyonuna zaman harcanmasın | IDEA-0003 — aktif araştırma durduruldu; IDEA-0004 ilerisi için saklandı |
| 22 Ekim 2026 | Fikirler ve araştırma/test günlükleri ayrıştırılsın | **v0.41 düzenleme**; IDEA-0005 test kaydı tamamen arşivde, yeni ürün kapsamı veya uygulama izni değil |

## Gelecekte fikir derlemesi için kaynaklar

Bu envanterin eski MyLibrary sohbetlerinin tüm PO mesajları, `MYLIBRARY_POST_V2_IDEA_VAULT_2026-10-19.md`, `MYLIBRARY_MASTER_HANDOFF_2026-10-19.md`, `MyLibrary_V2_M3_Product_Discovery.pdf` ve [Post-V2 Discovery](post-v2-discovery.md) ile eksiksiz birebir mutabakatı **henüz yapılmadı**. Bunlar gelecekte ayrı doğrulamayla eklenebilir; kaynak boşlukları tahminle tamamlanmaz.

**Arşivleme kuralı:** Bundan sonra araştırma çıktıları ve sayısal/cihaz bazlı test geçmişi ürün fikirlerinin içine eklenmeyecek. Idea Register yalnızca fikir tanımı, PO yönü, kapsam, öncelik ve durum taşıyacak. Geçmiş teknik kanıt ve ayrıntılar ilgili ayrı arşivde tutulacak.


## 22 Ekim 2026 — Fikirlerin V2 / V2 sonrası konumlandırılması (v0.42)

**Talep kaynağı:** PO, yapılabilir ve aşamayla ilişkili fikirlerin V2 roadmap'e taşınmasını,
uzun vadeli olanların V2 sonrasında kalmasını istedi. Aşağıdaki **planlama** uygulama/PR/
entegrasyon/release izni değildir. İlk taslak daha sonra [PR #14](https://github.com/fatihemres/MyLibrary/pull/14) ile yalnız planlama kaydı olarak entegre edildi; bu fikir defteri ayrıca teknik uygulama yetkisi vermez.

| Fikir / kaynak | Yerleştirme | Öncelik / zorluk (ön tahmin) | Kapsam sınırı |
| --- | --- | --- | --- |
| IDEA-0007 | **V2 M2-E** | Yakın, orta | Yalnız ISBN metadata'dan seri, sıra ve tür; onaylı preview |
| IDEA-0002 | **V2 M2-F (yeni planlama adayı)** | Yakın, düşük–orta | USB ve webcam'de açık seçilen tarama+lookup; gizli sorgu/batch fan-out yok |
| IDEA-0006 | **V2 M3 Organization** | İlgili aşamada, orta | Mevcut Edition'lara insan onaylı seri önerisi; katalog çapında sessiz değişim yok |
| UX-POST-01'in yalnız filtre görünümü | **V2 M3 Advanced Search** | İlgili aşamada, düşük–orta | Sade/geniş filtre; genel app modları ve onboarding dahil değil |
| SHARE-POST-01'in tek basit kartı | **V2 M5 export/reporting** | İlgili aşamada, düşük–orta | Manuel seçilen kitaplardan çevrimdışı PNG, mahremiyet önizlemesi |
| Tarih yerelleştirme (Idea Vault) | **V2 M6 QA/polish** | Düşük | Henüz çözülmediyse TR/EN created/updated formatı |
| IDEA-0001 | **PARKED, V2 aktif işine alınmadı** | Küçük UX işi olabilir ancak PO kamera işini durdurdu | Yerel UX adayı kendiliğinden entegre değil |
| IDEA-0003 | **PARKED, sürüm taahhüdü yok** | Kamera optimizasyonuna devam edilmez | Mevcut temel webcam korunur |
| IDEA-0004 | **V2 SONRASI — keşif** | Orta–yüksek / platform ve güvenlik belirsiz | Telefona uygulamasız bağlantı; ağ izni yok |
| UX-POST-01 geniş kapsamı | **V2 SONRASI — keşif** | Orta–yüksek | Genel Sade/Gelişmiş mod, onboarding ve gezinme yoğunluğu |
| PROFILE-POST-01 | **V2 SONRASI — keşif** | Orta | İsteğe bağlı yerel profil |
| GARDEN-POST-01, ACHIEVEMENTS-POST-01 | **V2 SONRASI — keşif** | Yüksek / M4 verisine bağımlı | Okuma bahçesi ve başarımlar |
| SHARE-POST-01 gelişmiş kartlar | **V2 SONRASI — keşif** | Orta–yüksek / M4 verisine bağımlı | Wrapped ve profil/okuma kartları |
| THEMES-POST-01 | **V2 SONRASI — araştırma** | Belirsiz | Premium model veya ödeme yetkisi yok |

**Sıra ilkesi:** M2-E ve M2-F, M2-D kamera performansını yeniden açmadan ayrı küçük dilimler
olarak değerlendirilebilir; M3, M5 ve M6 adayları ilgili ana milestone başlamadan kodlanmaz.
Zorluk etiketleri ölçülmüş iş günleri veya takvim sözü değildir. M2 hâlâ **OPEN**; M3–M6
kodlama izni verilmedi. Ayrı izinli PR ve exact-SHA fast-forward entegrasyonu gerekir.

**Kapsamın tarihi:** Önceki IDEA-0001–0007 metinleri ve eski karar geçmişi yukarıda korunur.
Bu yeni tablo onların yerine geçmez; yeni **roadmap yerleştirme** kararı ve yardımcı planlama notudur.
Teknik araştırma ve test sonuçları fikir defterine geri taşınmaz.


## 22 Ekim 2026 — GitHub roadmap entegrasyonu (tarihli checkpoint)

Önceki v0.42 dosyasındaki taslak durumunu [PR #14](https://github.com/fatihemres/MyLibrary/pull/14) güncelledi; fikirlerin ilk kayıt tarihçesi korundu. Bu tarihli SHA canlı durum yerine geçmez.

- **PR #14 MERGED:** `https://github.com/fatihemres/MyLibrary/pull/14`.
- **Güncel doğrulanmış `v2` HEAD:** `6caa620aed95d852a53ed3d413bc59d6f4f8a9f4` (22 Ekim 2026). **Planlama kayıtları** `docs/v2/ROADMAP.md`, `docs/DECISIONS.md`, `PROJECT_STATUS.md`, `VERIFICATION.md` ve `docs/product/post-v2-discovery.md` içine entegre edildi.
- `IDEA-0007` → **M2-E PLANNED**; `IDEA-0002` → **M2-F PLANNED**; `IDEA-0006` → **M3 PLANNED**. M3 filtre yoğunluğu, M5 küçük offline PNG kartı, M6 tarih yerelleştirme düzeltmesi doğru aşamalara planlandı. Ayrıntılı alt dilim adları/yaklaşımları PO kararıyla teknik öneri olarak ayrılıyor.
- `IDEA-0001` yerel kamera UX adayı ve `IDEA-0003` kamera kalite iyileştirmesi **PARKED**; `IDEA-0004` uygulamasız telefon bağlantısı **V2 SONRASI KEŞİF**. İlgisiz veya tamamlanmamış PoC otomatik entegre edilmiş sayılmaz.
- PR #14 **PR CI 7/7 PASS**. Entegrasyon sonrası V2 foundation `39816787394` ve CodeQL `39816787320` push CI kayıtları [GitHub Actions](https://github.com/fatihemres/MyLibrary/actions) üzerinden canlı kontrol edilir; bu dosya anlık CI durumunu garanti etmez.
- **M2 genel OPEN**, M3–M6 uygulamaya alınmamış durumda. Bu fikir kaydı kod, veri migrasyonu, yeni ağ izni, milestone kapanışı, PR entegrasyonu veya yayın onayı oluşturmaz.

Teknik denemeler ve gerçek donanım günlükleri fikir kaydına aktarılmadı; ayrı araştırma/doğrulama arşivinde kalır.
 
## 23 Ekim 2026 — M2-E entegrasyonu ve açık takipler (güncel durum)

Bu bölüm önceki 22 Ekim planlama kayıtlarını **tarihsel kayıtlar** olarak korur;
IDEA-0007'nin önceki PLANNED ifadesi artık güncel durum değildir. Yeni kapsam veya
M2/M3 milestone kapanışı yetkisi oluşturmaz.

- **IDEA-0007 / M2-E — ENTEGRE EDİLDİ:** PO, topluluk kaynaklı köşeli parantezli
  `[series:...]` etiketlerinden yalnız kullanıcı onaylı seri adı ve sınırlı tür
  önerisini 23 Ekim'de kabul etti. [PR #17](https://github.com/fatihemres/MyLibrary/pull/17)
  exact SHA `7c3430eacc47b1c5cf7996e9fbf71a4b25f636ef` ile `v2`'ye entegre edildi;
  son push CI V2 foundation **4/4 PASS**, CodeQL **3/3 PASS**.
  Güvenilir sıra bilgisi olmadığından cilt numarası uydurulmuyor. Google Books
  erişilebilirliği, ISBN metadata sağlayıcı hata semantiği ve daha güçlü seri keşfi
  mevcut teslimatın dışında; yeni ürün/teknik kapsam kararı gerektirir.
- **Google Books teknik takibi (yeni fikir ID'si değil):** 23 Ekim'de iki açık ISBN
  denemesinde HTTP **429**, `RESOURCE_EXHAUSTED/rateLimitExceeded` günlük kota hatası
  gözlendi. Diğer sorgular için genelleme yapılamaz; yeni API anahtarı, fallback
  sorgusu veya zorunlu ağ kullanımı onaylanmadı. Kanıt [metadata mimarisi](../architecture/metadata-providers.md)
  ve [doğrulama](../../VERIFICATION.md) belgelerinde.
- **IDEA-0006 / M3 seriler:** İnce Memed, Monte Cristo ve Sherlock Holmes PO testlerinde
  yeterli seri önerisi yoktu. Kullanıcının elindeki bağımsız Edition kayıtlarının
  onaylı seri organizasyonu M3 planlamasında kalır; bu M3 uygulama izni değildir.
- **IDEA-0008 — Çok ciltli kitap ile fiziksel nüsha önerisini ayırt eden UX (YENİ,
  KEŞİF / ONAYLANMADI):** PO'nun 23 Ekim çok ciltli kitap deneyiminde aynı takım ISBN'si
  için "nüsha ekle" seçeneği ile ayrı cilt/Edition oluşturma kararı karışabilir.
  İhtiyaç, kitap takımını bir birim olarak kataloglama, ayrı cilt Edition oluşturma
  ve aynı Edition'dan ikinci Physical Copy ekleme yollarının açıklığının incelenmesidir.
  Exact örnek ISBN'ler ve uyarı sınıfı doğrulanmadı; otomatik birleşme veya
  doğrulanmış uygulama hatası iddiası yok. Başlık benzerliğinden birleştirme,
  Work tablosu, ISBN'den cilt parçalayıp otomatik kayıt oluşturma veya kullanıcı
  kararını atlama yok. Bağımsız bir kapsam/öncelik ve PO uygulama kararı gerekir.
- **Diğer ertelenenler değişmedi:** IDEA-0001 kamera yönlendirme UX'i ve IDEA-0003
  webcam kalite optimizasyonu PARKED; IDEA-0002 M2-F yalnız PLANNED; IDEA-0004
  uygulamasız telefon taraması V2 sonrası keşif. CQ-02-B/C/D/E ve DEV-01 adayları
  [post-V2 keşif](post-v2-discovery.md) kapsamında ayrı yetki bekler;
  otomatik eski/yetim kapak silme onaylı değildir.

**Genel M2 OPEN.** Bu kayıt ne M2-F ne M3 geliştirmesini, ne de tag/release işlemlerini başlatır.
