import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {createInstagramReader,normalizePosts,mediaURL,permalink,CACHE_MS}=require('../../lib/instagram.cjs');
const fakeToken='unit-test-only-not-a-credential';
const image='https://scontent.test.cdninstagram.com/photo.jpg?signature=public-media-url';
const post=(n,extra={})=>({id:String(n),media_type:'IMAGE',media_url:image,permalink:`https://www.instagram.com/p/TEST_${n}/`,timestamp:`2026-09-${String(n%28+1).padStart(2,'0')}T00:00:00Z`,caption:'住宅写真',...extra});
const response=(data,ok=true)=>({ok,json:async()=>data});
const account={id:'17840000000000',username:'yamatonoie'};

test('image and permalink allow-lists reject insecure or deceptive hosts',()=>{
  for(const bad of ['http://cdninstagram.com/a','https://cdninstagram.com.evil.test/a','https://evil.test/?cdninstagram.com','javascript:alert(1)','https://user:pass@cdninstagram.com/a','/local.jpg'])assert.equal(mediaURL(bad),null);
  for(const bad of ['https://www.instagram.com.evil.test/p/a/','https://instagram.com/explore/','https://user:pass@instagram.com/p/a/','http://instagram.com/p/a/','https://instagram.com/p/a/more'])assert.equal(permalink(bad),null);
  assert.equal(mediaURL(image),image);
  assert.equal(permalink('https://instagram.com/reel/TEST_1/?utm_source=test'),'https://www.instagram.com/reel/TEST_1/');
});
test('normalizer returns ten newest unique safe posts with only public display fields',()=>{
  const result=normalizePosts({data:[...Array.from({length:18},(_,i)=>post(i+1,{extra:'not exposed',access_token:'never serialize'})),post(18),post(99,{media_url:'https://evil.test/x'}),post(100,{timestamp:'bad'}),post(101,{id:'non-numeric'})]});
  assert.equal(result.length,10);assert.equal(result[0].id,'18');assert.equal(result.at(-1).id,'9');
  assert.ok(!JSON.stringify(result).includes('never serialize'));assert.ok(!JSON.stringify(result).includes('not exposed'));
});
test('carousel and video use safe images, not videos or invented captions',()=>{
  const result=normalizePosts({data:[post(1,{media_type:'CAROUSEL_ALBUM',media_url:null,caption:null,children:{data:[{media_type:'VIDEO',thumbnail_url:image,media_url:'https://video.cdninstagram.com/movie.mp4'},{media_type:'IMAGE',media_url:image}]}}),post(2,{media_type:'VIDEO',media_url:'https://video.cdninstagram.com/movie.mp4',thumbnail_url:image}),post(3,{media_type:'VIDEO',thumbnail_url:null})]});
  assert.equal(result.length,2);assert.equal(result[1].children.length,2);assert.equal(result[1].caption,'');assert.ok(!JSON.stringify(result).includes('.mp4'));
});
test('only two authenticated GETs, fixed account and paths, header-only credential',async()=>{
  const calls=[];const read=createInstagramReader({fetchImpl:async(url,options)=>{calls.push({url,options});return response(calls.length===1?account:{data:[post(1)]});}});
  const result=await read({token:fakeToken});assert.equal(result.posts.length,1);assert.equal(calls.length,2);
  for(const {url,options} of calls){assert.equal(new URL(url).origin,'https://graph.instagram.com');assert.ok(!url.includes(fakeToken));assert.equal(options.headers.Authorization,`Bearer ${fakeToken}`);assert.equal(options.redirect,'error');assert.ok(options.signal instanceof AbortSignal);assert.ok(!options.method||options.method==='GET');}
  assert.equal(new URL(calls[0].url).pathname,'/v25.0/me');assert.equal(new URL(calls[1].url).pathname,`/v25.0/${account.id}/media`);
  assert.ok(!JSON.stringify(result).includes(fakeToken));
});
test('wrong account, malformed identity and absent credential fail closed',async()=>{
  for(const identity of [{...account,username:'someone_else'},{...account,id:'../arbitrary'}]){let calls=0;const read=createInstagramReader({fetchImpl:async()=>{calls++;return response(identity);}});await assert.rejects(read({token:fakeToken}),/instagram_unavailable/);assert.equal(calls,1);}
  let calls=0;const read=createInstagramReader({fetchImpl:async()=>{calls++;return response(account);}});
  for(const token of [null,'',undefined,' '])await assert.rejects(read({token}),/instagram_unavailable/);
  await assert.rejects(read({token:fakeToken,version:'v25.0/../../'}));assert.equal(calls,0);
});
test('unsupported optional caption/children get one minimal retry',async()=>{
  const calls=[];const read=createInstagramReader({fetchImpl:async(url)=>{calls.push(url);return response(calls.length===1?account:calls.length===2?{error:{code:100,message:'private upstream text'}}:{data:[post(1,{caption:undefined})]},calls.length!==2);}});
  assert.equal((await read({token:fakeToken})).posts.length,1);assert.equal(calls.length,3);assert.ok(!new URL(calls[2]).searchParams.get('fields').includes('caption'));
});
test('cache and in-flight de-duplication, then failure never returns stale data',async()=>{
  let time=Date.parse('2026-09-05T00:00:00Z'),calls=0,fail=false;
  const read=createInstagramReader({now:()=>time,fetchImpl:async(url)=>{calls++;if(fail)throw Error('upstream internal details');return response(url.includes('/me?')?account:{data:[post(1)]});}});
  const results=await Promise.all([read({token:fakeToken}),read({token:fakeToken}),read({token:fakeToken})]);assert.equal(calls,2);assert.deepEqual(results[0],results[2]);
  time+=CACHE_MS-1;await read({token:fakeToken});assert.equal(calls,2);
  time+=2;fail=true;await assert.rejects(read({token:fakeToken}));assert.equal(calls,3);
  fail=false;await read({token:fakeToken});assert.equal(calls,5);
});
test('credential rotation never inherits a cached account',async()=>{
  const calls=[];const read=createInstagramReader({fetchImpl:async(url,options)=>{calls.push(options.headers.Authorization);return response(url.includes('/me?')?(options.headers.Authorization.endsWith('-other')?{...account,username:'other'}:account):{data:[post(1)]});}});
  await read({token:fakeToken});await assert.rejects(read({token:`${fakeToken}-other`}),/instagram_unavailable/);assert.equal(calls.length,3);
});
test('malformed upstream body and auth failure do not get optional-field retries',async()=>{
  for(const variant of ['json','auth']){let calls=0;const read=createInstagramReader({fetchImpl:async()=>{calls++;if(variant==='json')return {ok:true,json:async()=>{throw Error('invalid JSON');}};return response({error:{code:190,message:fakeToken}},false);}});await assert.rejects(read({token:fakeToken}));assert.equal(calls,1);}
});
test('diagnostic errors contain only fixed stages and numeric upstream codes',async()=>{
  const read=createInstagramReader({fetchImpl:async()=>({ok:false,status:400,json:async()=>({error:{code:190,message:fakeToken,url:`https://example.test/${fakeToken}`}})})});
  await assert.rejects(read({token:fakeToken}),error=>{assert.equal(error.stage,'account');assert.equal(error.code,190);assert.equal(error.status,400);assert.ok(!JSON.stringify(error).includes(fakeToken));assert.equal(error.message,'instagram_unavailable');return true;});
});
test('HTTP handler rejects writes and emits generic unavailable without secrets',async()=>{
  const saved=process.env.INSTAGRAM_ACCESS_TOKEN;delete process.env.INSTAGRAM_ACCESS_TOKEN;
  try{
    const handler=require('../../api/instagram.js');
    const call=async(method)=>{const headers={};let status,body;const res={setHeader:(k,v)=>headers[k]=v,status:n=>(status=n,res),json:value=>(body=value,res)};await handler({method},res);return{headers,status,body};};
    const write=await call('POST');assert.equal(write.status,405);assert.equal(write.headers.Allow,'GET');
    const missing=await call('GET');assert.equal(missing.status,503);assert.equal(missing.headers['Cache-Control'],'no-store');assert.deepEqual(missing.body,{error:'temporarily_unavailable',posts:[]});
  }finally{if(saved===undefined)delete process.env.INSTAGRAM_ACCESS_TOKEN;else process.env.INSTAGRAM_ACCESS_TOKEN=saved;}
});
