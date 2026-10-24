'use client';
import { useRef,useState } from 'react';
import { type Session } from '@/lib/schemas';
import { exportSession,importSession } from '@/lib/transfer';
function download(name:string,text:string,type:string){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
export default function SessionTransfer({session,onRestore,disabled=false}:{session:Session;onRestore:(s:Session)=>void;disabled?:boolean}){
 const input=useRef<HTMLInputElement>(null);const [pending,setPending]=useState<Session|null>(null);const [error,setError]=useState('');const [startingNew,setStartingNew]=useState(false);
 function startNew(saveFirst:boolean){
  if(disabled)return;
  if(session.buyingJob?.state==='running'){setError('Pause the purchase agent before starting a new conversation.');return;}
  try{
   if(saveFirst)download('goalfirst-plan.json',exportSession(session),'application/json');
   localStorage.setItem('goalfirst-session-v1',JSON.stringify({plan:null,mode:'sample',notice:'',input:'',cart:[]}));
   window.location.assign('/');
  }catch{setError('Could not start a new conversation. Download your plan and retry.');}
 }
 async function upload(file:File|undefined){if(!file)return;setError('');try{if(file.size>500000)throw new Error('Maximum upload size is 500 KB.');setPending(importSession(await file.text()));setStartingNew(false);}catch{setError('Could not import this file. Choose a GoalFirst session JSON (version 1), under 500 KB.');}finally{if(input.current)input.current.value=''}}
 return <section className="transfer-panel"><div><strong>Save & continue later</strong><p>One file includes your discussion, both item lists, product choices and search preferences. Import it next time to continue.</p></div><div className="transfer-actions"><button className="primary" disabled={disabled} onClick={()=>download('goalfirst-plan.json',exportSession(session),'application/json')}>Download plan</button><button className="secondary" disabled={disabled} onClick={()=>input.current?.click()}>Upload & continue</button><button className="secondary" disabled={disabled} onClick={()=>{setStartingNew(true);setPending(null);setError('')}}>New conversation</button><input type="file" accept=".json,application/json" ref={input} hidden onChange={e=>void upload(e.target.files?.[0])}/></div>{startingNew&&<div className="import-preview" role="region" aria-label="Start a new conversation"><strong>Start a new conversation?</strong><p>This clears the current goal, conversation and shopping progress from this browser. Download the plan first if you want to continue it later.</p><div className="transfer-actions"><button className="primary" disabled={disabled} onClick={()=>startNew(true)}>Download & start new</button><button className="secondary" disabled={disabled} onClick={()=>startNew(false)}>Start without saving</button><button className="text-button" onClick={()=>setStartingNew(false)}>Cancel</button></div></div>}{error&&<p className="error" role="alert">{error}</p>}{pending&&<div className="import-preview"><strong>Restore “{pending.plan?.title??'Saved session'}”?</strong><p>{pending.plan?.checklist.length??0} AI items · {pending.customItems?.length??0} personal additions · {pending.discussion?.length??0} messages. This replaces the current browser session. Saved weather may be out of date; refresh it after restoring.</p><button className="primary" disabled={disabled} onClick={()=>{onRestore(pending);setPending(null)}}>Restore this session</button><button className="secondary" onClick={()=>setPending(null)}>Cancel</button></div>}</section>
}
