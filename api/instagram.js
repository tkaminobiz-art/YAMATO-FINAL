'use strict';
const {createInstagramReader,CACHE_MS}=require('../lib/instagram.cjs');
const read=createInstagramReader();
module.exports=async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'method_not_allowed'});}
  try {
    const result=await read({token:process.env.INSTAGRAM_ACCESS_TOKEN,version:process.env.INSTAGRAM_API_VERSION||'v25.0'});
    res.setHeader('Cache-Control','public, max-age=0, must-revalidate');
    // Do not add a second full TTL on top of an already cached upstream response.
    const ttl=Math.max(0,Math.min(CACHE_MS/1000,Math.floor((CACHE_MS-(Date.now()-Date.parse(result.fetchedAt)))/1000)));
    res.setHeader('CDN-Cache-Control',`public, s-maxage=${ttl}`);
    res.setHeader('Vercel-CDN-Cache-Control',`public, s-maxage=${ttl}`);
    return res.status(200).json(result);
  } catch (error) {
    // Upstream errors can contain credential-bearing request URLs. Never log or serialize them.
    // Log only fixed stages and numeric codes; never the error object, message, URL or credential.
    const stages=['configuration','account','media','account_identity','account_network','media_network','account_response','media_response'];
    console.warn('instagram_read_failed',JSON.stringify({stage:stages.includes(error?.stage)?error.stage:'unknown',code:Number.isSafeInteger(error?.code)?error.code:null,status:Number.isSafeInteger(error?.status)?error.status:null}));
    res.setHeader('Retry-After','60');
    return res.status(503).json({error:'temporarily_unavailable',posts:[]});
  }
};
