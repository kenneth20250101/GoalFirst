import { type BuyingJob,type BuyingLine } from './types';
import { logJob } from './queue';
export type PreparationOutcome={status:'in_cart';message:string;asin:string;quantity:number}|{status:'needs_input'|'failed';message:string;attention:BuyingLine['attention']};
export interface BuyingAdapter{prepare(line:BuyingLine,acceptVariant:boolean):Promise<PreparationOutcome>;focus():Promise<void>;cart():Promise<void>;close():Promise<void>}
export async function runQueue(job:BuyingJob,adapter:BuyingAdapter,options:{acceptVariantFor?:string;shouldPause:()=>boolean}){
 const currentState=()=>job.state;
 job.state='running';job.message='Preparing products one at a time. You will be asked when input is needed.';logJob(job,job.message);
 while(true){
  if(options.shouldPause()){job.state=currentState()==='cancelled'?'cancelled':'paused';job.activeItemId=null;job.message='Preparation paused. No checkout was performed.';logJob(job,job.message);return;}
  const line=job.lines.find(l=>l.status==='pending');
  if(!line){job.activeItemId=null;const blocked=job.lines.some(l=>l.status==='needs_input'||l.status==='failed');job.state=blocked?'waiting':'finished';job.message=blocked?'Some items need your input. Other prepared products remain in the cart.':'Preparation finished. Open the Amazon.sg cart to review and complete checkout yourself.';logJob(job,job.message);return;}
  line.status='processing';line.message='Opening product, checking the variant and preparing quantity.';job.activeItemId=line.itemId;logJob(job,line.message,line.itemId);
  let result:PreparationOutcome;try{result=await adapter.prepare(line,options.acceptVariantFor===line.itemId)}catch{result={status:'needs_input',attention:'browser',message:'The browser step did not finish. Check the Edge window, then resume. The cart will be checked before another add attempt.'}}
  if(result.status==='in_cart'){
   if(!line.asin||result.asin!==(line.resolvedAsin??line.asin)||result.quantity!==line.quantity){line.status='needs_input';line.attention='verification';line.message='Cart evidence did not match the requested product and quantity. Check the browser before continuing.';}
   else{line.status='in_cart';line.attention='none';line.evidence={asin:result.asin,quantity:result.quantity,checkedAt:new Date().toISOString()};line.message=result.message;}
  }else{line.status=result.status;line.attention=result.attention;line.message=result.message;}
  logJob(job,line.message,line.itemId);
  if(line.status!=='in_cart'){job.state='waiting';job.message='Your input is needed. Use the Edge window, then resume this item, or skip it.';logJob(job,job.message,line.itemId);return;}
 }
}
