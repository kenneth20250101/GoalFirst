import { z } from 'zod';
const sgd=z.number().finite().nonnegative().max(1000000).refine(n=>Math.abs(n*100-Math.round(n*100))<0.000001,'Use at most two decimal places');
export const purchaseDetailSchema=z.object({productUrl:z.string().url().refine(s=>s.startsWith('https://')),title:z.string().max(500),quantity:z.number().int().min(1).max(99),unitPriceSGD:sgd.nullable(),priceBasis:z.enum(['indexed','user','unknown']).optional(),priceUpdatedAt:z.string().nullable()});
export const purchaseSettingsSchema=z.object({budgetSGD:sgd.nullable(),deliverySGD:sgd.nullable(),otherFeesSGD:sgd.nullable()});
export type PurchaseDetail=z.infer<typeof purchaseDetailSchema>;
export type PurchaseSettings=z.infer<typeof purchaseSettingsSchema>;
export const defaultPurchaseSettings:PurchaseSettings={budgetSGD:null,deliverySGD:null,otherFeesSGD:null};
export function inputAmount(value:string){if(!value.trim())return null;const amount=Number(value);return Number.isFinite(amount)&&amount>=0?Math.round(Math.min(amount,1000000)*100)/100:null;}
