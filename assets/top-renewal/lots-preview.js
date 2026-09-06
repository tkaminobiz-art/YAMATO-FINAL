/* Financial inputs stay in this page's memory. No analytics or browser storage. */
import { calculateMortgage } from './mortgage.mjs';
import { previewDefaults, previewPreset } from './loan-preview-presets.mjs';
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const quarantined = new Set(['r65744643']);
  // Visually checked source photos; the source's first image is often a plot CG.
  // A missing entry intentionally shows a neutral fallback, never an invented photo.
  const inspectedPhotos = {r65744643:'03',r83116512:'01',r91372717:'03',r91373110:'02',r91375630:'03',r98218444:'03',r98220464:'03',r104536817:'02',r98218036:'01',r98218733:'03',r98219005:'01',r98219727:'03',r98219942:'03',r98221832:'03',r104537733:'01',r104538269:'03',r104539308:'01',r104539846:'01',r68526080:'01',r69127877:'01',r76342779:'03',r87978875:'01',r91371550:'02',r91375861:'01',r85368374:'03'};
  const productNames = { hana: '花', kyo: '京', kaze: '風' };
  const productPrices = { hana: 2680, kyo: 2480, kaze: 2680 };
  const allowedPrices = new Set(['', 'under1500', '1500to2500', 'over2500', 'unknown']);
  let rows = [], ready = false, visibleCount = 6, controller;
  let mode = 'list', selected = '', city = '', price = '', product = '', manual = false;
  let calculation = null;
  let customConditions = false, landBasis = '未入力';
  const activePreset = () => previewPreset(document.querySelector('[name="loan-plan"]:checked').value, Number(document.querySelector('[name="long-years"]:checked').value));
  function applyPreset() {
    const preset = activePreset(); customConditions = false;
    $('interest').value = String(preset.rate); $('years').value = String(preset.years);
    document.querySelector('[name="repayment"][value="annuity"]').checked = true;
    $('long-years').hidden = preset.key !== 'long';
    $('plan-description').textContent = preset.description;
    for (const id of ['interest', 'years']) validateField($(id));
  }
  function initializeDefaults() {
    $('fees').value = String(previewDefaults.feesMan); $('own-cash').value = String(previewDefaults.cashMan); applyPreset();
  }
  function tryCalculate() {
    if ((!manual && !selected) || !product || fields.some(field => !field.value.trim() || !validateField(field, true))) return;
    calculate(false);
  }
  const viewScroll = { list: null, estimate: null };
  let detailFromPush = false, closingByRoute = false, returnFocus = null, returnFocusTarget = null;
  const fields = [...document.querySelectorAll('[data-financial]')];
  const status = message => { $('action-status').textContent = message; };
  const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };
  const money = value => new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 2 }).format(value);
  const knownPrice = row => !quarantined.has(row.id) && Number.isFinite(row.priceMan) && row.priceMan > 0;
  const selectedRow = () => rows.find(row => row.id === selected);
  const announceRoute = message => { $('route-notice').textContent = message; $('route-notice').hidden = !message; };
  const safePhoto = source => typeof source === 'string' && /^assets\/lots_rescue\/\d+\/\d+\.(?:jpg|jpeg|png|webp)$/i.test(source) ? source : '';
  const inspectedPhoto = row => (Array.isArray(row.photos) ? row.photos : []).find(source => typeof source === 'string' && inspectedPhotos[row.id] && source.endsWith(`/${inspectedPhotos[row.id]}.jpg`)) || '';

  function writeURL(push = false, detail = '') {
    const url = new URL(location.href); url.search = ''; url.hash = '';
    url.searchParams.set('view', mode);
    if (selected) url.searchParams.set('lot', selected);
    if (city) url.searchParams.set('city', city);
    if (price) url.searchParams.set('price', price);
    if (detail) url.searchParams.set('detail', detail);
    history[push ? 'pushState' : 'replaceState']({ preview: true }, '', url);
  }
  function readURL() {
    const previousSelected = selected;
    const params = new URLSearchParams(location.search), notices = [];
    mode = params.get('view') === 'estimate' ? 'estimate' : 'list';
    if (params.has('view') && !['list', 'estimate'].includes(params.get('view'))) notices.push('表示方法を確認できないため、物件一覧を開きました。');
    const id = params.get('lot') || '';
    selected = /^[a-zA-Z0-9_-]{1,60}$/.test(id) ? id : '';
    if (selected !== previousSelected) { $('land-price').value = ''; landBasis = '未入力'; invalidateResult(); }
    city = params.get('city') || '';
    price = allowedPrices.has(params.get('price') || '') ? params.get('price') || '' : '';
    if (ready) {
      if (selected && !rows.some(row => row.id === selected && row.status === '販売中')) {
        const old = rows.find(row => row.id === selected);
        notices.push(old ? '選択された分譲地は、掲載時点で販売を終了しています。ほかの土地をお選びください。' : '選択された分譲地を確認できませんでした。土地を選び直してください。'); selected = '';
      }
      if (city && !rows.some(row => row.city === city)) city = '';
      const row = selectedRow();
      if (row && knownPrice(row) && !$('land-price').value.trim()) {
        $('land-price').value = String(row.priceMan);
        landBasis = '2026年7月6日掲載の下限価格。現在の区画価格ではありません。';
      }
    }
    if (id && !selected && !notices.length) notices.push('選択された分譲地を確認できませんでした。土地を選び直してください。');
    if (selected) manual = false;
    announceRoute(notices.join(' '));
    $('city-filter').value = city; $('price-filter').value = price;
  }
  function syncMode(focus = false) {
    $('list-panel').hidden = mode !== 'list'; $('estimate-panel').hidden = mode !== 'estimate';
    for (const link of document.querySelectorAll('[data-mode]')) {
      if (link.dataset.mode === mode) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    }
    if (focus) $(mode === 'list' ? 'list-title' : 'estimate-title').focus({ preventScroll: true });
  }
  function setMode(next, focus = true) {
    const changed = mode !== next;
    if (changed) viewScroll[mode] = window.scrollY;
    mode = next; writeURL(changed); syncMode(focus); renderSummary();
    if (focus) {
      if (changed && viewScroll[next] !== null) window.scrollTo({ top: viewScroll[next], behavior: 'instant' });
      else document.querySelector('.lp-modes').scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }
  function photo(row, source, interactive = false) {
    const frame = el(interactive ? 'button' : 'div', 'lp-lot-image');
    if (interactive) { frame.type = 'button'; frame.setAttribute('aria-label', `${row.name}の写真と情報を見る`); frame.addEventListener('click', () => openProperty(row, true, frame)); }
    const fallback = () => { frame.replaceChildren(el('span', 'lp-photo-fallback', `${row.name}\n${source ? '写真を表示できません' : '実写写真は確認中です'}`)); };
    const path = safePhoto(source);
    if (path) {
      const image = el('img'); image.src = path; image.alt = `${row.name}（旧サイト掲載写真）`; image.width = 900; image.height = 600; image.loading = 'lazy'; image.decoding = 'async'; image.addEventListener('error', fallback, { once: true }); frame.append(image);
      frame.append(el('span', 'lp-image-label', '旧サイト掲載写真'));
    } else fallback();
    return frame;
  }
  function priceBlock(row) {
    const block = el('p', 'lp-price');
    block.append(el('strong', knownPrice(row) ? '' : 'lp-price-unknown', knownPrice(row) ? money(row.priceMan) : '価格確認中'));
    if (knownPrice(row)) block.append(document.createTextNode(' 万円〜'));
    return block;
  }
  function pick(row) {
    invalidateResult(); selected = row.id; manual = false;
    $('land-price').value = knownPrice(row) ? String(row.priceMan) : '';
    landBasis = knownPrice(row) ? '2026年7月6日掲載の下限価格。現在の区画価格ではありません。' : '価格確認中';
    validateField($('land-price')); writeURL(); renderList(); renderSelection(); renderSummary(); tryCalculate();
    status(knownPrice(row) ? `${row.name}の掲載下限価格で試算します。` : '土地価格は確認が必要です。');
  }
  function filteredRows() {
    return rows.filter(row => row.status === '販売中' && (!city || row.city === city) && (!price || (price === 'unknown' ? !knownPrice(row) : knownPrice(row) && (price === 'under1500' ? row.priceMan < 1500 : price === '1500to2500' ? row.priceMan >= 1500 && row.priceMan < 2500 : row.priceMan >= 2500))));
  }
  function renderList() {
    if (!ready) return;
    const filtered = filteredRows(); $('lot-grid').replaceChildren();
    $('result-count').textContent = `索引 ${filtered.length}件`;
    $('load-state').hidden = filtered.length > 0;
    if (!filtered.length) $('load-state').replaceChildren(el('p', '', '条件に合う分譲地がありません。検索条件を変更してください。'));
    for (const row of filtered.slice(0, visibleCount)) {
      const card = el('article', `lp-lot-card${selected === row.id && !manual ? ' is-selected' : ''}`); card.dataset.lotId = row.id;
      card.append(photo(row, inspectedPhoto(row), true));
      const body = el('div', 'lp-lot-body'); body.append(el('p', 'lp-location', `${row.pref || ''} / ${row.city || ''}`), el('h3', '', row.name), el('p', 'lp-station', row.station ? `最寄駅：${row.station}` : '最寄駅は確認中'), priceBlock(row), el('p', 'lp-price-note', knownPrice(row) ? '掲載時の土地価格（非課税）／区画価格ではありません' : '価格の記載が一致しないため、金額を表示していません'));
      const actions = el('div', 'lp-card-actions');
      const select = el('button', 'lp-card-select', selected === row.id && !manual ? '選択中 ✓' : 'この分譲地を選ぶ'); select.type = 'button'; select.setAttribute('aria-pressed', String(selected === row.id && !manual)); select.setAttribute('aria-label', `${row.name}を選ぶ`); select.addEventListener('click', () => { pick(row); const replacement = [...document.querySelectorAll('[data-lot-id]')].find(item => item.dataset.lotId === row.id)?.querySelector('.lp-card-select'); replacement?.focus({ preventScroll: true }); });
      const detail = el('button', 'lp-card-detail', '情報を見る'); detail.type = 'button'; detail.setAttribute('aria-label', `${row.name}の情報を見る`); detail.addEventListener('click', () => openProperty(row, true, detail)); actions.append(select, detail); body.append(actions); card.append(body); $('lot-grid').append(card);
    }
    $('more-lots').hidden = filtered.length <= visibleCount;
  }
  function renderSelection() {
    const box = $('selected-land'); box.replaceChildren(); const row = selectedRow();
    if (manual) box.append(el('p', '', '土地価格を入力して試算'), el('small', '', '分譲地を選ばずに、ご希望の金額で試せます。'));
    else if (row) {
      box.append(photo(row, inspectedPhoto(row)));
      box.append(el('p', '', row.name), el('small', '', quarantined.has(row.id) ? '価格の記載が一致しないため、自動入力しません。ご確認済みの金額で試算できます。' : '区画価格・販売状況・建築できる商品は確認が必要です。'));
      const details = el('button', 'lp-text-button', 'この分譲地の情報を見る'); details.type = 'button'; details.addEventListener('click', () => openProperty(row, true, details)); box.append(details);
      if (knownPrice(row)) {
        const reference = el('button', 'lp-text-button sim-reference', `掲載時の下限額 ${money(row.priceMan)}万円で試す`); reference.type='button';
        reference.addEventListener('click',()=>{invalidateResult();$('land-price').value=String(row.priceMan);landBasis='2026年7月6日掲載の下限価格。現在の区画価格ではありません。';validateField($('land-price'));renderSummary();tryCalculate();status('掲載時の下限価格を入力しました。選択区画の確定価格ではありません。');});box.append(reference);
      }
    } else box.append(el('p', '', '土地はまだ選ばれていません。'));
    $('manual-land').setAttribute('aria-pressed', String(manual)); $('manual-land-fields').hidden = !manual && (!row || knownPrice(row));
  }
  function renderSummary() {
    const row = selectedRow();
    for (const root of document.querySelectorAll('[data-summary]')) {
      root.replaceChildren(); const dl = el('dl');
      for (const [title, value, note] of [
        ['土地', manual ? '土地価格を仮入力' : row?.name || '未選択', manual ? '実物件の販売価格ではありません' : row ? '実区画・価格は確認中' : '分譲地の一覧から選べます'],
        ['商品', productNames[product] || '未選択', product ? 'この土地での建築可否は未確認' : '花・京・風から検討できます'],
        ['返済条件', fields.some(field => field.value.trim()) ? '入力あり' : '未入力', 'ページを離れると消去します']
      ]) { const group = el('div'), dd = el('dd', '', value); dd.append(el('small', '', note)); group.append(el('dt', '', title), dd); dl.append(group); }
      root.append(dl);
      if(calculation){
        const result=el('div','sim-summary-payment');result.append(el('span','',calculation.method==='annuity'?'月々の目安（仮設定）':'初回の目安（仮設定）'),el('strong','',`${yen(calculation.loan.firstPaymentYen)} 円`),el('small','',`年${calculation.annualRatePercent}％・${calculation.months/12}年・ボーナスなし`),el('small','',`借入予定額 ${money(calculation.principal/10000)}万円／諸費用${money(calculation.fees/10000)}万円を含む仮試算`),el('small','',landBasis));
        const show=el('button','lp-text-button','総費用・利息も見る');show.type='button';show.addEventListener('click',()=>{if($('summary-dialog').open)closeDialog($('summary-dialog'));setMode('estimate',false);showResult();});result.append(show);root.append(result);
      }else root.append(el('p','lp-summary-result','土地・商品・返済条件を入力すると、月々の返済額と総費用を確認できます。'));
    }
    $('mobile-summary-label').textContent = calculation ? '試算結果と条件を見る' : manual ? '土地価格を入力して試算' : row?.name || '土地は未選択';
  }
  const fieldNames={land:'土地価格',building:'建物本体価格',cash:'自己資金',fees:'付帯工事・諸費用',interest:'金利',years:'返済期間'};
  const yen=value=>new Intl.NumberFormat('ja-JP',{maximumFractionDigits:0}).format(value);
  function fieldValue(field){const text=field.value.trim().normalize('NFKC');if(!text||!/^\d+(?:\.\d+)?$|^\d{1,3}(?:,\d{3})+(?:\.\d+)?$/.test(text))return NaN;return Number(text.replaceAll(',',''));}
  function amountYen(field){return Math.round(fieldValue(field)*10000);}
  function validateField(field,required=false) {
    const text=field.value.trim().normalize('NFKC'),key=field.dataset.financial,value=fieldValue(field),decimals=text.split('.')[1]?.length||0;
    const valid=!text&&!required || Number.isFinite(value)&&value>=0&&(key==='years'?Number.isInteger(value)&&value>=1&&value<=50:key==='interest'?value<=20&&decimals<=3:value<=200000&&decimals<=4&&(key!=='building'||value>0));
    const error = $(`${field.id}-error`); error.hidden = valid;
    error.textContent=valid?'':!text?`${fieldNames[key]}を入力してください。`:key==='years'?'1〜50年の整数で入力してください。':key==='interest'?'0〜20％、小数3桁以内で入力してください。':`${key==='building'?'0より大きい金額を':'0以上の金額を'}、20億円以下・1円単位で入力してください。`;
    field.setAttribute('aria-invalid', String(!valid)); return valid;
  }
  function invalidateResult(){calculation=null;$('calculation-result').hidden=true;$('quick-result').hidden=true;$('calculation-error').hidden=true;}
  function clearFinancial(announce = false) {
    fields.forEach(field => { field.value = ''; validateField(field); });
    document.querySelector('[name="repayment"][value="annuity"]').checked=true;
    invalidateResult();$('example-note').hidden=true;
    product = ''; landBasis = '未入力';
    for (const item of document.querySelectorAll('[data-product]')) { item.setAttribute('aria-pressed','false'); item.querySelector('.lp-product-check').textContent='この商品を選ぶ ＋'; }
    initializeDefaults();
    for(const id of ['payment-value','payment-note','result-assumptions','result-totals','rate-comparison','schedule-body'])$(id).replaceChildren();
    if(announce){selected='';manual=false;writeURL();renderSelection();renderList();}
    renderSummary(); if (announce) status('選択を解除しました。金利・諸費用は仮設定に戻しました。');
  }
  function showResult(){const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;$('result-title').focus({preventScroll:true});$('calculation-result').scrollIntoView({block:'start',behavior:reduced?'instant':'smooth'});}
  function calculate(reveal = true){
    invalidateResult();const valid=fields.map(field=>validateField(field,true));
    if(!manual&&!selected){$('calculation-error').hidden=false;$('calculation-error').textContent='土地を選ぶか、土地価格の入力方法を選んでください。';$('manual-land').focus();renderSummary();return;}
    if(!product){$('calculation-error').hidden=false;$('calculation-error').textContent='花・京・風から商品を選んでください。';document.querySelector('[data-product]').focus();renderSummary();return;}
    if(valid.includes(false)){const field=fields[valid.indexOf(false)];field.closest('details')?.setAttribute('open','');field.focus();renderSummary();return;}
    const land=amountYen($('land-price')),building=amountYen($('building-price')),fees=amountYen($('fees')),cash=amountYen($('own-cash')),total=land+building+fees,principal=total-cash;
    if(cash>total||total>2000000000){$('calculation-error').hidden=false;$('calculation-error').textContent=cash>total?'自己資金が購入費用の合計を上回っています。金額を確認してください。':'購入費用の合計は20億円以下で試算してください。';(cash>total?$('own-cash'):$('land-price')).focus();renderSummary();return;}
    const annualRatePercent=fieldValue($('interest')),months=fieldValue($('years'))*12,method=document.querySelector('[name="repayment"]:checked').value;
    try{const loan=calculateMortgage({principalYen:principal,annualRatePercent,months,method});calculation={land,building,fees,cash,total,principal,annualRatePercent,months,method,loan};renderResult();renderSummary();if(reveal)showResult();status(`月々の目安を${yen(loan.firstPaymentYen)}円に更新しました。仮設定による概算です。`);}
    catch{$('calculation-error').textContent='入力条件を計算できませんでした。金額・金利・期間をご確認ください。';$('calculation-error').hidden=false;renderSummary();}
  }
  function renderResult(){
    const c=calculation;if(!c)return;const {loan}=c;
    $('calculation-result').hidden=false;
    $('quick-result').hidden=false;
    $('quick-label').textContent=c.method==='annuity'?'月々の目安・仮試算':'初回の目安・仮試算';
    $('quick-payment').textContent=yen(loan.firstPaymentYen);
    $('quick-conditions').textContent=`年${c.annualRatePercent}％・${c.months/12}年・ボーナスなし／諸費用${money(c.fees/10000)}万円を含む仮試算`;
    $('quick-total').textContent=`ローン総返済額 ${yen(loan.totalPaymentYen)}円`;
    $('result-assumptions').textContent=`${customConditions?'変更した条件':activePreset().label}。年${c.annualRatePercent}％・${c.months/12}年・${c.method==='annuity'?'元利均等':'元金均等'}・ボーナス払いなし。自己資金${money(c.cash/10000)}万円。土地${money(c.land/10000)}万円＋建物${money(c.building/10000)}万円＋諸費用${money(c.fees/10000)}万円。`;
    $('result-price-basis').textContent=`${landBasis} 諸費用は${c.fees===previewDefaults.feesMan*10000?'仮額200万円':'入力額'}です。全額を借りられると仮定した比較で、融資対象・必要な現金・商品適合は未確認です。`;
    $('comparison-principal').textContent=`借入予定額 ${yen(c.principal)}円。土地・建物・諸費用から自己資金を引いた、利息を含まない金額です。`;
    const plans=$('loan-comparison'); plans.replaceChildren();
    for(const key of ['variable','flat','long']){
      const preset=previewPreset(key,Number(document.querySelector('[name="long-years"]:checked').value));
      const other=calculateMortgage({principalYen:c.principal,annualRatePercent:preset.rate,months:preset.years*12,method:'annuity'});
      const card=el('article','sf-loan-card');
      card.append(el('h4','',key==='variable'?'変動・35年':key==='flat'?'固定・35年':`長期・${preset.years}年`),el('small','',`年${preset.rate}％${key==='long'?'（仮設定）':'（条件付き参考例）'}`),el('strong','',`月 ${yen(other.firstPaymentYen)}円`),el('p','',`総返済額 ${money(Math.round(other.totalPaymentYen/10000))}万円`),el('p','',`うち利息 ${money(Math.round(other.totalInterestYen/10000))}万円`));
      const choose=el('button','lp-text-button','この条件で試算する'); choose.type='button';
      choose.dataset.comparePlan=key;
      choose.addEventListener('click',()=>{document.querySelector(`[name="loan-plan"][value="${key}"]`).checked=true;applyPreset();tryCalculate();document.querySelector(`[data-compare-plan="${key}"]`)?.focus({preventScroll:true});});
      card.append(choose);plans.append(card);
    }
    $('payment-label').textContent=c.method==='annuity'?'毎月の返済額':'初回の返済額';$('payment-value').textContent=yen(loan.firstPaymentYen);
    $('payment-note').textContent=c.principal===0?'借入額0円。入力した購入費用を自己資金でまかなう場合です。':c.method==='annuity'?`最終回 ${yen(loan.lastPaymentYen)}円。入力金利が全期間一定の場合。`:`毎月の元金は一定、利息分が減少します。最終回 ${yen(loan.lastPaymentYen)}円。`;
    const totals=$('result-totals');totals.replaceChildren();
    for(const[label,value,note]of [['購入費用',c.total,'土地＋建物＋入力した諸費用'],['自己資金',c.cash,'借入れずに支払う金額'],['借入予定額',c.principal,'購入費用−自己資金'],['ローン総返済額',loan.totalPaymentYen,'借入元金＋利息'],['利息総額',loan.totalInterestYen,'入力金利が全期間一定の場合'],['自己資金＋ローン総返済額',c.cash+loan.totalPaymentYen,'未入力の費用・入居後の維持費は除く']]){const group=el('div'),dd=el('dd','',`${yen(value)} 円`);dd.append(el('small','',note));group.append(el('dt','',label),dd);totals.append(group);}
    const share=loan.totalPaymentYen?c.principal/loan.totalPaymentYen:1;$('principal-bar').style.width=`${share*100}%`;$('interest-bar').style.width=`${(1-share)*100}%`;
    const comparisons=$('rate-comparison');comparisons.replaceChildren();
    for(const delta of[0,.5,1]){const rate=Math.round((c.annualRatePercent+delta)*1000)/1000,card=el('div',delta?'':'is-current');card.append(el('span','',delta?`年${rate}％の場合`:`入力した年${rate}％`));if(rate>20){card.append(el('p','','試算範囲外'));}else{const other=delta?calculateMortgage({principalYen:c.principal,annualRatePercent:rate,months:c.months,method:c.method}):loan;card.append(el('small','',c.method==='annuity'?'毎月':'初回'),el('strong','',`${yen(other.firstPaymentYen)}円`),el('small','',`利息総額 ${yen(other.totalInterestYen)}円`));}comparisons.append(card);}
    const tbody=$('schedule-body');tbody.replaceChildren();for(let start=0;start<loan.schedule.length;start+=12){const group=loan.schedule.slice(start,start+12),tr=el('tr'),th=el('th','',`${start/12+1}年目`);th.scope='row';tr.append(th,...[group.reduce((a,b)=>a+b.paymentYen,0),group.reduce((a,b)=>a+b.interestYen,0),group.at(-1).balanceYen].map(value=>el('td','',`${yen(value)}円`)));tbody.append(tr);}
  }
  function restoreFocus() {
    const card = [...document.querySelectorAll('[data-lot-id]')].find(node => node.dataset.lotId === returnFocusTarget?.lot);
    const target = returnFocus?.isConnected ? returnFocus : returnFocusTarget?.id ? $(returnFocusTarget.id) : card?.querySelector(returnFocusTarget?.selector || 'button');
    target?.focus?.({ preventScroll: true });
  }
  function showDialog(dialog, trigger = document.activeElement) {
    // Safari does not always focus a pointer-clicked button. Remember the actual trigger.
    returnFocus = trigger;
    returnFocusTarget = { id: returnFocus.id, lot: returnFocus.closest?.('[data-lot-id]')?.dataset.lotId, selector: returnFocus.classList.contains('lp-card-detail') ? '.lp-card-detail' : '.lp-lot-image' };
    dialog.showModal(); document.body.classList.add('lp-dialog-open');
  }
  function closeDialog(dialog) {
    if (dialog.id === 'property-dialog' && detailFromPush && !closingByRoute) { history.back(); return; }
    if (dialog.id === 'property-dialog' && !closingByRoute) writeURL();
    dialog.close(); document.body.classList.remove('lp-dialog-open'); restoreFocus();
  }
  function openProperty(row, push, trigger) {
    $('property-dialog-title').textContent = row.name; const root = $('property-detail'); root.replaceChildren();
    root.append(el('p', 'lp-source-note', '2026年7月6日時点の旧サイト掲載情報です。現在の販売状況は確認が必要です。'));
    const images = el('div', 'lp-detail-photos'); images.append(photo(row, inspectedPhoto(row))); root.append(images, priceBlock(row), el('p', 'lp-price-note', knownPrice(row) ? '掲載時の土地価格（非課税）。選択する区画の確定価格ではありません。' : '価格の記載が一致しないため、金額を表示していません。'));
    const dl = el('dl', 'lp-detail-data'); for (const [label, value] of [['所在地', row.address || row.city], ['最寄駅', row.station], ['掲載時の面積', Number.isFinite(row.areaM2) ? `${row.areaM2}㎡（実区画は未確定）` : '確認中'], ['建築条件', row.buildingCondition || '確認中']]) dl.append(el('dt', '', label), el('dd', '', value || '確認中')); root.append(dl);
    root.append(el('p', 'lp-inline-notice', '区画ごとの価格・販売状態・商品適合は確認中です。'));
    const choose = el('button', 'lp-button', 'この分譲地を選び、条件を確認する'); choose.type = 'button'; choose.addEventListener('click', () => {
      // Replace the detail entry rather than returning to stale pre-selection history.
      detailFromPush = false; closeDialog($('property-dialog')); pick(row); setMode('estimate');
    }); root.append(choose);
    detailFromPush = push; if (push) writeURL(true, row.id);
    if (!$('property-dialog').open) showDialog($('property-dialog'), trigger);
  }
  async function load() {
    controller?.abort(); controller = new AbortController(); const requestController = controller; const signal = requestController.signal; const timeout = setTimeout(() => requestController.abort(), 8000);
    $('retry-load').hidden = true; $('load-state').hidden = false; $('load-state').replaceChildren(el('p', '', '分譲地を読み込んでいます。'));
    try {
      const response = await fetch('data/lots.json', { signal, cache: 'no-store', credentials: 'same-origin' }); if (!response.ok) throw new Error('load');
      const data = await response.json(); if (!Array.isArray(data.lots) || !data.lots.every(row => row && typeof row.id === 'string' && typeof row.name === 'string')) throw new Error('schema');
      if (signal.aborted) return;
      rows = data.lots; ready = true; $('city-filter').replaceChildren(new Option('すべてのエリア', ''));
      [...new Set(rows.filter(row => row.status === '販売中').map(row => row.city).filter(Boolean))].sort((a,b) => a.localeCompare(b, 'ja')).forEach(value => $('city-filter').add(new Option(value, value)));
      const detail = new URLSearchParams(location.search).get('detail'); readURL(); writeURL(false, detail && rows.some(row => row.id === detail && row.status === '販売中') ? detail : ''); syncMode(); renderList(); renderSelection(); renderSummary();
      if (detail) { const row = rows.find(row => row.id === detail && row.status === '販売中'); if (row) openProperty(row, false); }
    } catch (error) {
      if (signal !== controller.signal) return;
      ready = false; $('lot-grid').replaceChildren(); $('more-lots').hidden = true; $('result-count').textContent = '';
      $('load-state').replaceChildren(el('p', '', '分譲地を表示できませんでした。もう一度読み込むか、お電話でお問い合わせください。')); $('load-state').hidden = false; $('retry-load').hidden = false;
    } finally { clearTimeout(timeout); }
  }
  for (const link of document.querySelectorAll('[data-mode]')) link.addEventListener('click', event => { if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return; event.preventDefault(); setMode(link.dataset.mode); });
  $('choose-land').addEventListener('click', () => setMode('list'));
  $('manual-land').addEventListener('click', () => { invalidateResult();manual = true; selected = '';landBasis='入力した土地価格';$('land-price').value='';writeURL(); renderSelection(); renderList(); renderSummary(); $('land-price').focus(); });
  $('owned-land').addEventListener('click',()=>{invalidateResult();manual=true;selected='';landBasis='土地を所有している前提（土地取得費0円）';$('land-price').value='0';writeURL();renderSelection();renderList();renderSummary();tryCalculate();});
  function selectProduct(key){invalidateResult();product=key;$('building-price').value=String(productPrices[key]);validateField($('building-price'));for(const item of document.querySelectorAll('[data-product]')){const active=item.dataset.product===product;item.setAttribute('aria-pressed',String(active));item.querySelector('.lp-product-check').textContent=active?'選択中 ✓':'この商品を選ぶ ＋';}renderSummary();tryCalculate();}
  for (const button of document.querySelectorAll('[data-product]')) {const cost=el('span','sim-product-price',`${money(productPrices[button.dataset.product])}万円`);button.querySelector('.lp-product-name').after(cost);button.addEventListener('click',()=>{selectProduct(button.dataset.product);status(`${productNames[product]}の建物本体価格を入力しました。税込・土地別途です。`);});}
  fields.forEach(field => {field.addEventListener('input', () => { invalidateResult();validateField(field);renderSummary();if(field.id==='land-price')landBasis='入力した土地価格';if(['interest','years'].includes(field.id)){customConditions=true;$('plan-description').textContent='金利・期間を変更した条件です。金融商品の適用条件は反映していません。';} });field.addEventListener('change',tryCalculate);field.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();calculate();}});});
  document.querySelectorAll('[name="repayment"]').forEach(input=>input.addEventListener('change',()=>{invalidateResult();customConditions=true;renderSummary();tryCalculate();}));
  for(const input of document.querySelectorAll('[name="loan-plan"],[name="long-years"]'))input.addEventListener('change',()=>{invalidateResult();applyPreset();renderSummary();tryCalculate();});
  $('reset-preset').addEventListener('click',()=>{invalidateResult();applyPreset();renderSummary();tryCalculate();});
  // Re-entering the same value may emit input without change; restore valid results on blur.
  fields.forEach(field=>field.addEventListener('blur',()=>{if(!calculation)tryCalculate();}));
  $('calculate').addEventListener('click',()=>calculate());
  $('quick-details').addEventListener('click',showResult);
  $('edit-conditions').addEventListener('click',()=>{$('finance-details').open=true;$('interest').focus({preventScroll:true});$('finance-title').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
  $('load-example').addEventListener('click',()=>{invalidateResult();manual=true;selected='';landBasis='土地1,500万円の仮入力例（実在物件ではありません）';initializeDefaults();$('land-price').value='1500';$('example-note').hidden=false;selectProduct('kyo');writeURL();renderSelection();renderList();renderSummary();tryCalculate();showResult();});
  $('consult-result').addEventListener('click',()=>{
    if(!calculation)return;
    $('copy-status').textContent='';
    $('consult-text').value=['支払い相談用・仮設定の試算（正式な見積もりではありません）',selectedRow()?.name||'土地価格を入力',`商品：${productNames[product]}（この土地での建築可否は未確認）`,$('result-assumptions').textContent,$('result-price-basis').textContent,`${calculation.method==='annuity'?'月々':'初回'}：${yen(calculation.loan.firstPaymentYen)}円`,`ローン総返済額：${yen(calculation.loan.totalPaymentYen)}円`,'金利が全期間変わらない仮定。入居後の税金・保険更新・修繕費は含みません。','この結果は審査・融資可否を示しません。',`試算日時：${new Date().toLocaleString('ja-JP')}`].join('\n');
    showDialog($('consult-dialog'),$('consult-result'));
  });
  $('copy-quote').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('consult-text').value);$('copy-status').textContent='試算内容をコピーしました。';}catch{$('consult-text').focus();$('consult-text').select();$('copy-status').textContent='自動コピーが使えません。選択した文章をコピーしてください。';}});
  document.addEventListener('focusin', event => { document.body.classList.toggle('lp-input-focused', event.target.matches('[data-financial]')); });
  document.addEventListener('focusout', () => { queueMicrotask(() => document.body.classList.toggle('lp-input-focused', Boolean(document.activeElement?.matches('[data-financial]')))); });
  $('clear-inputs').addEventListener('click', () => clearFinancial(true));
  $('city-filter').addEventListener('change', () => { city = $('city-filter').value; visibleCount = 6; writeURL(); renderList(); });
  $('price-filter').addEventListener('change', () => { price = $('price-filter').value; visibleCount = 6; writeURL(); renderList(); });
  $('reset-filters').addEventListener('click', () => { city = ''; price = ''; $('city-filter').value = ''; $('price-filter').value = ''; visibleCount = 6; writeURL(); renderList(); });
  $('more-lots').addEventListener('click', () => { const previous = visibleCount; visibleCount += 6; renderList(); document.querySelectorAll('.lp-lot-card')[previous]?.querySelector('button')?.focus({ preventScroll: true }); });
  $('retry-load').addEventListener('click', load);
  $('open-summary').addEventListener('click', () => showDialog($('summary-dialog'), $('open-summary')));
  document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => closeDialog(button.closest('dialog'))));
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(dialog); });
    dialog.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const items = [...dialog.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),[tabindex="0"]')].filter(node => node.getClientRects().length);
      const first = items[0], last = items.at(-1);
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    dialog.addEventListener('click', event => { if (event.target !== dialog) return; const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(dialog); });
  });
  document.querySelectorAll('[data-go-estimate]').forEach(button => button.addEventListener('click', () => { if ($('summary-dialog').open) closeDialog($('summary-dialog')); setMode('estimate'); }));
  window.addEventListener('popstate', () => { const detail = new URLSearchParams(location.search).get('detail'); const wasClosing = !detail && $('property-dialog').open; if (wasClosing) { closingByRoute = true; closeDialog($('property-dialog')); closingByRoute = false; detailFromPush = false; } readURL(); syncMode(true); renderList(); renderSelection(); renderSummary(); if (wasClosing) restoreFocus(); if (detail && ready) { const row = rows.find(row => row.id === detail && row.status === '販売中'); if (row) openProperty(row, false); } });
  window.addEventListener('pagehide', () => clearFinancial());
  window.addEventListener('pageshow', event => { if (event.persisted) { clearFinancial();readURL(); syncMode(); renderSelection(); renderSummary(); status('入力した条件を消去し、仮設定に戻しました。'); } });
  clearFinancial();readURL(); syncMode(); renderSelection(); renderSummary(); load();
})();
