'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUp, ArrowLeft, Sparkles, LoaderCircle, X } from 'lucide-react';
import { interviewSchema, type Interview, type Answer } from '@/lib/interview';
import { type Trip, type Location } from '@/lib/travel';
type Message={role:'user'|'assistant';text:string};
export default function DynamicInterview({goal,trip,onComplete,onCancel,knownItems,building=false,history,onMessagesChange}:{history?:Message[];onMessagesChange?:(messages:Message[])=>void;building?:boolean;goal:string;trip:Trip;knownItems?:{name:string;status:string}[];onComplete:(trip:Trip,purpose:string|null)=>void;onCancel:()=>void}){
 const [interview,setInterview]=useState<Interview|null>(null);
 const [mode,setMode]=useState('live');const [answers,setAnswers]=useState<Answer[]>([]);
 const [messages,setMessages]=useState<Message[]>(history?.[0]?.text===goal?history:[{role:'user',text:goal}]);
 const [reply,setReply]=useState('');const [selectedOptions,setSelectedOptions]=useState<string[]>([]);const [questionDismissed,setQuestionDismissed]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 const [location,setLocation]=useState<Location|null>(trip.location);
 const completedInterview=useRef<Interview|null>(null);
 const travelGoal=/trip|travel|holiday|vacation|旅行|旅遊|出國|度假/i.test(goal);
 const lastGoal=useRef('');const requestId=useRef(0);const end=useRef<HTMLDivElement>(null);const input=useRef<HTMLTextAreaElement>(null);
 async function ask(history:Answer[]){
  const id=++requestId.current;setBusy(true);setError('');
  try{
   const res=await fetch('/api/questions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({goalText:goal,answers:history,knownItems,notes:trip.notes})});
   const data=await res.json();if(!res.ok)throw new Error(data.error);if(id!==requestId.current)return;
   const result=interviewSchema.parse(data.interview);setInterview(result);setMode(data.mode);setQuestionDismissed(false);setSelectedOptions([]);
   const text=result.ready?result.summary:(result.questions[0]?.prompt??result.summary);
   setMessages(m=>[...m,{role:'assistant',text}]);
   if(result.ready&&travelGoal&&result.context.city){
    const query=[result.context.city,result.context.country].filter(Boolean).join(', ');
    try{const geo=await fetch(`/api/locations?q=${encodeURIComponent(query)}`);if(id!==requestId.current)return;if(geo.ok){const candidates=await geo.json();const options:Location[]=candidates.locations;setLocation(previous=>options.find(l=>l.id===previous?.id)??(options.length===1?options[0]:null));}}catch{/* Weather is optional; keep the conversation available. */}
   }
  }catch(e){if(id===requestId.current)setError(e instanceof Error?e.message:'Could not reply. Please retry.');}
  finally{if(id===requestId.current)setBusy(false);}
 }
 useEffect(()=>{if(lastGoal.current===goal)return;lastGoal.current=goal;const saved=history?.[0]?.text===goal?history:[];const restoredAnswers:Answer[]=[];let previous='';for(const message of saved){if(message.role==='assistant')previous=message.text;else if(previous)restoredAnswers.push({question:previous.slice(0,250),answer:message.text.slice(0,1000)})}setAnswers(restoredAnswers.slice(-18));setMessages(saved.length?saved:[{role:'user',text:goal}]);setLocation(trip.location);completedInterview.current=null;void ask(restoredAnswers.slice(-18))},[goal]);
 useEffect(()=>{onMessagesChange?.(messages)},[messages]);
 useEffect(()=>{end.current?.scrollIntoView({behavior:'smooth',block:'nearest'});if(!busy)input.current?.focus()},[messages,busy]);
 function send(value=[...selectedOptions,reply.trim()].filter(Boolean).join('; ')){const text=value.trim();if(!text||busy||building)return;const question=interview?.ready?('Proposed scope: '+interview.summary).slice(0,250):interview?.questions[0]?.prompt??'Additional context';const next=[...answers,{question,answer:text}].slice(-18);setAnswers(next);setMessages(m=>[...m,{role:'user',text}]);setReply('');setSelectedOptions([]);void ask(next);}
 function complete(){const c=interview?.context;const history=answers.map(a=>`${a.question}: ${a.answer}`).join('\n');onComplete({...trip,location,startDate:c?.startDate??trip.startDate,days:c?.days??trip.days,activities:c?.activities??trip.activities,coldSensitive:c?.coldSensitive??trip.coldSensitive,notes:[trip.notes,history,interview?.ready?`Goal context: ${interview.summary}`:'Draft requested with currently available context.'].filter(Boolean).join('\n').slice(-2000)},c?.purpose??null)}
 useEffect(()=>{
  if(busy||building||!interview?.ready||completedInterview.current===interview)return;
  completedInterview.current=interview;
  complete();
 },[interview,busy,building,location]);
 return <section className="goal-conversation" aria-label="Goal conversation">
  <div className="conversation-top"><button type="button" onClick={onCancel} disabled={building} className="text-button"><ArrowLeft size={16}/>Back</button><span><Sparkles size={14}/>{mode==='live'?'GoalFirst assistant':'Sample conversation · AI unavailable'}</span></div>
  <div className="conversation-messages" aria-live="polite" aria-relevant="additions text">
   {messages.map((message,i)=>{const isQuestion=i===messages.length-1&&message.role==='assistant'&&!busy&&!building&&interview&&!interview.ready&&!questionDismissed;return isQuestion?<section className="question-choice-card" key={i} aria-label="AI question"><div className="question-choice-top"><h3>{message.text}</h3><div><span>Follow-up {answers.length+1}</span><button type="button" aria-label="Use regular chat instead" onClick={()=>setQuestionDismissed(true)}><X size={17}/></button></div></div>{interview.questions[0]?.options.map((option,index)=><button type="button" className={`question-option-row ${selectedOptions.includes(option)?'selected':''}`} aria-pressed={selectedOptions.includes(option)} key={option} onClick={()=>setSelectedOptions(current=>current.includes(option)?current.filter(value=>value!==option):[...current,option])}><span>{selectedOptions.includes(option)?'✓':index+1}</span><span>{option}</span></button>)}<p className="micro">Select all that apply, then submit. You can add your own details below.</p><div className="question-other-row"><label className="sr-only" htmlFor="question-other">{interview.questions[0]?.options.length?'Something else':'Your answer'}</label><input id="question-other" value={reply} maxLength={1000} onChange={e=>setReply(e.target.value)} placeholder={interview.questions[0]?.options.length?'Something else…':'Type your answer…'} onKeyDown={e=>{if(e.key==='Enter'&&!e.nativeEvent.isComposing){e.preventDefault();send()}}}/>{(reply.trim()||selectedOptions.length>0)&&<button type="button" className="question-send" aria-label="Submit selected answers" onClick={()=>send()}><ArrowUp size={17}/></button>}<button type="button" className="question-skip" onClick={()=>send('Skip this detail / unknown')}>Skip</button></div><button type="button" className="primary" disabled={!selectedOptions.length&&!reply.trim()} onClick={()=>send()}>Submit selections{selectedOptions.length>0?` (${selectedOptions.length})`:''}</button></section>:<div className={`chat-message ${message.role}`} key={i}><span className="chat-speaker">{message.role==='user'?'You':'GoalFirst'}</span><div>{message.text}</div></div>})}
   {(busy||building)&&<div className="chat-message assistant"><span className="chat-speaker">GoalFirst</span><div className="thinking"><LoaderCircle size={16}/>{building?'Processing… Preparing your checklist':'Thinking about your goal…'}</div></div>}
   {error&&<div className="error" role="alert">{error}<button type="button" onClick={()=>ask(answers)}>Retry</button></div>}
   <div ref={end}/>
  </div>
  {(!interview||interview.ready||questionDismissed||busy||building)&&<div className="chat-composer"><label className="sr-only" htmlFor="conversation-reply">Message GoalFirst</label><textarea ref={input} id="conversation-reply" maxLength={1000} value={reply} onChange={e=>setReply(e.target.value)} placeholder={interview?.ready?'Tell me what to change…':'Reply in your own words…'} disabled={busy||building} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();send()}}}/><button type="button" className="primary" aria-label="Send message" disabled={busy||building||!reply.trim()} onClick={()=>send()}><ArrowUp size={20}/></button></div>}
  <div className="conversation-bottom"><span>Purpose first. Buy only what you need.</span><button type="button" className="text-button" disabled={busy||building} onClick={complete}>Skip discussion & make a draft</button></div>
 </section>;
}
