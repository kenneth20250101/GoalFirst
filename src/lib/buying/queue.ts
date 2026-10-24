import { type Session } from '../schemas';
import { isTask } from '../needs';
import { purchaseSummary } from '../purchase';
import { amazonAsin,amazonProductUrl,type BuyingJob,type BuyingLine } from './types';
export function buildBuyingJob(session:Session,id=crypto.randomUUID(),now=new Date().toISOString()):BuyingJob{
 const items=[...(session.plan?.checklist??[]),...(session.customItems??[])].filter(i=>!isTask(i)&&i.status==='to_buy');
 const choices=purchaseSummary(session).lines;
 const lines:BuyingLine[]=items.flatMap(item=>{
  const selected=choices.filter(c=>c.itemId===item.id);
  return (selected.length?selected:[null]).map(choice=>{
   const url=choice?.url??null;const asin=amazonAsin(url);
   return {itemId:choice?.lineId??item.id,name:item.name,productTitle:choice?.title??item.name,productUrl:asin?amazonProductUrl(asin):url,quantity:choice?.quantity??1,preferences:session.productSearches?.[item.id]?.refinements.join('\n').slice(-2000)??'',status:asin?'pending' as const:'needs_input' as const,message:asin?'Ready to prepare in Amazon.sg.':url?'Selected product is not an Amazon.sg product. Choose an Amazon.sg alternative.':'Choose a product before this item can be prepared.',attention:asin?'none' as const:'retailer' as const,asin,evidence:null,purchaseReportedAt:null};
  });
 });
 for(const line of lines){const old=session.buyingJob?.lines.find(previous=>previous.itemId===line.itemId&&previous.productUrl===line.productUrl&&previous.status==='purchased');if(old?.purchaseReportedAt){line.status='purchased';line.purchaseReportedAt=old.purchaseReportedAt;line.message='Previously reported purchased by you; will not add again.';}}
 return {id,marketplace:'amazon.sg',state:'idle',lines,activeItemId:null,message:'Review the selected products and variants, then start. The agent only prepares the cart; you complete checkout.',createdAt:now,updatedAt:now,logs:[]};
}
export function logJob(job:BuyingJob,message:string,itemId:string|null=null){job.updatedAt=new Date().toISOString();job.logs=[...job.logs,{at:job.updatedAt,itemId,message:message.slice(0,1000)}].slice(-100);}
export function reportPurchased(job:BuyingJob,itemId:string,confirmed:boolean){const line=job.lines.find(l=>l.itemId===itemId);if(!line||!confirmed||line.status==='processing')throw new Error('Confirm you completed checkout yourself before marking an item purchased.');line.status='purchased';line.purchaseReportedAt=new Date().toISOString();line.message='Purchase reported by you after completing merchant checkout; not independently verified.';logJob(job,line.message,line.itemId);}
export function sameChoices(job:BuyingJob,session:Session){const fresh=buildBuyingJob(session,job.id);return JSON.stringify(fresh.lines.map(l=>[l.itemId,l.productUrl,l.quantity,l.preferences]))===JSON.stringify(job.lines.map(l=>[l.itemId,l.productUrl,l.quantity,l.preferences]));}
