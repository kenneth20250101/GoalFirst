'use client';
import { useEffect,useState } from 'react';
import BuyingWorkspace from '@/components/BuyingWorkspace';
import { sessionSchema,type Session } from '@/lib/schemas';
const KEY='goalfirst-session-v1';
export default function BuyingPage(){const [session,setSession]=useState<Session>({plan:null,mode:'sample',notice:'',input:'',cart:[]});const [ready,setReady]=useState(false);const [error,setError]=useState('');useEffect(()=>{try{const value=localStorage.getItem(KEY);if(value)setSession(sessionSchema.parse(JSON.parse(value)))}catch{setError('The saved plan could not be loaded. Return to your plan and try again.')}setReady(true)},[]);useEffect(()=>{if(ready)try{localStorage.setItem(KEY,JSON.stringify(session))}catch{setError('Could not save preparation progress in this browser.')}},[session,ready]);if(!ready)return <main className="buying-loading">Loading your purchase plan…</main>;return <main>{error&&<div className="error" role="alert">{error}</div>}<BuyingWorkspace session={session} onChange={setSession} onBack={()=>window.location.assign('/')}/></main>}
