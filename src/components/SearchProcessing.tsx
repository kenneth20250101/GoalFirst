'use client';
import { useEffect,useRef } from 'react';
export default function SearchProcessing(){
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const previous=document.body.style.overflow;document.body.style.overflow='hidden';dialog.current?.showModal();return()=>{document.body.style.overflow=previous;dialog.current?.close();}},[]);
 return <dialog ref={dialog} className="search-processing-mask" aria-label="Processing product search" onCancel={e=>e.preventDefault()}><div role="status" aria-live="polite"><span className="processing-spinner" aria-hidden="true"/><h2>Processing…</h2><p>Finding product options for your needs.</p></div></dialog>;
}
