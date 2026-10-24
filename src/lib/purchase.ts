import { isTask } from './needs';
import { type Session } from './schemas';
import { defaultPurchaseSettings,type PurchaseDetail } from './purchaseTypes';
export function productChoices(session:Session){
 return session.productChoices??Object.entries(session.productSelections??{}).map(([itemId,url])=>{const source=session.sources?.find(s=>s.itemId===itemId&&s.url===url);const saved=session.purchaseDetails?.[itemId];return {id:itemId,itemId,detail:saved?.productUrl===url?saved:{productUrl:url,title:source?.title??'Selected product',quantity:1,unitPriceSGD:source?.indexedPrice?.amountSGD??null,priceBasis:source?.indexedPrice?'indexed' as const:'unknown' as const,priceUpdatedAt:source?.indexedPrice?source.retrievedAt:null}};});
}
export function selectedProductUrls(session:Session,itemId:string){return productChoices(session).filter(c=>c.itemId===itemId).map(c=>c.detail.productUrl);}
export function toggleProduct(session:Session,itemId:string,url:string):Session{
 const choices=productChoices(session);const existing=choices.find(c=>c.itemId===itemId&&c.detail.productUrl===url);
 if(existing)return {...session,productChoices:choices.filter(c=>c.id!==existing.id)};
 const selected=chooseProduct({...session,productChoices:undefined},itemId,url);
 return {...session,productChoices:[...choices,{id:crypto.randomUUID(),itemId,detail:selected.purchaseDetails![itemId]}]};
}
export function chooseProduct(session:Session,itemId:string,url:string):Session{
 const previous=session.purchaseDetails?.[itemId];const source=session.sources?.find(s=>s.itemId===itemId&&s.url===url);
 const detail:PurchaseDetail=previous?.productUrl===url?previous:{productUrl:url,title:source?.title??'Selected product',quantity:previous?.quantity??1,unitPriceSGD:source?.indexedPrice?.amountSGD??null,priceBasis:source?.indexedPrice?.amountSGD!=null?'indexed':'unknown',priceUpdatedAt:source?.indexedPrice?.amountSGD!=null?source.retrievedAt:null};
 return {...session,...(session.productChoices?{productChoices:[...session.productChoices.filter(c=>c.itemId!==itemId),{id:session.productChoices.find(c=>c.itemId===itemId)?.id??crypto.randomUUID(),itemId,detail}]}:{}),productSelections:{...session.productSelections,[itemId]:url},purchaseDetails:{...session.purchaseDetails,[itemId]:detail}};
}
export function purchaseSummary(session:Session){
 const items=[...(session.plan?.checklist??[]),...(session.customItems??[])];
 const lines=productChoices(session).map(({id:lineId,itemId,detail:saved})=>{const url=saved.productUrl;
  const detail=saved?.productUrl===url?saved:null;const source=session.sources?.find(s=>s.itemId===itemId&&s.url===url);const item=items.find(i=>i.id===itemId);const quantity=detail?.quantity??1;const useSource=detail?.unitPriceSGD==null&&detail?.priceBasis===undefined;const price=detail&&!useSource?detail.unitPriceSGD:source?.indexedPrice?.amountSGD??null;const priceBasis=detail?.priceBasis??(useSource&&source?.indexedPrice?.amountSGD!=null?'indexed':detail?'user':'unknown');
  return {lineId,itemId,url,title:detail?.title??source?.title??'Selected product',itemName:item?.name??'Item no longer in checklist',quantity,unitPriceSGD:price,priceBasis,priceUpdatedAt:detail?.priceUpdatedAt??null,lineCents:price===null?null:Math.round(price*100)*quantity,mismatch:!item||isTask(item)||item.status!=='to_buy'};
 });
 const settings=session.purchaseSettings??defaultPurchaseSettings;
 const subtotalCents=lines.reduce((sum,line)=>sum+(line.lineCents??0),0);const unknownPriceCount=lines.filter(line=>line.lineCents===null).length;const unpricedQuantity=lines.filter(line=>line.lineCents===null).reduce((sum,line)=>sum+line.quantity,0);
 const deliveryCents=settings.deliverySGD===null?null:Math.round(settings.deliverySGD*100);const otherFeesCents=settings.otherFeesSGD===null?null:Math.round(settings.otherFeesSGD*100);
 const knownTotalCents=subtotalCents+(deliveryCents??0)+(otherFeesCents??0);const complete=unknownPriceCount===0&&deliveryCents!==null&&otherFeesCents!==null;
 const budgetCents=settings.budgetSGD===null?null:Math.round(settings.budgetSGD*100);
 return {lines,settings,subtotalCents,knownTotalCents,unknownPriceCount,unpricedQuantity,complete,budgetRemainingCents:budgetCents===null?null:budgetCents-knownTotalCents,quantity:lines.reduce((sum,line)=>sum+line.quantity,0)};
}
