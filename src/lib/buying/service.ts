import { AmazonBrowser } from './amazon';
import { runQueue } from './runner';
import { buildBuyingJob,logJob,reportPurchased } from './queue';
import { type BuyingJob,amazonAsin,amazonProductUrl } from './types';
import { type Session } from '../schemas';
type Store={jobs:Map<string,BuyingJob>;adapter:AmazonBrowser;pauses:Set<string>;running:string|null;};
const globalStore=globalThis as typeof globalThis&{goalFirstBuying?:Store};
const store:Store=globalStore.goalFirstBuying??= {jobs:new Map(),adapter:new AmazonBrowser(),pauses:new Set(),running:null};
export function getJob(id:string){return store.jobs.get(id)??null;}
export function createJob(session:Session){if(store.running)throw new Error('Pause the running preparation before starting another.');const job=buildBuyingJob(session);if(!job.lines.length)throw new Error('Mark at least one item To buy first.');const previous=session.buyingJob;for(const line of job.lines){const old=previous?.lines.find(l=>l.itemId===line.itemId&&l.productUrl===line.productUrl&&l.status==='purchased');if(old?.purchaseReportedAt){line.status='purchased';line.purchaseReportedAt=old.purchaseReportedAt;line.message='Previously reported purchased by you; will not add again.';}}store.jobs.set(job.id,job);if(store.jobs.size>20){for(const key of store.jobs.keys()){if(key!==store.running&&key!==job.id){store.jobs.delete(key);break}}}return job;}
function schedule(job:BuyingJob,acceptVariantFor?:string){if(store.running)throw new Error('A preparation step is already running.');store.pauses.delete(job.id);store.running=job.id;job.state='running';void runQueue(job,store.adapter,{acceptVariantFor,shouldPause:()=>store.pauses.has(job.id)||job.state==='cancelled'}).catch(()=>{job.state='waiting';job.message='The preparation stopped unexpectedly. Check the Edge window before resuming.';const line=job.lines.find(l=>l.status==='processing');if(line){line.status='needs_input';line.attention='browser';line.message=job.message;}logJob(job,job.message);}).finally(()=>{store.running=null});}
export async function buyingAction(id:string,action:string,options:{itemId?:string;acceptCurrentVariant?:boolean;confirmed?:boolean;productUrl?:string;title?:string;quantity?:number}={}){
 const job=getJob(id);if(!job)throw new Error('Preparation session no longer exists in the server. Rebuild from your saved plan.');
 const line=job.lines.find(l=>l.itemId===options.itemId);
 if(action==='pause'||action==='cancel'){store.pauses.add(id);if(action==='cancel')job.state='cancelled';else if(store.running!==id)job.state='paused';job.message=store.running===id?'Stopping after the current browser step. No checkout will be performed.':'Preparation paused.';logJob(job,job.message);return job;}
 if(action==='focus'){await store.adapter.focus();return job;}
 if(action==='cart'){if(store.running)throw new Error('Wait for or pause the current browser step before opening the cart.');await store.adapter.cart();return job;}
 if(action==='close_browser'){if(store.running)throw new Error('Pause the browser step before closing Edge.');await store.adapter.close();job.message='Agent browser closed. A new isolated session will be opened next time.';logJob(job,job.message);return job;}
 if(store.running)throw new Error('Wait for the current step to finish or pause it.');
 if(action==='replace'){
  if(!line||!options.productUrl)throw new Error('Choose a replacement product.');const asin=amazonAsin(options.productUrl);if(!asin)throw new Error('Choose a direct Amazon.sg product link.');line.productUrl=amazonProductUrl(asin);line.productTitle=options.title?.slice(0,500)||line.name;line.quantity=options.quantity??line.quantity;line.asin=asin;line.resolvedAsin=undefined;line.resolvedTitle=undefined;line.status='pending';line.attention='none';line.evidence=null;line.message='Amazon.sg replacement selected by you. Ready to continue.';job.state='paused';logJob(job,line.message,line.itemId);return job;
 }
 if(action==='purchased'){reportPurchased(job,options.itemId??'',options.confirmed===true);return job;}
 if(action==='skip'){if(!line)throw new Error('Item not found.');if(line.status==='in_cart'||line.status==='purchased')throw new Error('This item is already prepared or purchased. The agent will not remove merchant cart items.');line.status='skipped';line.message='Skipped by you. No product was purchased.';line.attention='none';logJob(job,line.message,line.itemId);job.state='paused';return job;}
 if(action==='resume'){
  if(!line||!['needs_input','failed'].includes(line.status))throw new Error('Choose an item that needs input.');if(line.attention==='retailer')throw new Error('Choose an Amazon.sg product before resuming.');if(line.attention==='variant'&&!options.acceptCurrentVariant)throw new Error('Confirm the current product/variant in Edge before resuming.');line.status='pending';line.attention='none';line.message='Resuming after your input; checking the cart first.';schedule(job,options.acceptCurrentVariant?line.itemId:undefined);return job;
 }
 if(action==='start'){
  if(!options.confirmed)throw new Error('Confirm that the agent may add these items to the Amazon.sg cart.');if(job.state==='cancelled')throw new Error('This preparation was cancelled. Rebuild the queue to start again.');schedule(job);return job;
 }
 throw new Error('Unsupported preparation action.');
}
export async function smokeBrowser(){if(store.running)throw new Error('Preparation is running.');try{return await store.adapter.smoke()}finally{await store.adapter.close()}}
