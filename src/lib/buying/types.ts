import { z } from 'zod';
export const buyingStatusSchema=z.enum(['pending','processing','needs_input','in_cart','purchased','skipped','failed']);
export const buyingLineSchema=z.object({itemId:z.string().max(80),name:z.string().max(120),productTitle:z.string().max(500),productUrl:z.string().url().nullable(),quantity:z.number().int().min(1).max(99),preferences:z.string().max(2000),status:buyingStatusSchema,message:z.string().max(1500),attention:z.enum(['none','retailer','variant','login','captcha','stock','verification','browser','selection']).default('none'),asin:z.string().nullable(),resolvedAsin:z.string().regex(/^[A-Z0-9]{10}$/).optional(),resolvedTitle:z.string().max(500).optional(),evidence:z.object({asin:z.string(),quantity:z.number().int().min(1),checkedAt:z.string()}).nullable(),purchaseReportedAt:z.string().nullable()});
export const buyingJobSchema=z.object({id:z.string().uuid(),marketplace:z.literal('amazon.sg'),state:z.enum(['idle','running','waiting','paused','finished','cancelled']),lines:z.array(buyingLineSchema).max(210),activeItemId:z.string().nullable(),message:z.string().max(1500),createdAt:z.string(),updatedAt:z.string(),logs:z.array(z.object({at:z.string(),itemId:z.string().nullable(),message:z.string().max(1000)})).max(100)});
export type BuyingLine=z.infer<typeof buyingLineSchema>;
export type BuyingJob=z.infer<typeof buyingJobSchema>;
export function amazonAsin(url:string|null){if(!url)return null;try{const u=new URL(url);if(u.protocol!=='https:'||!['amazon.sg','www.amazon.sg'].includes(u.hostname)||u.username||u.password)return null;return u.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:[/?]|$)/i)?.[1].toUpperCase()??null}catch{return null}}
export function amazonProductUrl(asin:string){if(!/^[A-Z0-9]{10}$/.test(asin))throw new Error('Invalid Amazon product');return `https://www.amazon.sg/dp/${asin}`;}
export const AMAZON_CART='https://www.amazon.sg/gp/cart/view.html';
// Next can normalize the server URL to localhost even when the browser uses
// 127.0.0.1. Treat loopback aliases on the same protocol/port as this app.
export function localAgentRequest(request:Request){
 const isLoopback=(url:URL)=>['127.0.0.1','localhost','[::1]'].includes(url.hostname)&&['http:','https:'].includes(url.protocol)&&!url.username&&!url.password;
 try{
  const url=new URL(request.url);
  if(!isLoopback(url))return false;
  const origin=request.headers.get('origin');
  if(origin){
   const source=new URL(origin);
   if(!isLoopback(source)||source.protocol!==url.protocol||source.port!==url.port||source.origin!==origin)return false;
   return true;
  }
  return request.headers.get('sec-fetch-site')!=='cross-site';
 }catch{return false;}
}
