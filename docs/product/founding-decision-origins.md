# MyLibrary — Kurucu 'Masaüstü Kütüphane Uygulaması' Sohbeti Köken/Karar Eki

**22 Ekim 2026 · Tarihsel rekonstrüksiyon, tam sohbet transkripti değildir.** Bu belgedeki ürün yönleri [karar defterini](../DECISIONS.md) veya [roadmap'i](../v2/ROADMAP.md) değiştirmez; tarihsel bağlam ve köken açıklamasıdır. Bu ek, ilk büyük sohbetten erişilen kişisel geçmiş özetlerini, 19 Ekim Master Handoff'u ve 56 sayfalık M3 discovery'nin öneri/PO tercih ayrımını çapraz referanslar. Her alıntı birebir mesajdan olmadığı sürece birebir alıntı olarak sunulmaz. Çatışmada sonraki açık PO kararı ve canlı repo sözleşmesi geçerlidir.

## A. Kalıcı ürün omurgası

| Konu | Korunacak karar / vizyon | Kaynak güveni / etki |
| --- | --- | --- |
| Ürün | Windows-first, private local/offline physical book library, zengin kataloglama ve polished UX | Yüksek; sonraki resmî sözleşmelerle uyumlu |
| Baskı ve nüsha | Edition ayrı, Physical Copy ayrı; farklı konum/kondisyon/edinim/ödünç | Bağlayıcı; güncel repo/doğrudan PO |
| Work kavramı | İlk plan tartışmalarındaki Work/Edition/Copy üçlemesi **sonraki açık kararla geçersiz kılındı**; Work tablosu yok | En güncel açık PO kararı üstün |
| Veri korunması | DB/WAL, kapak, attachments, ZIP backup/restore, validation, rollback; CSV/JSON katalog aktarımı ayrı | Bağlayıcı güvenlik mimarisi |
| Özellik derinliği | Sekmeli editör, hızlı ekleme, grid/table, bulk, temalar/mikro animasyon; konum hiyerarşisi | Kurucu UX yönü; yeni V2 implementasyon izni değil |
| Menü | Dashboard / Library / Explore / Personal / Data / Settings | Tarihsel bilgi; mevcut navigasyonu değiştirme talimatı değil |

## B. M3 eski PO yönleri: iki farklı PO-03'ü ayır

| Referans | İçerik | Yorum |
| --- | --- | --- |
| Tarihsel PO collection direction (geçmiş konuşma/handoff'ta bazen 'PO-03') | Manual Collection üyeliği esasen Edition, gerektiğinde **belirli Physical Copy**; çoklu üyelik | PO yönü; kesin DB tasarımı / uygulama onayı değil |
| M3 PDF'deki **PO-03** | **Wishlist** kayıtları Manual Collection üyesi olabilir mi? | Ayrı, açık araştırma sorusu; ilk satırla birleştirilmez |
| Tarihsel Visual Shelves direction | Room > Bookcase > Shelf üstünde **2D cover + typographic spine**; ağır 3D yerine erişilebilir/performatif UX | PO ürün yönü; ilk ekranın UX/acceptance ayrıntıları hâlâ planlanmalı |
| M3 PDF'deki **PO-04** | Cover/spine'ın ilk teslimat kapsamı ve sınırları | Çalışma önerisi/açık detay; tarihsel yönü sessizce iptal etmez |
| Wishlist ownership | Sahip olunmayan kayıt, sahte Physical Copy üretmez; explicit acquisition, Fulfilled/Purchased geçmişi | PO yönü; şema/uygulama ayrıca onaylanmalı |
| Retailer/bütçe | Birden fazla satıcı bağlantısı + para birimi bazlı bütçe yaklaşımı | PO tercih yönü; PDF'nin minimal single-link önerisi PO kararı değil |
| Katalog export | Varsayılan Library, seçilebilir Wishlist/Collections; All Data açık; tam Backup/Restore farklı | PO yönü; kapsamlı restore doğrulaması zorunlu |

**Karar kaydı notu:** [docs/DECISIONS.md](../DECISIONS.md) içinde D-017/D-018/D-019 kayıtları bu farklı anlamları ayrı tutar; PDF'deki PO-03/PO-04 etiketleri sadece araştırma soru ID'si olarak gösterilmeli. Tarihi bilinmeyen bir PO kararına tarih uydurulmamalı.

## C. Metadata/kapak/UX ve yayın hattı

- Kullanıcının kaynaklar arasında gerçek ISBN/baskı doğruluğunu görmesi; şüpheli kapak eşleşmelerini fark edebilmesi. Bu, Google Books görselini izinsiz kalıcı indirme yetkisi vermez.
- Metadata alanlarını **toplu seçme (Select All)** isteği/UX yönü, daha önce CQ-03 adayına bağlanmıştır; yalnız seri/tür isteyen **M2-E kapsamına kendiliğinden eklenmez**.
- Takvim/yerelleştirme kalitesi TR/EN, ileride yaklaşık 10 dile genişleme isteği; bugünkü V2'ye on dil teslim şartı yok.
- Final ürün hattı: PO review → installer candidate → private beta → feedback/triage → **ayrı nihai PO stable release onayı**. Sonraki dokümanlarda beta öncesi ve beta sonrası onaylar birbirine karıştırılmamalı.
- Mobil/web/tablet arayüzü, isteğe bağlı senkronizasyon, e-kitap yetenekleri kurucu uzun vadeli vizyondur. **V2 sonrası keşif**, mevcut offline/no account/no telemetry sözleşmesini değiştirmez.

## D. Güncel gelişmelere bağlam

22 Ekim PO, M2-E'yi **yalnız seri, varsa cilt sırası ve tür** metadata önerileri olarak V2'ye planladı. M2-F kullanıcı tarafından seçilen USB/kamera sonrası metadata akışı; M3 mevcut Edition seri önerisi, kısa/geniş Advanced Search; M5 offline basit PNG kart; M6 kalan tarih lokalleştirmesi ilgili milestone'a yerleştirildi. Geniş UI, Garden, premium, telefonun uygulamasız ISBN bağlantısı V2 sonrasına. Kamera iyileştirme araştırması durduruldu. Bunların hiçbiri kendi başına kod/PR/merge/release yetkisi değildir.

## E. Denetim sınırı ve tamlık

Orijinal **'Masaüstü Kütüphane Uygulaması' sohbetinin bütün mesajları/ekleri** bu oturuma tam olarak sunulmadı. Yukarıdaki bağlam farklı özet/handoff'lardan geri kazanıldı; tek tek tarihlere, birebir alıntılara ve konuşulmuş tüm fikirlerin eksiksizliğine dair garanti yok. Asıl transkript sağlanırsa, öneri/PO kararı/ret/supersede/GitHub karşılığı olacak şekilde delta analizi yapılabilir. Mevcut arşivleri silme veya geriye dönük yeniden yazma.
