export const checkedAt = '2026-09-07';
export {properties} from './suumo-properties.mjs';
export const houses = [{id:'kyo',name:'京',priceMan:2480},{id:'hana',name:'花',priceMan:2680},{id:'kaze',name:'風',priceMan:2680}];
export const financialProducts = [
 {id:'nanto',bank:'南都銀行',name:'変動金利・手数料型',short:'変動金利',minYears:1,maxYears:50,minYen:300000,maxYen:200000000,stepYen:100000,insurance:'がん保障特約付団信',feeRate:.022,minFee:0,rate:.875,source:'https://www.nantobank.co.jp/kojin/kariru/home/kinri_plan.html',termsSource:'https://www.nantobank.co.jp/kojin/kariru/home/select.html',condition:'南都信用保証・手数料型の最大引下げ例。がん団信の上乗せ0.1%を含みます。'},
 {id:'flat-a',bank:'イオン銀行',name:'フラット35 Aタイプ',short:'全期間固定・定率',minYears:15,maxYears:35,minYen:1000000,maxYen:120000000,stepYen:10000,insurance:'新機構団信',feeRate:.0187,minFee:110000,source:'https://www.aeonbank.co.jp/housing-loan/flat/rate/',termsSource:'https://www.aeonbank.co.jp/housing-loan/flat/flat35/',condition:'一般の新機構団信付き。融資率90%と返済20年を境に金利が変わります。金利引下げは、試算で選択した参考条件に基づきます。'},
 {id:'flat-b',bank:'イオン銀行',name:'フラット35 Bタイプ',short:'全期間固定・定額',minYears:15,maxYears:35,minYen:1000000,maxYen:120000000,stepYen:10000,insurance:'新機構団信',fixedFee:55000,source:'https://www.aeonbank.co.jp/housing-loan/flat/rate/',termsSource:'https://www.aeonbank.co.jp/housing-loan/flat/flat35/',condition:'一般の新機構団信付き。Aタイプより金利が0.2%高く、融資手数料は定額です。金利引下げは、試算で選択した参考条件に基づきます。'}
];
export const rateValidity = {from:'2026-09-01',through:'2026-09-30'};
