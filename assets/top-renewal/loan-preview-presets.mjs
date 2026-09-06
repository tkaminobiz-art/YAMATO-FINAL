// Illustrations for a design review, not an approved mortgage offer.
export const previewDefaults = Object.freeze({ feesMan: 200, cashMan: 0, version: 'illustration-20260905' });
export function previewPreset(key, years = 40) {
  if (key === 'flat') return { key, label: 'フラット35・参考例', rate: 3.57, years: 35, description: '2026年9月・融資率9割超の最頻金利を使う参考例です。自己資金による金利変更・優遇制度・融資可否は反映していません。' };
  if (key === 'long') {
    if (![40, 50].includes(years)) throw new RangeError('Unsupported term');
    return { key, label: `長期返済・${years}年の仮設定`, rate: years === 40 ? 1.07 : 1.15, years, description: '期間の違いを比較する仮設定です。金融機関の提供条件ではありません。長期返済は年齢などで利用条件が異なり、総利息が増える場合があります。' };
  }
  if (key !== 'variable') throw new RangeError('Unsupported preset');
  return { key, label: '変動金利・35年の参考例', rate: 0.875, years: 35, description: '南都銀行の2026年9月掲載金利を参照。年0.875％は最大引下げ後・がん団信付き・手数料型の条件です。この金利が全期間続くと仮定しています。審査・取引条件で金利は異なり、やまとの提携条件ではありません。' };
}
