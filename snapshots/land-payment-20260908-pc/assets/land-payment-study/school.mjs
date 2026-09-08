export const schoolTypes={primary:'小学校',junior:'中学校'};
export const schoolLimits=[800,1200,1600];
export const searchSorts=['price','area','walk','primary','junior','updated','region'];

// Compare published distances only; coordinates do not establish school routes.
export function listedSchool(p,key){
 const type=schoolTypes[key];
 if(!type)return null;
 return (p.amenities??[]).filter(a=>a.type===type&&a.name&&a.source===p.source&&typeof a.publishedMeters==='number'&&Number.isFinite(a.publishedMeters)&&a.publishedMeters>0)
  .sort((a,b)=>a.publishedMeters-b.publishedMeters||a.name.localeCompare(b.name,'ja'))[0]??null;
}
export const schoolDistance=(p,key)=>listedSchool(p,key)?.publishedMeters??null;
