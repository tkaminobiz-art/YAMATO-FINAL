export const checkedAt = '2026-09-08';
export {properties} from './suumo-properties.mjs';
export const houses = [{id:'kyo',name:'京',priceMan:2480},{id:'hana',name:'花',priceMan:2680},{id:'kaze',name:'風',priceMan:2680}];
export const financialProducts = [
 {id:'nanto',bank:'南都銀行',name:'変動金利・手数料型',short:'変動金利',minYears:1,maxYears:50,minYen:300000,maxYen:200000000,stepYen:100000,insurance:'がん保障特約付団信',feeRate:.022,minFee:0,rate:.875,source:'https://www.nantobank.co.jp/kojin/kariru/home/kinri_plan.html',termsSource:'https://www.nantobank.co.jp/kojin/kariru/home/select.html',condition:'南都信用保証・手数料型の最大引下げ金利を使った例です。がん団信による年0.1%の上乗せを含みます。'},
 {id:'flat-a',bank:'イオン銀行',name:'フラット35 Aタイプ',short:'全期間固定・定率',minYears:15,maxYears:35,minYen:1000000,maxYen:120000000,stepYen:10000,insurance:'新機構団信',feeRate:.0187,minFee:110000,source:'https://www.aeonbank.co.jp/housing-loan/flat/rate/',termsSource:'https://www.aeonbank.co.jp/housing-loan/flat/flat35/',condition:'新機構団信付きの金利です。借入割合が90%を超えるかどうかと、返済期間が20年以下か21年以上かで金利が変わります。金利引下げは、選んだ条件が適用された場合の計算です。'},
 {id:'flat-b',bank:'イオン銀行',name:'フラット35 Bタイプ',short:'全期間固定・定額',minYears:15,maxYears:35,minYen:1000000,maxYen:120000000,stepYen:10000,insurance:'新機構団信',fixedFee:55000,source:'https://www.aeonbank.co.jp/housing-loan/flat/rate/',termsSource:'https://www.aeonbank.co.jp/housing-loan/flat/flat35/',condition:'新機構団信付きの金利です。Aタイプより年0.2%高く、融資手数料は定額です。金利引下げは、選んだ条件が適用された場合の計算です。'}
];
export const rateValidity = {from:'2026-09-01',through:'2026-09-30'};
