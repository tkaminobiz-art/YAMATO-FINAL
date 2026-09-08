import {validateInquiry} from '../assets/land-payment-study/inquiry-contract.mjs';
// Read-only contract endpoint until an approved durable store and recipient are connected.
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'POSTで送信してください。'});}
 try{
  const raw=typeof req.body==='string'?req.body:JSON.stringify(req.body??{});if(raw.length>20000)return res.status(413).json({error:'データが大きすぎます。'});
  const body=JSON.parse(raw);if(body.contact)return res.status(503).json({error:'実際の受付は準備中です。個人情報は保存していません。'});
  const verified=validateInquiry(body);
  if(body.dryRun===true)return res.status(200).json({valid:true,mode:'validation-only',stored:false,sent:false,...verified});
  return res.status(503).json({error:'実際の受付は準備中です。相談は送信されていません。',stored:false,sent:false});
 }catch(e){return res.status(400).json({error:e instanceof SyntaxError?'JSON形式を確認してください。':e.message});}
}
