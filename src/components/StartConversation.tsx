'use client';
import { ArrowUp } from 'lucide-react';
export default function StartConversation({value,onChange,onSend,busy}:{value:string;onChange:(s:string)=>void;onSend:()=>void;busy:boolean}){
 return <section className="blank-conversation" aria-label="New conversation"><form className="blank-chat-composer" onSubmit={e=>{e.preventDefault();if(value.trim().length>=1)onSend()}}><label className="sr-only" htmlFor="new-goal">Message GoalFirst</label><textarea id="new-goal" autoFocus value={value} onChange={e=>onChange(e.target.value)} maxLength={2000} placeholder="Message GoalFirst…" disabled={busy} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();if(value.trim().length>=1)onSend()}}}/><button type="submit" className="primary" aria-label="Send message" disabled={busy||value.trim().length<1}><ArrowUp size={20}/></button></form></section>
}
