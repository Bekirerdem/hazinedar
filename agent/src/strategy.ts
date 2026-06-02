/**
 * Otonom FX-zamanlama karar motoru (saf fonksiyon, yan etkisiz, test edilebilir).
 *
 * Ithalatci senaryosu: isletmenin TL'si var, vadesi gelen USD tedarikci odemesi icin
 * TL -> USDC cevirmesi gerekiyor. Kur = USDTRY (1 USD kac TL).
 *
 * Strateji (savunulabilir + basit):
 *  1. Vade penceresi henuz acilmadiysa bekle.
 *  2. Zaten cevirdiysek bekle.
 *  3. Vade gunu geldiyse MUTLAKA cevir (deadline garantisi - devaluasyon riskini kapatir).
 *  4. Guncel kur, pencerede gordugumuz en iyi (en dusuk USDTRY = TL en guclu) seviyeye
 *     inmisse cevir (dip yakalama = zamanlama alfasi).
 *  5. Aksi halde daha iyi kuru bekle.
 */

export type ConversionInput = {
  /** Odeme vadesine kalan gun (0 = bugun son gun). */
  daysToDeadline: number;
  /** Agent'in kuru izlemeye basladigi pencere genisligi (gun). */
  windowDays: number;
  /** Guncel USDTRY kuru (1 USD = X TRY). */
  currentRate: number;
  /** Pencere boyunca gozlenen en dusuk USDTRY (TL'nin en guclu oldugu an). */
  recentMin: number;
  /** Bu odeme icin cevirme zaten yapildi mi. */
  alreadyConverted: boolean;
};

export type ConversionDecision = {
  action: "convert" | "hold";
  reason: string;
};

export function decideConversion(i: ConversionInput): ConversionDecision {
  if (i.alreadyConverted) {
    return { action: "hold", reason: "zaten cevrildi" };
  }
  if (i.daysToDeadline > i.windowDays) {
    return { action: "hold", reason: "vade penceresi henuz acilmadi" };
  }
  if (i.daysToDeadline <= 0) {
    return { action: "convert", reason: "vade gunu - deadline garantisi" };
  }
  if (i.currentRate <= i.recentMin) {
    return { action: "convert", reason: "pencere dibi yakalandi - dusuk USDTRY" };
  }
  return { action: "hold", reason: "daha iyi kur bekleniyor" };
}
