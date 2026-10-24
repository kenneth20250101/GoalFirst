import { z } from 'zod';
export const locationSchema=z.object({id:z.number().int(),name:z.string().max(120),country:z.string().max(100),region:z.string().max(120),latitude:z.number().min(-90).max(90),longitude:z.number().min(-180).max(180)});
export const tripSchema=z.object({location:locationSchema.nullable(),startDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s=>Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s).or(z.literal('')),days:z.number().int().min(1).max(60),activities:z.enum(['Mixed','Mostly outdoors','Mostly indoors']),coldSensitive:z.boolean(),notes:z.string().max(2000)});
export type Trip=z.infer<typeof tripSchema>;
export type Location=z.infer<typeof locationSchema>;
export const emptyTrip:Trip={location:null,startDate:'',days:5,activities:'Mixed',coldSensitive:false,notes:''};
export const weatherSchema=z.object({location:locationSchema,startDate:z.string(),requestedDays:z.number().int().min(1).max(60),fetchedAt:z.string(),sourceUrl:z.string().url().refine(s=>{try{return new URL(s).origin==='https://api.open-meteo.com'}catch{return false}}),notice:z.string(),days:z.array(z.object({date:z.string(),min:z.number().nullable(),max:z.number().nullable(),rain:z.number().min(0).max(100).nullable()})).max(16)});
export type Weather=z.infer<typeof weatherSchema>;
export function weatherSuggestions(weather:Weather,coldSensitive=false){
 const rain=weather.days.flatMap(d=>d.rain===null?[]:[d.rain]);const lows=weather.days.flatMap(d=>d.min===null?[]:[d.min]);
 const result:{id:string;name:string;reason:string}[]=[];
 if(rain.length&&Math.max(...rain)>=40)result.push({id:'weather-rain',name:'Umbrella or rain jacket',reason:`Rain probability reaches ${Math.max(...rain)}% on the covered dates. Consider rain protection you already own.`});
 if(lows.length){const low=Math.min(...lows);if(low<=(coldSensitive?15:10))result.push({id:'weather-coat',name:'Warm outer layer / coat',reason:`Forecast lows reach ${low}°C. Consider a warm layer${coldSensitive?' given your preference for extra warmth':''}; thickness depends on wind, activities and your comfort.`});else if(low<=18)result.push({id:'weather-layer',name:'Light jacket or layers',reason:`Forecast lows reach ${low}°C. A removable layer may help during cooler hours.`});}
 return result;
}
export function dateAfter(date:string,days:number){const d=new Date(`${date}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)}
