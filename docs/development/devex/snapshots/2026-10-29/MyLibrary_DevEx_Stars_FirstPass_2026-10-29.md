# MyLibrary — DevEx / GitHub Stars Envanteri

**Tarih:** 2026-10-29  
**Kaynak:** PO'nun verdiği `MyLibrary_GitHub_Stars_2026-10-29.json`  
**Takip:** https://github.com/fatihemres/MyLibrary/issues/47  
**GitHub canlı başvuru SHA'sı:** `83bdc097256171e1f1b629685f28ad8312249374` (kayıt anında kontrol edildi)

## Veri bütünlüğü ve kapsam

- Kaynak JSON, satır bazında değil tek nesnede sütun-dizileri biçiminde. 33 Repo/URL/Description/Language/Stars/Updated/Archived alanı varken License **32** eleman içeriyor.
- Dolayısıyla basit `zip()` ile okuma **33. kaydı sessizce düşürür**; burada 33 satır tamamlandı, son lisans `null` olarak bırakıldı. Aradaki null/alan hizası sorunu kaynak sistemde ayrıca teyit edilmelidir.
- Kaynak 33 benzersiz repo bildiriyor; tüm `Archived` alanları false. Bu, tek başına güvenli ya da aktif bakım yapıldığı anlamına gelmez.
- `Updated` alanı dışa aktarmada `pushed_at` olarak kaydedilmiştir. Repo güncelleme tarihi olarak geniş anlamda yorumlanmamalıdır.
- Yıldız, dil ve lisans alanları envanter verisidir; ürün güvenilirliği/kalitesi veya hukuki kullanıma uygunluk kararı değildir.
- İlk turda bazı resmi README'lerin açılış bölümleri incelendi; **tüm kaynak kodlar, release/issue geçmişi, bağımlılıklar ve testler henüz incelenmedi**.

## Sınıflandırma — 33/33

**Öncelik yorumları:** Dalga 1 = önce derin araştırma; Dalga 2 = daha sonra karşılaştırma; düşük uygunluk = MyLibrary V2 için önceliksiz. Hiçbiri kurulum/benimseme onayı değildir.

### Ajan iş akışı ve metodoloji (9)

| Repo | İlk araştırma önceliği | MyLibrary açısından ilk not |
|---|---|---|
| [mattpocock/skills](https://github.com/mattpocock/skills) | Dalga 1 | Küçük ve birleştirilebilir mühendislik skill'leri; yerel yönetişime uyum araştırılacak. |
| [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills) | Dalga 2 | İşlev, uyumluluk, güven ve çakışma açısından ikinci tur kaynak incelemesi gerekli. |
| [github/spec-kit](https://github.com/github/spec-kit) | Dalga 1 | Spec/bug fixing/idea assessment; PO onay kapılarının yerine geçemez. |
| [obra/superpowers](https://github.com/obra/superpowers) | Dalga 2 | İşlev, uyumluluk, güven ve çakışma açısından ikinci tur kaynak incelemesi gerekli. |
| [chaseai-yt/claudex-loop](https://github.com/chaseai-yt/claudex-loop) | Dalga 2 | İşlev, uyumluluk, güven ve çakışma açısından ikinci tur kaynak incelemesi gerekli. |
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | Dalga 1 | Geliştirme yaşam döngüsü skill'leri; /ship gibi otomatik eylemler sınırlandırılmalı. |
| [affaan-m/ECC](https://github.com/affaan-m/ECC) | Dalga 2 | İşlev, uyumluluk, güven ve çakışma açısından ikinci tur kaynak incelemesi gerekli. |
| [ruvnet/ruflo](https://github.com/ruvnet/ruflo) | Dalga 2 | Sürü/ajan orkestrasyonu; fazla otonomi, araç yetkileri ve maliyet sınırları. |
| [Donchitos/Claude-Code-Game-Studios](https://github.com/Donchitos/Claude-Code-Game-Studios) | Düşük doğrudan uygunluk / sonraya bırak | İşlev, uyumluluk, güven ve çakışma açısından ikinci tur kaynak incelemesi gerekli. |

### Skills, prompt ve kod sadeliği (4)

| Repo | İlk araştırma önceliği | MyLibrary açısından ilk not |
|---|---|---|
| [vercel-labs/skills](https://github.com/vercel-labs/skills) | Dalga 1 | Skill keşif/yükleme CLI'sı; kurulan skill ayrı güvenlik denetimi gerektirir. |
| [f/prompts.chat](https://github.com/f/prompts.chat) | Dalga 2 | İşlev, uyumluluk, güven ve çakışma açısından ikinci tur kaynak incelemesi gerekli. |
| [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) | Dalga 2 | İşlev, uyumluluk, güven ve çakışma açısından ikinci tur kaynak incelemesi gerekli. |
| [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) | Dalga 1 | Az ama güvenli kod/hata yakalama iddiaları bağımsız test edilecek; export lisans NOASSERTION, LICENSE MIT. |

### Güvenlik ve tersine mühendislik (3)

| Repo | İlk araştırma önceliği | MyLibrary açısından ilk not |
|---|---|---|
| [cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill) | Dalga 1 | Kapsama dayalı, bağımsız doğrulama; audit pilotu için güçlü aday. |
| [usestrix/strix](https://github.com/usestrix/strix) | Dalga 2 | Otonom güvenlik aracı; Docker, API anahtarı ve sandbox/egress politikası önemli. |
| [morluto/rea](https://github.com/morluto/rea) | Dalga 2 | İşlev, uyumluluk, güven ve çakışma açısından ikinci tur kaynak incelemesi gerekli. |

### Dokümantasyon, bağlam ve hafıza (4)

| Repo | İlk araştırma önceliği | MyLibrary açısından ilk not |
|---|---|---|
| [upstash/context7](https://github.com/upstash/context7) | Dalga 1 | Güncel sürüm dokümantasyonu; uzak servis/API anahtarı ve gizlilik sınırı. |
| [Graphify-Labs/graphify](https://github.com/Graphify-Labs/graphify) | Dalga 1 | Yerel AST tabanlı kod grafiği; cloud ve çoklu dosya indekslemesi ayrı değerlendirme. |
| [getzep/graphiti](https://github.com/getzep/graphiti) | Dalga 2 | Zaman farkındalıklı bağlam grafiği; mevcut repo hafızasını gereksizce ikilememeli. |
| [thedotmack/claude-mem](https://github.com/thedotmack/claude-mem) | Dalga 2 | Oturum hafızası; otomatik toplama ve hassas veri sızıntısı incelemesi. |

### Tarayıcı otomasyonu ve debug (2)

| Repo | İlk araştırma önceliği | MyLibrary açısından ilk not |
|---|---|---|
| [ChromeDevTools/chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) | Dalga 1 | DevTools performans/console/network; README varsayılan usage statistics bildiriyor. |
| [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp) | Dalga 1 | MCP vs Playwright CLI/Skills vs mevcut desktop: test karşılaştırması. |

### UI/UX ve yaratıcı üretim (4)

| Repo | İlk araştırma önceliği | MyLibrary açısından ilk not |
|---|---|---|
| [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | Dalga 1 | UI stil ve tasarım sistemi rehberliği; Windows native UX ve erişilebilirlikle karşılaştırma. |
| [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | Dalga 1 | Web görsel kalite/estetik; desktop form ekranlarına aktarım kanıtlanmalı. |
| [storytold/artcraft](https://github.com/storytold/artcraft) | Düşük doğrudan uygunluk / sonraya bırak | İşlev, uyumluluk, güven ve çakışma açısından ikinci tur kaynak incelemesi gerekli. |
| [Jakeschincariol/replica-skill](https://github.com/Jakeschincariol/replica-skill) | Dalga 2 | İşlev, uyumluluk, güven ve çakışma açısından ikinci tur kaynak incelemesi gerekli. |

### Alternatif ajan ve internet erişimi (2)

| Repo | İlk araştırma önceliği | MyLibrary açısından ilk not |
|---|---|---|
| [CodebuffAI/freebuff](https://github.com/CodebuffAI/freebuff) | Dalga 2 | Alternatif ajan; hesap, reklam destekli hizmet ve repo erişim sınırları araştırılmalı. |
| [Panniantong/Agent-Reach](https://github.com/Panniantong/Agent-Reach) | Dalga 2 | Sosyal kaynak erişimi; README tarayıcı oturumlarını kopyalamayı anlatıyor: yüksek güvenlik riski. |

### Yatay kaynak / MyLibrary dışı (5)

| Repo | İlk araştırma önceliği | MyLibrary açısından ilk not |
|---|---|---|
| [supabase/supabase](https://github.com/supabase/supabase) | Düşük doğrudan uygunluk / sonraya bırak | Host edilmiş Postgres/Auth modeli, MyLibrary local SQLite çekirdeğine uygun değil. |
| [xM4ddy/OFGB](https://github.com/xM4ddy/OFGB) | Düşük doğrudan uygunluk / sonraya bırak | Windows reklam ayarı; MyLibrary geliştirme akışında doğrudan değer yok. |
| [mnfst/awesome-free-llm-apis](https://github.com/mnfst/awesome-free-llm-apis) | Dalga 2 | API sağlayıcı listesi; fiyat/limit/ticari kullanım iddiaları sağlayıcıda teyit edilmeli. |
| [Crosstalk-Solutions/project-nomad](https://github.com/Crosstalk-Solutions/project-nomad) | Düşük doğrudan uygunluk / sonraya bırak | İşlev, uyumluluk, güven ve çakışma açısından ikinci tur kaynak incelemesi gerekli. |
| [GoogleCloudPlatform/microservices-demo](https://github.com/GoogleCloudPlatform/microservices-demo) | Düşük doğrudan uygunluk / sonraya bırak | Cloud-native örnek mimari, mevcut offline-first desktop kapsamı dışı. |

## İlk teknik ayrımlar

1. **Var olan testleri yeniden kurmamak:** MyLibrary `package.json` içinde `playwright-core` ve `test:desktop` var. Playwright MCP, Playwright CLI/Skills ve Chrome DevTools MCP eklenmeden önce var olan native smoke akışının boşlukları ölçülecek.
2. **Farklı hafıza yaklaşımlarını karıştırmamak:** Graphify kaynak/kod ilişkileri, Graphiti zaman içinde değişen bilgi grafiği, claude-mem oturum geçmişi; repo PROJECT_STATUS/DECISIONS/VERIFICATION zaten otorite. Bunlar ikinci bir kanonik karar kaynağı olmayacak.
3. **Security-first:** Cloudflare skill'in metodolojisi Strix'in aktif testinden farklıdır. Strix'in Docker/API anahtarı gereksinimi, Agent-Reach'in browser session yaklaşımı ve otomatik agent izinleri yüksek ön değerlendirme ister.
4. **Lisans veri tutarsızlıkları:** Ponytail export 'NOASSERTION' ama GitHub `LICENSE` dosyası MIT gösteriyor; Strix export `CC0-1.0`, README rozetinde Apache-2.0 yazıyor. Finalde yalnızca belirli commit/version ve lisans dosyası kanıtlarıyla karar verilmeli. 33. kaydın kaynak License alanı eksik.
5. **Mimari uyum:** Supabase host edilmiş Postgres/Auth yaklaşımı veya Google microservices demo MyLibrary'nin yerel/offline SQLite çekirdeğinin yerine geçemez; ürün kapsamı ayrı PO kararına bağlıdır.

## Kontrollü araştırma ve pilot sırası

- **D1:** Her aday için tam GitHub repo kimliği, README/License/release, maintenance, Windows + Codex/Antigravity uyumu, ağ/API/telemetri, gizli veri ve otomatik çalışma etkileri.
- **D2:** Aynı problemdeki alternatifleri karşılaştır: `spec-kit` vs `superpowers` vs küçük skills; `Graphify` vs `Graphiti` vs dosya-temelli kanonik hafıza; `Playwright MCP` vs CLI vs mevcut native smoke; `ui-ux-pro-max` vs `taste-skill` vs Figma; `Cloudflare` vs Strix vs mevcut CodeQL.
- **D3:** Kurulum kodu, otomatik güncelleme, prompt injection, shell hook, MCP izinleri, sır saklama, giden ağ ve test izolasyonu risk kontrol listesi.
- **D4:** Aynı sentetik MyLibrary görevi için araçsız baseline + seçilen araç, gerçek doğru testler/manuel native gözlem, token ve süre/maliyet, bakım yükü, yanlış bulgu ve veri güvenliği kıyaslaması.
- **D5:** Model/ajan görev matrisi, PO onay kapıları, en fazla birkaç seçilmiş yerel skill ile kademeli benimseme ve geri dönüş prosedürü.

## Kalıcı güvenlik/izin sınırları

- Kurulum, plugin bağlama, yeni API anahtarı, kod değişimi, otomatik PR/merge, roadmap ya da ürün milestone değişikliği bu envanterle yetkilendirilmedi.
- Korunan V1 ref'leri, v2 exact-SHA FF ve ayrı PO yetkisi korunur. Gerçek kitaplık verisi, DB/WAL, covers ve arşivlere pilot erişimi yasaktır.
- Sentetik izole MYLIBRARY_DATA_DIR ve ayrı WebView2 profilinde çalış. Dış ağ erişimini açık izin/kapsam olmadan etkinleştirme.

**Durum:** D0 yıldız envanteri alındı ve sınıflandırıldı; kullanıcı cihazındaki tüm kurulu agent/skill/MCP ve güncel kota envanteri henüz alınmadı. D1-D5 tamamlanmadı.
