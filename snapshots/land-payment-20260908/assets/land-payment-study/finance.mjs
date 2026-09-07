// Public reference rules. These inputs describe scenarios, never credit approval.
export const financeRevision='2026-09-07-accuracy-1';
export const financeSources={reductions:'https://www.flat35.com/simulation/simu_10.html',family:'https://www.flat35.com/loan/lineup/flat35kosodate-plus/',location:'https://www.flat35.com/loan/lineup/flat35s/ricchi_youken.html'};
export const financeDefaults=()=>({flatMode:'standard',family:'unknown',performance:'unknown',maintenance:'unknown',region:'unknown',site:'unknown',nantoIncrease:0,otherCashMan:''});
export const choices={
 family:[['unknown','まだわからない'],['none','該当しない'],['young','若年夫婦世帯'],...[...Array(22)].map((_,i)=>[String(i+1),`対象のお子様 ${i+1}人`])],
 performance:[['unknown','まだわからない'],['none','引下げなし'],['zeh','フラット35S（ZEH）'],['a','フラット35S（金利Aプラン）'],['b','フラット35S（金利Bプラン）']],
 maintenance:[['unknown','まだわからない'],['none','利用しない'],['long','長期優良住宅として認定を受ける']],
 region:[['unknown','まだわからない'],['none','利用しない'],['child','地域連携型（子育て支援・空き家対策）'],['active','地域連携型（地域活性化）'],['migration','地方移住支援型']],
 site:[['unknown','まだわからない'],['eligible','金利引下げの土地条件を満たす'],['excluded','金利引下げの対象外の区域']]
};
export function normalizeFinance(raw={}){
 const f=financeDefaults();
 for(const key of Object.keys(choices))if(choices[key].some(([v])=>v===raw[key]))f[key]=raw[key];
 f.flatMode=raw.flatMode==='scenario'?'scenario':'standard';
 f.nantoIncrease=[0,.5,1,2].includes(Number(raw.nantoIncrease))?Number(raw.nantoIncrease):0;
 const v=raw.otherCashMan;f.otherCashMan=v!==''&&v!=null&&Number.isFinite(Number(v))&&Number(v)>=0&&Number(v)<=2000?String(v):'';
 return f;
}
export function flatReduction(raw={}){
 const f=normalizeFinance(raw),unknowns=Object.keys(choices).filter(k=>f[k]==='unknown');
 if(f.flatMode==='standard')return {points:0,reductions:[],unknowns,assumption:'金利引下げなし'};
 if(f.site==='excluded')throw Error('選択した立地条件では金利引下げを利用できません。「金利引下げなし」で試算してください。');
 if(f.maintenance==='long'&&!['zeh','a'].includes(f.performance))throw Error('長期優良住宅の金利引下げは、ZEHまたは金利Aプランとの併用が条件です。住宅性能の選択をご確認ください。');
 const family=f.family==='young'?1:Number(f.family)||0,performance={zeh:3,a:2,b:1}[f.performance]??0,maintenance=f.maintenance==='long'?1:0,region={child:2,active:1,migration:2}[f.region]??0;
 const points=family?family+performance+maintenance+region:Math.min(4,performance+maintenance+region);
 const reductions=[];
 if(f.region==='migration'&&family+performance+maintenance===0)reductions.push({months:60,discount:.6});
 else for(let remaining=points;remaining>0;remaining-=4)reductions.push({months:60,discount:Math.min(4,remaining)*.25});
 return {points,reductions,unknowns,assumption:reductions.length?'金利引下げを利用した場合':'金利引下げなし（選択した条件で計算）'};
}
const regular=(p,rate,n)=>{const b=BigInt(p),r=BigInt(Math.round(rate*1000)),d=1200000n;if(r===0n)return b/BigInt(n);const x=(d+r)**BigInt(n),y=d**BigInt(n);return b*r*x/(d*(x-y));};
// Each new rate is amortized over the remaining term, starting at the actual balance.
export function calculatePeriods(principalYen,months,baseRate,reductions=[]){
 if(!Number.isSafeInteger(principalYen)||principalYen<0||!Number.isInteger(months)||months<1||months>600||!Number.isFinite(baseRate)||baseRate<0||baseRate>20)throw Error('返済計算の入力を確認してください。');
 if(reductions.some(p=>!Number.isInteger(p.months)||p.months<=0||!Number.isFinite(p.discount)||p.discount<0||p.discount>baseRate))throw Error('金利引下げ期間を確認してください。');
 let balance=BigInt(principalYen),month=1,total=0n;const periods=[],schedule=[];
 const plan=[...reductions,{months,discount:0}];
 for(const period of plan){if(month>months)break;const count=Math.min(period.months,months-month+1),rate=Number((baseRate-period.discount).toFixed(3)),pay=regular(Number(balance),rate,months-month+1),opening=Number(balance),start=month,r=BigInt(Math.round(rate*1000));
  for(let i=0;i<count;i++,month++){const interest=balance*r/1200000n;let payment=month===months?balance+interest:pay;if(payment>balance+interest)payment=balance+interest;const principal=payment-interest;if(principal<0n)throw Error('返済額を確認してください。');balance-=principal;total+=payment;schedule.push({month,paymentYen:Number(payment),interestYen:Number(interest),principalYen:Number(principal),balanceYen:Number(balance)});}
  const last=periods.at(-1);if(last&&last.rate===rate&&last.paymentYen===Number(pay)){last.toMonth=month-1;last.closingBalanceYen=Number(balance);}else periods.push({fromMonth:start,toMonth:month-1,rate,paymentYen:Number(pay),openingBalanceYen:opening,closingBalanceYen:Number(balance)});
 }
 return {periods,schedule,paymentYen:periods[0].paymentYen,totalPaymentYen:Number(total),interestYen:Number(total)-principalYen,lastPaymentYen:schedule.at(-1).paymentYen};
}
export function periodLabel(p){const a=(p.fromMonth-1)/12+1,b=p.toMonth/12;return p.fromMonth===1?`当初${b}年間`:`${a}〜${b}年目`;}
export function financeAssumption(f,productId){f=normalizeFinance(f);return productId==='nanto'?(f.nantoIncrease?`借入当初から金利が${f.nantoIncrease}ポイント高かった場合`:'最大引下げ金利が完済まで変わらない場合'):flatReduction(f).assumption;}
