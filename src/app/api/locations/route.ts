import { z } from 'zod';
import { locationSchema } from '@/lib/travel';
const geo=z.object({results:z.array(z.object({id:z.number(),name:z.string(),country:z.string().optional(),admin1:z.string().optional(),latitude:z.number(),longitude:z.number()})).optional()});
export async function GET(request:Request){
 const q=new URL(request.url).searchParams.get('q')?.trim()??'';
 if(q.length<2||q.length>100)return Response.json({error:'Enter a city name (2–100 characters).'},{status:400});
 try{const url=new URL('https://geocoding-api.open-meteo.com/v1/search');url.search=new URLSearchParams({name:q,count:'6',language:'en',format:'json'}).toString();const res=await fetch(url,{signal:AbortSignal.timeout(10000)});if(!res.ok)throw new Error();const data=geo.parse(await res.json());return Response.json({locations:(data.results??[]).map(r=>locationSchema.parse({...r,country:r.country??'Unknown',region:r.admin1??''})),source:'Open-Meteo / GeoNames'});}catch{return Response.json({error:'City search is unavailable. Retry, or continue without weather.'},{status:503});}
}
