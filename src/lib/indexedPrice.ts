import { z } from 'zod';
export const indexedPriceSchema=z.object({amountSGD:z.number().nonnegative().max(1000000).nullable(),lowSGD:z.number().nonnegative().max(1000000).nullable(),highSGD:z.number().nonnegative().max(1000000).nullable(),evidence:z.string().max(600),policy:z.literal('lowest_listed').optional(),basis:z.literal('indexed_page')});
export function extractIndexedPrice(text:string,url:string,title?:string){
 if(title){const lines=text.split(/\n/);const target=title.split(/[|–]/)[0].trim().toLowerCase().slice(0,28);const start=lines.findIndex(line=>/^#{1,3}\s/.test(line)&&line.toLowerCase().includes(target));if(start>=0){let end=lines.findIndex((line,index)=>index>start&&/^#{1,4}\s*(?:Related|Recommended|You may also|Customers also|Similar|Frequently bought)/i.test(line));if(end<0)end=lines.length;text=lines.slice(start,end).join('\n');}}

 const host=new URL(url).hostname;const local=host.endsWith('.sg')||/\/sg\//.test(new URL(url).pathname);const candidates:{amount:number;evidence:string}[]=[];
 for(const raw of text.split(/\n/)){const line=raw.trim();if(!line||line.includes('~~')||/\b(?:shipping|delivery|voucher|coupon|installment|per month|monthly|you save|save\s*[$S]|RRP|original price|regular price|list price|was\s*[$S])\b/i.test(line))continue;
  for(const match of line.matchAll(/(?<![A-Za-z])(S\$|SGD\s*\$?|\$)\s*(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)(?![\d.])/gi)){const before=line.slice(Math.max(0,match.index!-12),match.index);if(/(?:US|AU|HK|NZ|CA)\s*$/i.test(before))continue;if(match[1]==='$'&&!local)continue;const amount=Number(match[2].replaceAll(',',''));if(amount>=0&&amount<=1000000)candidates.push({amount,evidence:line.slice(0,250)});}
 }
 const unique=[...new Set(candidates.map(c=>c.amount))];const evidence=[...new Set(candidates.map(c=>c.evidence))].slice(0,3).join('\n').slice(0,600);
 return indexedPriceSchema.parse({amountSGD:unique.length?Math.min(...unique):null,lowSGD:unique.length?Math.min(...unique):null,highSGD:unique.length?Math.max(...unique):null,evidence:candidates.filter(c=>c.amount===Math.min(...unique)).map(c=>c.evidence).slice(0,2).join('\n').slice(0,600),policy:'lowest_listed',basis:'indexed_page'});
}
