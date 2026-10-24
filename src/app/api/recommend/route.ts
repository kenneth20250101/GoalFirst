import { isTask } from '@/lib/needs';
import { z } from 'zod';
import { planSchema } from '@/lib/schemas';
import { matchProducts } from '@/lib/catalog';
const schema=z.object({goal:planSchema,toBuyItemIds:z.array(z.string()).max(20),budget:z.number().nonnegative().optional()});
export async function POST(request:Request){
 try{const body=schema.parse(await request.json());return Response.json({recommendations:body.goal.checklist.filter(i=>i.status==='to_buy'&&!isTask(i)&&body.toBuyItemIds.includes(i.id)).map(i=>({itemId:i.id,productIds:matchProducts(i.productCategory,body.budget).map(p=>p.id),explanation:i.reason}))});}
 catch{return Response.json({error:'Invalid recommendation request.'},{status:400});}
}
