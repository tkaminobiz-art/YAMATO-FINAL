(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const dialog = $('voiceDialog'), scrollBox = $('detailScroll');
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let voices = [], topics = [], entries = new Map(), photos = new Map(), state = {topic:'all',area:'all',limit:12};
  let loaded = false, openId = null, lockedY = 0, focusBack = null, busyClosing = false;
  const photoFor = id => photos.get(id)?.images || [];
  const titleFor = v => [v.area,v.family].filter(Boolean).join(' ');
  const topicLabel = id => topics.find(t => t.id === id)?.label || '';
  const evidenceFor = (v, id = state.topic) => {
    const entry = entries.get(v.id);
    return entry?.evidence.find(e => e.topic === (id === 'all' ? entry.defaultTopic : id));
  };
  const listData = () => voices.filter(v => (state.area === 'all' || (v.area || 'unknown') === state.area) && (state.topic === 'all' || entries.get(v.id)?.evidence.some(e => e.topic === state.topic)));
  function readURL() {
    const q = new URLSearchParams(location.search);
    return {topic:topics.some(t=>t.id===q.get('topic'))?q.get('topic'):'all',area:voices.some(v=>(v.area||'unknown')===q.get('area'))?q.get('area'):'all',limit:Math.min(voices.length,Math.max(12,Number(history.state?.voiceTopics?.limit)||12))};
  }
  function urlFor(hash = '') {
    const u = new URL(location.href);
    ['topic','area'].forEach(k=>{if(state[k]==='all')u.searchParams.delete(k);else u.searchParams.set(k,state[k]);});
    u.hash = hash;return u.pathname+u.search+u.hash;
  }
  // WebKit rate-limits rapid History API calls. Filtering must remain usable if a write is refused.
  function writeHistory(method, data, url) {
    try { history[method](data, '', url); return true; }
    catch (error) { if (error.name === 'SecurityError') return false; throw error; }
  }
  function recordList(focusId) {
    writeHistory('replaceState', {...history.state,voiceTopics:{...state,scrollY:window.scrollY,focusId:focusId ?? (document.activeElement?.id||null),detail:false}},urlFor());
  }
  function rowHTML(v) {
    const entry = entries.get(v.id), evidence = evidenceFor(v), pictures = photoFor(v.id), picture = pictures[0];
    const fallback = (v.qa||[]).find(q=>q.a)?.a || '';
    return `<article class="voice-item ${picture?'has-photo':'no-photo'}" data-voice="${v.id}">
      ${picture?`<figure class="voice-photo"><img src="${esc(picture.src)}" alt="${esc(picture.alt)}" width="144" height="96" loading="lazy"><figcaption>${esc(picture.caption)}</figcaption></figure>`:''}
      <div class="voice-copy"><div class="voice-meta"><span class="voice-number">No. ${String(v.no).padStart(2,'0')}</span><h3>${esc(titleFor(v))}</h3></div>
      <blockquote class="voice-quote" data-qa="${evidence?.qaIndex ?? ''}">${esc(evidence?.excerpt ?? fallback)}</blockquote>
      <div class="voice-bottom"><ul class="voice-tags" aria-label="この声のテーマ">${(entry?.evidence||[]).map(e=>`<li>${esc(topicLabel(e.topic))}</li>`).join('')}</ul><a id="read-${v.id}" class="full-link" href="${esc(urlFor(v.id))}" data-open="${v.id}" aria-label="${esc(titleFor(v))} No.${v.no}の回答全文を読む">全文を読む <span aria-hidden="true">→</span></a></div></div></article>`;
  }
  function render() {
    const filtered = listData();
    $('voiceList').innerHTML = filtered.slice(0,state.limit).map(rowHTML).join('');
    $('resultTitle').textContent = state.topic === 'all' ? 'すべてのお客様の声' : topicLabel(state.topic)+'について';
    $('resultCount').textContent = `${filtered.length}件 / 全${voices.length}件`;
    $('excerptNote').textContent = state.topic === 'all' ? '回答の一部を抜粋しています。' : '選んだテーマに関する回答を抜粋しています。';
    $('area').value = state.area;
    $('reset').hidden = state.topic === 'all' && state.area === 'all';
    document.querySelectorAll('[data-topic]').forEach(b=>{
      const id = b.dataset.topic;
      const count = voices.filter(v=>(state.area==='all'||(v.area||'unknown')===state.area)&&(id==='all'||entries.get(v.id)?.evidence.some(e=>e.topic===id))).length;
      b.setAttribute('aria-pressed',String(state.topic===id));b.querySelector('.topic-count').textContent=count;
    });
    $('status').hidden = filtered.length !== 0;
    if(!filtered.length)$('status').innerHTML='<p>この条件に合うお客様の声はありません。</p><button type="button" data-reset>絞り込みを解除</button>';
    const remaining = filtered.length-state.limit;
    $('more').hidden = remaining<=0;
    $('more').innerHTML = `さらに${Math.min(12,remaining)}件を見る <span aria-hidden="true">↓</span>`;
    $('results').setAttribute('aria-busy','false');
  }
  function changeFilter(key, value) {
    recordList();
    if(key==='reset')state={topic:'all',area:'all',limit:12};else state={...state,[key]:value,limit:12};
    writeHistory('pushState', {voiceTopics:{...state,scrollY:window.scrollY,detail:false}},urlFor());render();
    if(key==='reset')document.querySelector('[data-topic="all"]').focus({preventScroll:true});
  }
  function markedAnswer(a,e) {
    if(!e)return esc(a);const start=a.indexOf(e.excerpt);if(start<0)return esc(a);
    return esc(a.slice(0,start))+'<mark>'+esc(e.excerpt)+'</mark>'+esc(a.slice(start+e.excerpt.length));
  }
  function showDetail(id) {
    const v = voices.find(v=>v.id===id);if(!v)return;
    const evidence = state.topic==='all'?null:evidenceFor(v), pictures=photoFor(v.id);
    if(!dialog.open){lockedY=window.scrollY;focusBack=document.activeElement;document.body.style.position='fixed';document.body.style.top=`-${lockedY}px`;document.body.style.width='100%';}
    $('detailNo').textContent = 'No. '+String(v.no).padStart(2,'0');
    $('detailBody').innerHTML = `<header class="detail-head">${pictures[0]?`<img src="${esc(pictures[0].src)}" alt="${esc(pictures[0].alt)}" width="114" height="76">`:''}<div><h2 id="detailTitle">${esc(titleFor(v))}</h2>${v.staffName?`<p class="detail-staff">担当スタッフ：${esc(v.staffName)}</p>`:''}${pictures.length?`<button class="jump-related" type="button" data-jump="homePhotos">住まいの写真を見る（${pictures.length}枚） ↓</button>`:''}</div></header>
      <div id="detailContext" class="detail-context">${evidence?`「${esc(topicLabel(state.topic))}」に関する発言に印を付けています。<br><button type="button" class="jump-related" data-jump="answer-${evidence.qaIndex}">関連する回答へ ↓</button>`:'お引き渡し後のアンケートを、原文のまま掲載しています。'}</div>
      ${v.qa.map((q,i)=>q.a?`<section class="qa${evidence?.qaIndex===i?' is-related':''}" id="answer-${i}"><h3>${evidence?.qaIndex===i?`<small>${esc(topicLabel(state.topic))}</small><br>`:''}${esc(q.q)}</h3><p data-answer="${i}">${markedAnswer(q.a,evidence?.qaIndex===i?evidence:null)}</p></section>`:'').join('')}
      ${v.staffReply?`<section class="staff-reply"><h3>担当スタッフより</h3><p>${esc(v.staffReply)}</p></section>`:''}${pictures.length?`<section id="homePhotos" class="home-photos"><h3>お住まいの写真</h3>${pictures.map(img=>`<figure><img src="${esc(img.src)}" alt="${esc(img.alt)}" width="${Number(img.width)||1200}" height="${Number(img.height)||800}" loading="lazy"><figcaption>${esc(img.caption)}</figcaption></figure>`).join('')}</section>`:''}<p class="detail-end">掲載内容は回答当時のものです。現在の仕様・費用は個別にご確認ください。</p>`;
    openId=id;if(!dialog.open)dialog.showModal();scrollBox.scrollTop=0;$('closeDetail').focus({preventScroll:true});
  }
  function hideDetail(restore) {
    if(!dialog.open)return;
    dialog.close();openId=null;document.body.style.position='';document.body.style.top='';document.body.style.width='';
    const saved=restore||history.state?.voiceTopics||{};const y=saved.scrollY??lockedY;
    window.scrollTo(0,y);
    const target=saved.focusId?$(saved.focusId):focusBack;
    if(target?.isConnected)target.focus({preventScroll:true});
    else {$('resultTitle').tabIndex=-1;$('resultTitle').focus({preventScroll:true});}
    busyClosing=false;
  }
  function closeDetail() {
    if(busyClosing)return;busyClosing=true;
    if(history.state?.voiceTopics?.detail){history.back();}
    else {writeHistory('replaceState', {voiceTopics:{...state,scrollY:lockedY,detail:false}},urlFor());hideDetail();}
  }
  function showUnknownVoice(hash) {
    if(!hash||hash==='main')return;
    $('status').hidden=false;$('status').innerHTML='<p>指定されたお客様の声は見つかりませんでした。一覧からお選びください。</p>';
    writeHistory('replaceState', {...history.state,voiceTopics:{...state,scrollY:window.scrollY,detail:false}},urlFor());
  }
  document.addEventListener('click',e=>{
    const topic=e.target.closest('[data-topic]');if(topic&&loaded){changeFilter('topic',topic.dataset.topic);return;}
    if(e.target.closest('[data-reset]')){changeFilter('reset');return;}
    const link=e.target.closest('[data-open]');
    if(link&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.altKey&&e.button===0){e.preventDefault();recordList(link.id);writeHistory('pushState', {voiceTopics:{...state,scrollY:window.scrollY,focusId:link.id,detail:true}},urlFor(link.dataset.open));showDetail(link.dataset.open);return;}
    const jump=e.target.closest('[data-jump]');if(jump)$(jump.dataset.jump)?.scrollIntoView({block:'start'});
  });
  $('area').addEventListener('change',e=>changeFilter('area',e.target.value));
  $('reset').addEventListener('click',()=>changeFilter('reset'));
  $('more').addEventListener('click',()=>{const old=state.limit;state.limit+=12;render();recordList();const v=listData()[old];if(v)$('read-'+v.id)?.focus({preventScroll:true});});
  $('closeDetail').addEventListener('click',closeDetail);
  dialog.addEventListener('cancel',e=>{e.preventDefault();closeDetail();});
  dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDetail();});
  window.addEventListener('popstate',()=>{if(!loaded)return;state=readURL();const hash=location.hash.slice(1);if(voices.some(v=>v.id===hash)){render();showDetail(hash);}else{render();hideDetail(history.state?.voiceTopics);if(!dialog.open&&history.state?.voiceTopics?.scrollY!==undefined)window.scrollTo(0,history.state.voiceTopics.scrollY);showUnknownVoice(hash);}});
  // Keep Back/Forward list position even when leaving for another page.
  window.addEventListener('pagehide',()=>{if(loaded&&!dialog.open)recordList();});
  window.addEventListener('pageshow',e=>{if(e.persisted&&loaded&&!dialog.open)window.scrollTo(0,history.state?.voiceTopics?.scrollY||0);});
  async function load() {
    $('status').hidden=false;$('status').innerHTML='<p>お客様の声を読み込んでいます。</p>';$('results').setAttribute('aria-busy','true');
    try{
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
      let source,taxonomy,photoData;
      try{[source,taxonomy,photoData]=await Promise.all(['data/voices.json','assets/voice-topics/topics.json','assets/voice-topics/photos.json'].map(async url=>{try { const r=await fetch(url,{signal:controller.signal});if(!r.ok)throw Error('HTTP '+r.status);return await r.json(); } catch(error) {if(url.endsWith('/photos.json'))return {entries:[]};throw error;} }));}finally{clearTimeout(timer);}
      if(!Array.isArray(source.voices)||!Array.isArray(taxonomy.topics)||!Array.isArray(taxonomy.entries))throw Error('Invalid data');
      voices=source.voices;photos=new Map((photoData.entries||[]).filter(e=>e.verified===true&&voices.some(v=>v.id===e.voiceId)&&Array.isArray(e.images)&&e.images.every(i=>/^assets\//.test(i.src)&&i.alt&&i.caption)).map(e=>[e.voiceId,e]));topics=taxonomy.topics;entries=new Map(taxonomy.entries.map(e=>[e.voiceId,e]));
      for(const v of voices){const en=entries.get(v.id);for(const ev of en?.evidence||[]){const answer=v.qa[ev.qaIndex]?.a;if(typeof answer!=='string'||Array.from(answer).slice(ev.start,ev.end).join('')!==ev.excerpt)throw Error('Outdated topic evidence');}}
      $('totalCount').textContent=voices.length;
      $('topics').innerHTML=[{id:'all',label:'すべて'},...topics].map(t=>`<button class="topic" type="button" id="topic-${t.id}" data-topic="${t.id}" aria-pressed="false"><span>${esc(t.label)}</span><span class="topic-count"></span></button>`).join('');
      const areas=[...new Set(voices.map(v=>v.area||'unknown'))];
      $('area').innerHTML='<option value="all">すべての地域</option>'+areas.map(a=>`<option value="${esc(a)}">${esc(a==='unknown'?'地域の記載なし':a)}</option>`).join('');$('area').disabled=false;
      loaded=true;state=readURL();render();
      if(voices.some(v=>v.id===location.hash.slice(1)))showDetail(location.hash.slice(1));
      else {showUnknownVoice(location.hash.slice(1));recordList();}
    }catch(error){loaded=false;$('status').hidden=false;$('status').innerHTML='<p>お客様の声を読み込めませんでした。もう一度お試しください。</p><button type="button" id="retry">再読み込み</button>';$('results').setAttribute('aria-busy','false');$('retry').addEventListener('click',load);}
  }
  load();
})();
