'use client';
import { useEffect,useRef,useState } from 'react';
import { type Session } from '@/lib/schemas';
import { buildBuyingJob } from '@/lib/buying/queue';
import { AMAZON_CART } from '@/lib/buying/types';
import { purchaseSummary } from '@/lib/purchase';
import SessionTransfer from './SessionTransfer';
export default function MockBuying({session,onChange,onBack,onReal}:{session:Session;onChange:(apply:(s:Session)=>Session)=>void;onBack:()=>void;onReal:()=>void}){
 const [resetRequested,setResetRequested]=useState(false);const [activityOpen,setActivityOpen]=useState(false);const [celebrating,setCelebrating]=useState(false);const successPanel=useRef<HTMLDivElement>(null);
 const [processing,setProcessing]=useState('');const [payment,setPayment]=useState(false);const [confirmed,setConfirmed]=useState(false);const lock=useRef(false);const paymentDialog=useRef<HTMLDialogElement>(null);const activityPanel=useRef<HTMLElement>(null);const liveActivity=useRef<HTMLDetailsElement>(null);const cartPanel=useRef<HTMLDivElement>(null);const logPanel=useRef<HTMLOListElement>(null);const [activeTask,setActiveTask]=useState('');const [taskStep,setTaskStep]=useState('');
 const lines=buildBuyingJob(session).lines;const records=session.mockPurchases??{};
 const key=(line:typeof lines[number])=>JSON.stringify([line.itemId,line.productUrl,line.quantity]);
 const selected=lines.filter(l=>l.productUrl);const pending=lines.filter(l=>!l.productUrl);
 const completed=selected.filter(l=>records[key(l)]);const unpurchased=selected.filter(l=>!records[key(l)]);
 const cart=unpurchased.filter(l=>session.mockCart?.includes(key(l)));const next=unpurchased.find(l=>!session.mockCart?.includes(key(l)));
 const done=selected.length>0&&completed.length===selected.length;const summary=purchaseSummary(session);
 const cartSummary=summary.lines.filter(l=>cart.some(c=>c.itemId===l.lineId));
 const total=cartSummary.reduce((sum,l)=>sum+(l.lineCents??0),0);const unknown=cartSummary.some(l=>l.lineCents===null);
 function activity(text:string){onChange(s=>({...s,mockActivity:[...(s.mockActivity??[]),{at:new Date().toISOString(),text}].slice(-100)}));}
 function downloadInvoice(invoice:NonNullable<Session['mockInvoices']>[number]){const url=URL.createObjectURL(new Blob([invoice.text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`${invoice.id}.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 async function step(text:string){setProcessing(text);activity(text);await new Promise<void>(resolve=>setTimeout(resolve,1100));}
 useEffect(()=>{if(logPanel.current)logPanel.current.scrollTop=logPanel.current.scrollHeight},[session.mockActivity?.length]);
 useEffect(()=>{if(!celebrating)return;const timer=setTimeout(()=>setCelebrating(false),3600);requestAnimationFrame(()=>successPanel.current?.scrollIntoView({behavior:'smooth',block:'start'}));return()=>clearTimeout(timer)},[celebrating]);
 async function act(kind:'add'|'pay'){
  if(lock.current||kind==='add'&&!next||kind==='pay'&&(!confirmed||!cart.length))return;
  lock.current=true;setActivityOpen(true);setProcessing(kind==='add'?'Adding product to demo cart…':'Processing simulated payment…');
  const batch=[...cart];
  try{
   if(kind==='add'){
    const queue=unpurchased.filter(line=>!session.mockCart?.includes(key(line)));
    requestAnimationFrame(()=>liveActivity.current?.scrollIntoView({behavior:'smooth',block:'start'}));
    activity(`Instruction received: prepare ${queue.length} selected product(s). I will stop before payment. Demo execution only.`);
    for(const [index,line] of queue.entries()){
     setActiveTask(line.itemId);setTaskStep('Review selected product');
     await step(`[${index+1}/${queue.length}] Reviewing ${line.productTitle} × ${line.quantity} · simulated`);
     setTaskStep('Prepare retailer cart');
     await step(`Preparing ${new URL(line.productUrl!).hostname} cart entry · simulated, no website operated`);
     setTaskStep('Add product to cart');
     await step(`Adding ${line.productTitle} × ${line.quantity} to the demo cart…`);
     onChange(current=>({...current,mockCart:[...new Set([...(current.mockCart??[]),key(line)])]}));
     activity(`✓ Completed: ${line.productTitle} is in the demo cart.`);
    }
    setTaskStep('Cart ready');setActiveTask('');
    activity('✓ All selected products prepared. Shopping cart is ready for your review. Waiting for your payment confirmation.');
    requestAnimationFrame(()=>cartPanel.current?.scrollIntoView({behavior:'smooth',block:'start'}));
    return;
   }else{
    paymentDialog.current?.close();
    await step('Your payment approval received. Continuing the purchase · simulated.');
    await step('Processing demo payment — no payment provider contacted…');
    await step('Recording the demo order and preparing your bill…');
   }
   const now=new Date().toISOString();const invoiceId=`DEMO-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
   const bill=['GOALFIRST — SIMULATED BILL',`Reference: ${invoiceId}`,`Date: ${now}`,`Goal: ${session.plan?.title??session.input}`,'','DEMO ONLY — No payment processed. Not a merchant invoice or tax receipt.','',...batch.map(line=>{const price=cartSummary.find(c=>c.lineId===line.itemId);return `${line.productTitle} | Qty ${line.quantity} | Unit SGD ${price?.unitPriceSGD??'Unknown'} | Line SGD ${price?.lineCents==null?'Unknown':(price.lineCents/100).toFixed(2)}\nSource: ${line.productUrl}`;}),'',`${unknown?'Known item amount (incomplete)':'Listed item subtotal'}: SGD ${(total/100).toFixed(2)}`,'Shipping, taxes and final merchant charges: unverified.','Payment: simulated, no card charged.','Delivery: awaiting dispatch (simulated).'].join('\n');
   onChange(s=>{
    const updated={...s.mockPurchases};for(const line of batch)updated[key(line)]={itemId:line.itemId,productTitle:line.productTitle,productUrl:line.productUrl!,quantity:line.quantity,completedAt:new Date().toISOString()};
    return {...s,mockInvoices:[...(s.mockInvoices??[]),{id:invoiceId,createdAt:now,text:bill}].slice(-50),mockPurchases:updated,mockCart:(s.mockCart??[]).filter(k=>!batch.some(l=>key(l)===k))};
   });activity('Demo payment complete. Order recorded; bill ready to download or share by email.');setPayment(false);setConfirmed(false);setCelebrating(true);
  }finally{lock.current=false;setProcessing('');}
 }
 return <section className="buying-workspace buying-simple" aria-busy={!!processing}>
 {celebrating&&<div className="purchase-confetti" aria-hidden="true">{Array.from({length:48},(_,i)=><span key={i} style={{left:`${(i*37)%100}%`,background:['#287467','#e8b94b','#da7e8e','#74a9d0','#9a85bd'][i%5],animationDelay:`${(i%9)*.07}s`,animationDuration:`${2.2+(i%5)*.17}s`,width:i%3===0?12:7,height:i%3===0?7:12}}/>)}</div>}
 <div className="buying-top"><button className="text-button" disabled={!!processing} onClick={onBack}>Edit choices</button><span className="buying-mode">Demo · No real payment</span></div>
 <div className="buying-heading"><h1>{done?'All set!':payment?'Confirm your order.':'Ask your agent to buy.'}</h1><p>{session.plan?.title??session.input}</p></div>
 <p className="micro">The agent handles the selected items here. It will stop for your payment confirmation. Demo mode does not open or operate retailer websites.</p><ol className="purchase-stages" aria-label="Purchase progress">{['Prepare cart','Confirm payment','Order complete'].map((label,index)=><li key={label} aria-current={(done?2:payment||(!next&&cart.length)?1:0)===index?'step':undefined}><span>{index+1}</span>{label}</li>)}</ol>
 {!done&&!payment&&(next||processing)&&<section ref={activityPanel} className="buying-controls" aria-label="Agent activity"><h2>{processing?'Agent is working…':'Ready for your instruction'}</h2><div className="buying-agent-tasks">{unpurchased.map(line=><div className="buying-agent-task" key={line.itemId}><span>{session.mockCart?.includes(key(line))?'✓':activeTask===line.itemId?'◉':'○'}</span><div><strong>{line.productTitle}</strong><p>Qty {line.quantity} · {session.mockCart?.includes(key(line))?'Added to demo cart':activeTask===line.itemId?taskStep:'Ready'}</p></div></div>)}</div><div role="status" aria-live="polite">{processing&&<p><span className="processing-spinner" aria-hidden="true"/> {processing}</p>}</div>{next&&<button className="primary" disabled={!!processing} onClick={()=>void act('add')}>{processing?'Preparing…':'Ask agent to buy these items →'}</button>}</section>}
 {cart.length>0&&!processing&&<div ref={cartPanel} className="buying-controls"><h2>{payment?'Payment review':'Your prepared cart'}</h2>{cart.map(line=><div className="purchase-line" key={line.itemId}><div><strong>{line.productTitle}</strong><p>{new URL(line.productUrl!).hostname} · Qty {line.quantity}</p></div>{!payment&&<button className="text-button" onClick={()=>onChange(s=>({...s,mockCart:(s.mockCart??[]).filter(k=>k!==key(line))}))}>Remove</button>}</div>)}<p><strong>{unknown?'Known item amount':'Item subtotal'}: S${(total/100).toFixed(2)}</strong></p><p className="micro">Estimated prices; shipping and final charges unverified. No real payment.</p>{payment?<><label className="buying-consent"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>I confirm these items and quantities for this demo order.</label><div className="buying-button-row"><button className="primary" disabled={!confirmed} onClick={()=>{activity('Waiting for your final payment confirmation.');paymentDialog.current?.showModal()}}>Confirm payment →</button><button className="text-button" onClick={()=>{setPayment(false);setConfirmed(false)}}>Edit cart</button></div></>:<button className="primary" onClick={()=>{setPayment(true);setConfirmed(false);activity('Cart review ready. Waiting for your payment approval.')}}>Review payment →</button>}</div>}
 {payment&&processing&&<div className="buying-controls" role="status" aria-live="polite"><span className="processing-spinner" aria-hidden="true"/><p>{processing}</p></div>}
 {completed.length>0&&<div ref={successPanel} className="buying-controls purchase-success"><span className="purchase-success-icon" aria-hidden="true">✓</span><h2>{done?'Demo purchase successful!':'Demo order confirmed!'}</h2><p>{completed.length} products · Awaiting dispatch (simulated)</p><p className="micro">No real payment or merchant order was created.</p>{session.mockInvoices?.length?(()=>{const invoice=session.mockInvoices[session.mockInvoices.length-1];return <div className="buying-button-row"><button className="primary" onClick={()=>downloadInvoice(invoice)}>Download demo bill</button><a className="secondary" href={`mailto:?subject=${encodeURIComponent(`GoalFirst demo bill ${invoice.id}`)}&body=${encodeURIComponent(invoice.text)}`}>Email draft ↗</a></div>})():null}<details><summary>Order details</summary>{completed.map(line=><p key={line.itemId}><a href={line.productUrl!} target="_blank" rel="noreferrer">{line.productTitle} ↗</a> × {line.quantity}</p>)}<p className="micro">Delivery and tracking are simulated. Email opens a draft for you to send.</p></details></div>}
 {pending.length>0&&<p className="micro">{pending.length} needs have no selected product yet.</p>}
 {!selected.length&&<div className="empty">Choose products in your shopping list to begin.</div>}
 <details><summary>Advanced options</summary><p className="micro">These optional links are separate from demo execution.</p><div className="buying-button-row"><a className="text-button" href={AMAZON_CART} target="_blank" rel="noreferrer">Open my Amazon.sg cart ↗</a><button className="text-button" disabled={!!processing} onClick={onReal}>Real browser preparation</button></div></details>
 <details ref={liveActivity} className="buying-log agent-live-activity" open={activityOpen||!!processing} onToggle={event=>{if(!processing)setActivityOpen(event.currentTarget.open)}}><summary>Agent activity{processing?' · Working…':''}</summary><ol ref={logPanel} className="agent-activity" aria-live="polite" aria-relevant="additions">{(session.mockActivity??[]).map((entry,index)=><li key={`${entry.at}-${index}`}><time>{new Date(entry.at).toLocaleTimeString()}</time><span>{entry.text}</span></li>)}</ol>{!session.mockActivity?.length&&<p>Waiting for your instruction.</p>}{processing&&<p role="status"><span className="processing-spinner" aria-hidden="true"/> {processing}</p>}</details>
 <dialog ref={paymentDialog} className="modal" aria-label="Final simulated payment confirmation"><div className="modal-inner"><h2>Confirm demo payment?</h2><p>{cart.length} products · {unknown?'Known amount':'Item subtotal'} S${(total/100).toFixed(2)}</p><p>No real money will be charged. You’ll receive a downloadable demo bill.</p><div className="buying-button-row"><button className="secondary" onClick={()=>paymentDialog.current?.close()}>Cancel</button><button className="primary" disabled={!!processing||!confirmed} onClick={()=>void act('pay')}>Yes, confirm demo payment</button></div></div></dialog>
 <div className="buying-button-row"><button className="secondary" disabled={!!processing} onClick={()=>setResetRequested(true)}>Reset demo purchase flow</button><span className="micro">Progress is kept when you leave this page.</span></div>
 {resetRequested&&<div className="buying-notice" role="region" aria-label="Reset demo purchase flow"><strong>Restart the demo purchase?</strong><p>Clears the demo cart, demo orders, bills and agent activity. Your goal, conversation, selected products, prices and quantities are kept. No real retailer cart or order is changed.</p><div className="buying-button-row"><button className="primary" disabled={!!processing} onClick={()=>{onChange(s=>({...s,mockCart:[],mockPurchases:{},mockActivity:[],mockInvoices:[]}));setPayment(false);setConfirmed(false);setActivityOpen(false);setActiveTask('');setTaskStep('');setCelebrating(false);setResetRequested(false);window.scrollTo({top:0,behavior:'smooth'})}}>Reset & start again</button><button className="secondary" onClick={()=>setResetRequested(false)}>Cancel</button></div></div>}
 <SessionTransfer session={session} disabled={!!processing} onRestore={value=>{onChange(()=>value);setPayment(false);setConfirmed(false)}}/>
 </section>;
}
