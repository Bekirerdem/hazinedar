# Hazinedar — Production Yol Haritası + Birim Ekonomisi

> Amaç: "Bugün çalışan çekirdekten gerçek ürüne giden yol + bu işin neden sürdürülebilir bir iş olduğu."
> Pitch'in "next steps / business model" kısmı + ekip için yol haritası.
> (Süre tahmini yerine **risk seviyesi** kullanılmıştır.)

---

## 1. Bugün neredeyiz (MVP — testnet'te canlı)

✅ Çalışıyor: oracle + treasury kontratları, bounded `agent_pay`, FX-zamanlama agent'ı, **canlı feeder** (dış kur → on-chain oracle → karar → ödeme), gerçek-veri backtest (%3.79 ≈ 1.2M TL/yıl tasarruf). 18 test geçiyor.

🟡 Mock / yok: bankaya anchor cash-out, çok-kullanıcı orkestrasyon, kolay onboarding (cüzdan soyutlama).

---

## 2. Production'a giden yol (3 cephe)

### A. Teknik (orta risk — çözülebilir)
- **Güvenlik denetimi (audit)** — para tutan kontrat için pazarlık edilemez. *(Bir kerelik, yüksek maliyet.)*
- **Gerçek anchor entegrasyonu** (SEP-31/24) — USDC ↔ TL banka hesabı; lisanslı anchor.
- **Cüzdan/key soyutlama** — kullanıcı "kripto" hissetmemeli (smart wallet / passkey). En büyük UX emeği.
- **Çok-kasa agent altyapısı** (filo yöneticisi: kuyruk + scheduler) + **anahtar güvenliği** (KMS/HSM) + izleme/alerting.

### B. Regülasyon (yüksek risk — TR'de en kritik darboğaz)
- SPK / 7518 hukuki görüş — non-custodial olsak da "ödeme/kambiyo hizmeti" sınırını netleştir.
- KYC/AML yükümlülükleri.
- Anchor'ın lisanslı olması.

### C. İş (yüksek öncelik)
- **1-3 pilot müşteri** (gerçek ithalatçı) — ürün-pazar uyumu.
- Anchor + likidite partnerlikleri.
- Ekip: backend + frontend + BD/satış + compliance.

---

## 3. Kullanıcı yolculuğu

Kaydol → **KYC** → kendi treasury kontratı (arka planda yönetilen) → kural belirle (limit/whitelist/FX) → TL'yi anchor ile stablecoin'e sok → **agent otonom yönetir**, dashboard'dan izle → istediğinde bankaya çek.

**Tasarım ilkesi:** Hiçbir adımda kullanıcı seed phrase/gas/cüzdan görmemeli. Hedef UX = banka uygulaması kadar basit.

---

## 4. Birim ekonomisi

### Maliyet yapısı
| Tür | Kalem | Büyüklük |
|---|---|---|
| **Marjinal (işlem başına)** | Stellar tx ücreti | **sub-cent (~0)** |
| | Anchor cash-out komisyonu | ~%0.5-1 (anchor'a) |
| | FX/likidite spread | düşük |
| **Sabit / operasyonel** | Audit | bir kerelik, yüksek |
| | Regülasyon/compliance | sürekli |
| | Altyapı (RPC + agent + KMS) | ölçekle artan, yönetilebilir |
| | Ekip | sabit |

### Gelir modeli
- İşlem başına ince ücret (banka makasının **çok altında**) veya işletme başına abonelik.
- Konumlama: banka **%2-4** makas alırken biz işletmeye **<%1** maliyet + kendi marjımız **~%0.3-0.5**.

### Örnek birim (illüstratif — tipik orta ithalatçı)
- Yıllık ithalat ~$5M; bugünkü kayıp (makas + erozyon) **~$90-190K/yıl**.
- Bizimle maliyet ~%1 ($50K) → **işletme net $40-140K tasarruf.**
- Bizim gelir ~%0.4 → **~$20K/yıl/müşteri**, marjinal maliyet ~sıfır.

### Kritik içgörü
Asıl maliyet **işlem başına değil, sabit** (audit + compliance + ekip). Stellar'ın sub-cent ücreti sayesinde **marjinal maliyet ~sıfır** → **ölçek ekonomisi mükemmel** (her yeni müşteri neredeyse saf marj), ama başlangıç bariyeri yüksek (audit + regülasyon). Bu, "hacimle kazanan" bir model.

---

## 5. Go-to-market

- **Faz 1 — Pilot:** 1-3 ithalatçı (örn. Bursa tekstil) ile ROI kanıtı (backtest + gerçek tasarruf).
- **Faz 2 — Ölçek:** anchor partnerliği + çok-kasa agent + self-serve onboarding.
- **Kanal:** ithalatçı dernekleri, ticaret/sanayi odaları, sektör birlikleri (tekstil/elektronik).

---

## 6. Riskler ve azaltma

| Risk | Seviye | Azaltma |
|---|---|---|
| Regülasyon (SPK) | Yüksek | Non-custodial mimari + erken hukuki görüş |
| Anchor bağımlılığı | Orta | Çoklu anchor; başta mock, sonra partnerlik |
| Güven (para emaneti algısı) | Orta | Audit + "biz dokunamayız" (kod-garantili), şeffaf demo |
| Benimseme (kripto korkusu) | Orta | Cüzdan soyutlama + pilot ROI kanıtı |
| FX-zamanlama belirsizliği | Düşük | Değer makas + kalkandan; zamanlama bonus (dürüst konumlama) |

---

## Özet
Çekirdek kanıtlandı. Gerçek ürüne giden yolda **en büyük engeller kod değil** — regülasyon + anchor partnerliği + pilot müşteri. Ekonomi modeli sağlam (düşük marjinal maliyet → ölçekte kârlı). Doğru sıralama: **pilot → anchor + audit → ölçek.**
