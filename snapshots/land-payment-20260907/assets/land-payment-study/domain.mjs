import {normalizeFinance,flatReduction,calculatePeriods,financeAssumption,financeRevision} from './finance.mjs';
import {financialProducts,rateValidity} from './data.mjs';
export function selectProperties(items,filters={},sort='price') {
 const list=items.filter(p=>(!filters.regions?.length||filters.regions.includes(p.city??p.name))&&(!filters.price||p.priceMan!=null&&p.priceMan<=filters.price)&&(!filters.area||p.areaM2!=null&&(p.areaMaxM2??p.areaM2)>=filters.area)&&(!filters.walk||p.walkMin!=null&&p.walkStatus!=='conflict'&&p.walkMin<=filters.walk)&&(!filters.bounds||(p.lat>=filters.bounds.south&&p.lat<=filters.bounds.north&&p.lng>=filters.bounds.west&&p.lng<=filters.bounds.east)));
 const key={price:'priceMan',area:'areaMaxM2',walk:'walkMin',updated:'sourceUpdatedAt'}[sort]||'priceMan';
 return list.sort((a,b)=>{const x=sort==='area'?(a.areaMaxM2??a.areaM2):a[key],y=sort==='area'?(b.areaMaxM2??b.areaM2):b[key];if(x==null&&y==null)return a.id.localeCompare(b.id);if(x==null)return 1;if(y==null)return-1;return(x===y?0:(x<y?-1:1))*(sort==='area'||sort==='updated'?-1:1)||a.id.localeCompare(b.id);});
}
export function getEstimate(input,productId,today=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Tokyo'}),financeSettings={}) {
 const {landMan,buildingMan,cashMan,years}=input,product=financialProducts.find(p=>p.id===productId);
 if(!product)throw Error('金融商品を選んでください。');
 if([landMan,buildingMan,cashMan,years].some(v=>typeof v!=='number'||!Number.isFinite(v)))throw Error('金額と返済期間を入力してください。');
 if(landMan<0||buildingMan<=0||cashMan<0||landMan>10000||buildingMan>10000||cashMan>20000)throw Error('金額の入力範囲を確認してください。');
 if(!Number.isInteger(years)||years<1||years>50)throw Error('返済期間は1〜50年で指定してください。');
 const totalYen=Math.round((landMan+buildingMan)*10000),cashYen=Math.round(cashMan*10000),principalYen=totalYen-cashYen;
 if(principalYen<0)throw Error('自己資金が土地と建物の合計を上回っています。');
 if(today<rateValidity.from||today>rateValidity.through)throw Error('掲載金利の適用月を過ぎています。最新金利の更新が必要です。');
 if(principalYen===0){const settings=normalizeFinance(financeSettings),otherCashYen=settings.otherCashMan===''?null:Math.round(Number(settings.otherCashMan)*10000);return{product,principalYen,totalYen,cashYen,years,rate:0,baseRate:0,initialRate:0,ltv:0,feeYen:0,paymentYen:0,totalPaymentYen:0,interestYen:0,periods:[],lastPaymentYen:0,reduction:{points:0,reductions:[],unknowns:[]},assumption:'借入なし',financeRevision,settings,knownCashYen:cashYen+(otherCashYen??0),otherCashYen};}
 if(years<product.minYears||years>product.maxYears)throw Error(`${product.name}は、この試作では${product.minYears}〜${product.maxYears}年で比較できます。`);
 if(principalYen<product.minYen||principalYen>product.maxYen||principalYen%product.stepYen!==0)throw Error(`この商品の借入額は${product.minYen/10000}〜${product.maxYen/10000}万円、${product.stepYen/10000}万円単位です。`);
 const settings=normalizeFinance(financeSettings),reduction=product.id==='nanto'?{reductions:[],points:0,unknowns:[]}:flatReduction(settings);
 const ltv=principalYen/totalYen;
 const baseRate=years<=20?(principalYen*10<=totalYen*9?3.14:3.25):(principalYen*10<=totalYen*9?3.46:3.57);
 const rate=product.id==='nanto'?Number((product.rate+settings.nantoIncrease).toFixed(3)):Number((baseRate+(product.id==='flat-b'?.2:0)).toFixed(3));
 const calculation=calculatePeriods(principalYen,years*12,rate,reduction.reductions);
 const feeYen=product.fixedFee??Math.max(product.minFee,Math.ceil(principalYen*Math.round(product.feeRate*10000)/10000));
 return{product,principalYen,totalYen,cashYen,years,rate,ltv,feeYen,paymentYen:calculation.paymentYen,totalPaymentYen:calculation.totalPaymentYen,interestYen:calculation.interestYen,periods:calculation.periods,lastPaymentYen:calculation.lastPaymentYen,baseRate:rate,initialRate:calculation.periods[0].rate,reduction,assumption:financeAssumption(settings,product.id),financeRevision,settings,knownCashYen:cashYen+feeYen+(settings.otherCashMan===''?0:Math.round(Number(settings.otherCashMan)*10000)),otherCashYen:settings.otherCashMan===''?null:Math.round(Number(settings.otherCashMan)*10000)};
}
