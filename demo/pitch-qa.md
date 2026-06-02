# Hazinedar — Sunum + Demo + Jüri Q&A Paketi

> **Rol dağılımı:** Seyit sunar (pitch + demo), Bekir arkadan teknik derinlik desteği verir.
> Aşağıdaki Q&A'da her soru için **[Seyit — kısa cevap]** ve **[Bekir — teknik derinlik]** ayrı.

---

## 1. Pitch yapısı (3 dakika)

1. **Kanca (problem):** "Türkiye'de ithalat yapan orta ölçekli bir şirket iki yerden sürekli para kaybeder: kasadaki TL enflasyonda erir, yurt dışı tedarikçiye ödeme yaparken banka %2-4 kur makası + masraf keser. Tipik bir ithalatçı yılda yüz binlerce dolar kaybeder."
2. **Çözüm:** "Hazinedar — şirketin parasını kurallarla kendi kendine yöneten otonom bir dijital hazine müdürü. Atıl TL'yi enflasyona karşı korur, en uygun kurda çevirir, sınır-ötesi ödemeyi banka makası olmadan yapar."
3. **Kritik fark:** "Paraya biz dokunmuyoruz. Para her zaman şirketin kendi akıllı kontratında. Şirket bize değil, koda güveniyor."
4. **Demo** (aşağıdaki akış).
5. **Kanıt:** "Stratejiyi gerçek 1 yıllık USD/TRY verisiyle backtest ettik: naive ödemeye karşı %3.79 ≈ 1.2M TL tasarruf."
6. **Why-now + why-Stellar:** "TR enflasyonu + olgunlaşan stablecoin + yeni güvenilir otonom agent'lar aynı anda. Stellar'ın anchor + path-payment'ı son-metre cash-out'u native çözer."
7. **Ask/kapanış:** "Çekirdek testnet'te çalışıyor; sıradaki adım gerçek bir ithalatçıyla pilot + anchor entegrasyonu."

## 2. Demo akışı (ekran ekran)

1. **Treasury durumu:** kasada 500K USDC, policy (günlük limit + whitelist tedarikçi) görünür.
2. **Oracle:** canlı USDTRY kuru (33.50) — on-chain feed.
3. **Agent kararı:** agent kuru okur → "CONVERT — pencere dibi" / "HOLD" kararını gösterir.
4. **Bounded ödeme:** `agent_pay` ile tedarikçiye ödeme → zincirde transfer event + stellar.expert linki.
5. **Güvenlik kanıtı (güçlü an):** whitelist dışı / limit üstü ödeme dene → **kontrat reddeder** (canlı panic). "Agent kötü niyetli olsa bile parayı kaçıramaz."
6. **Backtest paneli:** %3.79 / 1.2M TL tasarruf + 3 bileşen (makas / kalkan / zamanlama).

> Demo'da dürüst not: "Bankaya cash-out kısmını testnet kısıtı nedeniyle mock'ladık; production'da MoneyGram/anchor ile."

## 3. Jüri Q&A — hazır cevaplar

**S: Agent hangi AI modelini kullanıyor? LLM mi?**
- [Seyit] "Otonom bir karar motoru — kasıtlı olarak deterministik, LLM değil. Finansal kararda öngörülebilir ve denetlenebilir olması için."
- [Bekir] "Kural-tabanlı: vade penceresi + dip yakalama + deadline garantisi. LLM halüsinasyonu parayı yanlış yere göndermez. Üstüne doğal-dil kural tanımı için LLM katmanı eklenebilir, ama çekirdek kasıtlı deterministik."

**S: Para güvende mi? Custody riski?**
- [Seyit] "Sıfır custody. Para hep şirketin kendi kontratında; biz dokunamayız."
- [Bekir] "Agent yalnızca policy'nin (whitelist + günlük limit) izin verdiğini yapabilir; kontrat aksini panic'ler. Owner fonları her an çekebilir. Demo'da limit-aşımının reddini canlı gösteriyoruz."

**S: Binlerce kullanıcıya nasıl ölçeklenir?**
- [Seyit] "Her işletme kendi izole kontratını alır; Stellar saniyede binlerce işlemi sub-cent ücretle kaldırır."
- [Bekir] "Zincir darboğaz değil. Off-chain agent'ı çok-kasa yönetecek bir filo servisine (kuyruk + scheduler) çevirmek standart backend ölçekleme — yol haritasında."

**S: Regülasyon? Türkiye'de kripto/SPK?**
- [Seyit] "Biz stablecoin ihraç etmiyoruz, mevcut USDC'yi kullanıyoruz ve custody yok — regülasyon yüzeyimiz düşük."
- [Bekir] "7518 sayılı kanun + SPK tebliğleri kripto hizmet sağlayıcı ve stablecoin ihraçcısını hedefliyor; biz non-custodial yazılım katmanıyız. Yine de production öncesi hukuki görüş alınacak."

**S: Rakipler? Wise, Squads, bankalar?**
- [Seyit] "Wise Business 2023'ten beri TR'de TRY'yi kapattı; Mercury/Airwallex TR'ye kapalı. Squads (Solana) treasury yapıyor ama otonom FX-zamanlama + bizim kanıt katmanımız yok."
- [Bekir] "Tam füzyonu (non-custodial treasury + otonom FX-timing + cross-border + selective disclosure, KOBİ-importer odaklı) hiçbir zincirde shipped bulamadık. Global neobank'ların TR'ye kapalı olması bizim için yapısal kalkan."

**S: Gelir modeli?**
- [Seyit] "İşlem başına küçük bir ücret (banka makasının çok altında) veya işletme başına abonelik."
- [Bekir] "Bankanın %2-4 makasına karşı biz ~%0.1 + ince bir hizmet payı alsak bile işletme net kazançlı; bizim marjımız hacimden gelir."

**S: 'Enflasyon kalkanı' tam olarak nasıl çalışıyor?**
- [Seyit] "Agent kuru izler; TL değer kaybederken atıl TL'yi erken USDC'ye çevirip değeri korur."
- [Bekir] "Şu an enflasyonu kur üzerinden dolaylı yakalıyoruz (oracle USDTRY). İstenirse doğrudan enflasyon feed'i (TÜİK) eklenebilir; pratikte kur enflasyonu büyük ölçüde taşıyor."

**S: Backtest gerçek veri mi, yoksa uydurma mı?**
- [Seyit] "Gerçek — son 1 yılın günlük USD/TRY verisi (frankfurter/ECB). 12 ödeme simüle edildi."
- [Bekir] "Tasarruf üç bileşene matematiksel olarak tam ayrışıyor: makas (garantili) + devalüasyon kalkanı + zamanlama. Dürüst sınırı da kodladık: TL güçlenirse zamanlama kaybedebilir, ama makas her zaman kazandırır."

**S: Demo'da neler gerçek, neler mock?**
- [Seyit] "Kontratlar, agent, policy enforcement, oracle, backtest — hepsi testnet'te gerçek. Sadece bankaya son-metre cash-out mock."
- [Bekir] "Anchor off-ramp partnership-ağır; 24 saatte demo edilemez. SEP-31 arayüzünü gösterip settlement'ı mock'ladık. Production'da MoneyGram/anchor."

**S: Neden Stellar, neden başka zincir değil?**
- [Seyit] "Anchor ağı (MoneyGram, 170+ ülke) son-metre bankaya çıkışı native çözüyor; path-payment FX ve sub-cent ücret mikro-ödemeyi ekonomik kılıyor."
- [Bekir] "Rakipler (ör. Squads/Solana) cross-border'ı 3. parti ile yapıyor; Stellar'da bu protokol-seviyesinde."

## 4. Zor/tuzak sorulara kısa hazırlık

- **"Bu sadece bir betik değil mi?"** → "Hayır: policy kontrat tarafından zorlanıyor (canlı reddi gösterdik), non-custodial, ve strateji gerçek veriyle doğrulandı."
- **"Tek günde mi yaptınız, ciddi mi?"** → "Çekirdeği evet — kapsamı dar ve net tuttuk; zor entegrasyonları (anchor) bilinçle yol haritasına koyduk. Çalışan kanıt + dürüst kapsam."
- **"Müşteri var mı?"** → "Henüz pilot aşamasında değiliz; bir sonraki adım gerçek bir ithalatçıyla pilot. Pazar: 318K ithalatçı firma, $365B yıllık ithalat."
