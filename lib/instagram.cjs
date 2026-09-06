'use strict';
/* Server-only Instagram reader. No publishing, messaging, analytics, or token logging. */
const EXPECTED_USERNAME = 'yamatonoie';
const PROFILE_URL = 'https://www.instagram.com/yamatonoie/';
const CACHE_MS = 15 * 60 * 1000;
function failure(stage, code, status) {
  const error = new Error('instagram_unavailable');
  error.stage = stage;
  if (Number.isSafeInteger(code)) error.code = code;
  if (Number.isSafeInteger(status)) error.status = status;
  return error;
}

function mediaURL(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password &&
      /(^|\.)(cdninstagram\.com|fbcdn\.net)$/.test(url.hostname) ? url.href : null;
  } catch { return null; }
}
function permalink(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !['instagram.com','www.instagram.com'].includes(url.hostname) || url.username || url.password || !/^\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?$/.test(url.pathname)) return null;
    return `https://www.instagram.com${url.pathname}`;
  } catch { return null; }
}
function imageData(item) {
  if (!item || !['IMAGE','VIDEO','CAROUSEL_ALBUM'].includes(item.media_type)) return null;
  const image = mediaURL(item.media_type === 'VIDEO' ? item.thumbnail_url : item.media_url);
  if (!image) return null;
  return { media_type: item.media_type, ...(item.media_type === 'VIDEO' ? {thumbnail_url: image} : {media_url: image}) };
}
function normalizePosts(data) {
  const seen = new Set();
  return (Array.isArray(data?.data) ? data.data : []).flatMap(item => {
    if (!item || typeof item.id !== 'string' || !/^\d{1,40}$/.test(item.id) || seen.has(item.id)) return [];
    const link = permalink(item.permalink), date = Date.parse(item.timestamp);
    const children = (Array.isArray(item.children?.data) ? item.children.data : []).map(imageData).filter(Boolean).slice(0,20);
    const visual = imageData(item) || (item.media_type === 'CAROUSEL_ALBUM' && children[0] ? {...children[0],media_type:'CAROUSEL_ALBUM',media_url:children[0].media_url||children[0].thumbnail_url} : null);
    if (!link || !visual || !Number.isFinite(date)) return [];
    seen.add(item.id);
    return [{id:item.id, ...visual, permalink:link, timestamp:new Date(date).toISOString(), caption:typeof item.caption==='string'?item.caption.slice(0,2200):'', ...(children.length?{children}: {})}];
  }).sort((a,b)=>Date.parse(b.timestamp)-Date.parse(a.timestamp)).slice(0,10);
}

function createInstagramReader({fetchImpl = fetch, now = Date.now} = {}) {
  let cache = null, inflight = null, activeCredential = '';
  async function graph(path, fields, token, version) {
    const url = new URL(`https://graph.instagram.com/${version}/${path}`);
    url.searchParams.set('fields',fields);
    if (path.endsWith('/media')) url.searchParams.set('limit','25');
    const stage = path === 'me' ? 'account' : 'media';
    let response, data;
    try { response = await fetchImpl(url.href,{headers:{Authorization:`Bearer ${token}`,Accept:'application/json'},signal:AbortSignal.timeout(8000),redirect:'error'}); }
    catch { throw failure(`${stage}_network`); }
    try { data = await response.json(); } catch { throw failure(`${stage}_response`, undefined, response.status); }
    if (!response.ok || data.error) throw failure(stage, data.error?.code, response.status);
    return data;
  }
  return async function read({token, version='v25.0'} = {}) {
    if (typeof token !== 'string' || !token.trim() || !/^v\d+\.0$/.test(version)) throw failure('configuration');
    // A credential change must never inherit another account's cached media.
    if (activeCredential !== token) {cache=null;inflight=null;activeCredential=token;}
    if (cache && now()-cache.time<CACHE_MS) return cache.value;
    if (inflight) return inflight;
    const credential=token;
    inflight = (async()=>{
      const account = await graph('me','id,username',token,version);
      if (account.username !== EXPECTED_USERNAME || !/^\d{1,40}$/.test(String(account.id||''))) throw failure('account_identity');
      let data;
      try {data = await graph(`${account.id}/media`,'id,media_type,media_url,thumbnail_url,permalink,timestamp,caption,children{id,media_type,media_url,thumbnail_url}',token,version);}
      catch(error) {
        // Some account/API versions do not expose caption or children. Missing optional fields are not invented.
        if (error.code !== 100) throw error;
        data = await graph(`${account.id}/media`,'id,media_type,media_url,thumbnail_url,permalink,timestamp',token,version);
      }
      const value={account:{username:EXPECTED_USERNAME,profileUrl:PROFILE_URL},posts:normalizePosts(data),fetchedAt:new Date(now()).toISOString()};
      if(activeCredential===credential)cache={value,time:now()};
      return value;
    })();
    const pending=inflight;
    try{return await pending;}finally{if(inflight===pending)inflight=null;}
  };
}
module.exports={createInstagramReader,normalizePosts,mediaURL,permalink,CACHE_MS};
