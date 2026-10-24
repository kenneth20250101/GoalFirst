import { type Plan, type Item, planSchema } from './schemas';
export function samplePlan(text:string,purpose='Leisure'):Plan{
 const duration=Number(text.match(/(\d+)\s*[- ]?days?/i)?.[1]??5);
 const rows:[string,string,string,Item['priority'],string,Item['productCategory']][]=[
 ['documents','Documents & logistics','Travel documents & reservations','essential','Check your passport, entry requirements and bookings with official sources.',null],
 ['connectivity','Connectivity','Mobile data plan / eSIM','recommended','Useful for maps and reservations when Wi-Fi is unavailable.','travel_esim'],
 ['bag','Daily essentials','A comfortable day bag','recommended','Carry your daily essentials while exploring or commuting.','day_bag'],
 ['power','Connectivity','Portable power bank','recommended','Consider backup power for long days using maps. Verify airline restrictions.','power_bank'],
 ['adapter','Connectivity','Compatible power adapter','optional','Only needed if your current plugs differ; check device voltage too.','adapter'],
 ['clothing','Personal items',purpose==='Business'?'Meeting-ready clothing':'Weather-appropriate clothing','recommended','Check the forecast closer to departure and use clothing you already own.',null],
 ['toiletries','Personal items','Travel toiletries','recommended','Bring your usual personal care items in suitable containers.','toiletries'],
 ['organizers','Personal items','Packing organizers','optional','Keep a multi-day bag organized; existing pouches may be enough.','organizers'],
 ['insurance','Documents & logistics','Review travel insurance','optional','Consider your existing coverage and personal needs; no policy is sold here.',null]
 ];
 return planSchema.parse({title:'Your Japan trip',destination:'Japan',durationDays:Math.min(365,Math.max(1,duration)),purpose,assumptions:['Sample Japan itinerary; this is a deterministic demo, not live AI.', 'Weather, entry rules, plug compatibility and airline requirements have not been verified.',...(!/japan/i.test(text)?['Your goal is outside the sample scenario. Showing the Japan example; enable live AI for a tailored plan.']:[])],checklist:rows.map(([id,category,name,priority,reason,productCategory])=>({id,category,name,priority,reason,status:'unreviewed',productCategory,kind:['documents','insurance'].includes(id)?'task':'item'}))});
}
export function preserveStatuses(plan:Plan,previous:Item[]=[]):Plan{return {...plan,checklist:plan.checklist.map(i=>({...i,status:previous.find(p=>p.id===i.id&&p.name===i.name)?.status??'unreviewed'}))};}
