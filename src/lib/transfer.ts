import { z } from 'zod';
import { sessionSchema,type Session } from './schemas';
import { catalog,subtotal } from './catalog';
export const portableSchema=z.object({format:z.literal('goalfirst'),version:z.literal(1),savedAt:z.string(),session:sessionSchema});
export function exportSession(session:Session){return JSON.stringify({format:'goalfirst',version:1,savedAt:new Date().toISOString(),session},null,2)}
export function importSession(text:string):Session{
 if(text.length>500000)throw new Error('File is too large (maximum 500 KB).');
 const {session}=portableSchema.parse(JSON.parse(text));
 if(session.cart.some(l=>!catalog.some(p=>p.id===l.productId)))throw new Error('This file contains products unavailable in this demo catalog.');
 return session;
}
const status={unreviewed:'[ ] Unreviewed',to_buy:'[ ] To buy',already_have:'[x] Already have',dont_need:'[-] Don’t need'};
export function checklistMarkdown(session:Session,shoppingOnly=false){
 const p=session.plan;if(!p)return '# GoalFirst\nNo active checklist.';
 const aiItems=shoppingOnly?p.checklist.filter(i=>i.status==='to_buy'):p.checklist;const ownItems=shoppingOnly?(session.customItems??[]).filter(i=>i.status==='to_buy'):(session.customItems??[]);const items=aiItems;
 const lines=[`# ${shoppingOnly?'Shopping':'Preparation'} checklist — ${p.title}`,'',`Destination: ${p.destination} | ${p.durationDays} days | ${p.purpose==='Leisure'?'Holiday':p.purpose}`,`Goal: ${session.input}`,'',...items.flatMap(i=>[`- ${status[i.status]} — ${i.name}`,`  Why: ${i.reason}`,`  Priority: ${i.priority}`]),'','## Cart — fictional demo products',...session.cart.map(l=>{const product=catalog.find(p=>p.id===l.productId)!;return `- [ ] ${product.name} × ${l.quantity} — SGD ${(product.price*l.quantity).toFixed(2)} (demo only; SKU ${product.id})`}),`Demo subtotal: SGD ${subtotal(session.cart).toFixed(2)}`,'','Prices are fictional fixtures. Verify real retailer prices, compatibility and availability before buying.','Source of demo products: src/lib/catalog.ts; inspect /api/catalog in the app.'];
 lines.push('','## Your own additions',...ownItems.map(i=>`- ${status[i.status]} — ${i.name}`));
 if(session.weather){const w=session.weather;lines.push('','## Saved weather snapshot',`${w.location.name}, ${w.location.country} | retrieved ${w.fetchedAt}`,w.notice,...w.days.map(d=>`- ${d.date}: ${d.min??'?'}–${d.max??'?'}°C; rain ${d.rain??'unknown'}%`),`Source: ${w.sourceUrl}`,'Refresh forecast in the app before making packing decisions.');}
 if(session.productSelections)lines.push('','## Your chosen products',...Object.entries(session.productSelections).map(([id,url])=>{const item=[...p.checklist,...(session.customItems??[])].find(i=>i.id===id);const source=session.sources?.find(s=>s.itemId===id&&s.url===url);return `- [ ] ${item?.name??id}: ${source?.title??'Selected product'} — ${url}`}));
 if(session.sources?.length)lines.push('','## Retailer research sources (not verified offers)',...session.sources.map(s=>`- ${s.title}: ${s.url} (via ${s.provider}, retrieved ${s.retrievedAt})`));
 if(session.trip?.notes)lines.push('','## Your follow-up notes',session.trip.notes);
 lines.push('','## Assumptions',...p.assumptions.map(a=>`- ${a}`),'','For resuming in GoalFirst, also download the session JSON. This text checklist cannot be imported.');return lines.join('\n');
}
