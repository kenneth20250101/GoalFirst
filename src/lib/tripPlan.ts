import { type Plan } from './schemas';
import { type Trip,type Weather,weatherSuggestions } from './travel';
export function applyTripContext(plan:Plan,trip?:Trip,weather?:Weather|null):Plan{
 if(!trip?.location)return plan;
 const fresh=weather&&weather.location.id===trip.location.id&&weather.startDate===trip.startDate&&weather.requestedDays===trip.days&&Date.now()-Date.parse(weather.fetchedAt)<24*3600*1000;
 const suggestions=fresh?weatherSuggestions(weather,trip.coldSensitive):[];
 return {...plan,title:`Your trip to ${trip.location.name}`,destination:`${trip.location.name}, ${trip.location.country}`,durationDays:trip.days,assumptions:[...plan.assumptions.filter(a=>!a.startsWith('Sample Japan itinerary')).slice(0,5),`City and dates supplied by you: ${trip.location.name}, ${trip.startDate||'date not set'}; ${trip.activities}.`,fresh?`Weather source: Open-Meteo, retrieved ${weather.fetchedAt}. Only covered dates inform weather suggestions.`:'No fresh weather for these exact trip dates; check the forecast before packing.'].slice(0,8),checklist:[...plan.checklist.filter(i=>!i.id.startsWith('weather-')).slice(0,11),...suggestions.map(s=>({...s,category:'Weather & comfort',priority:'recommended' as const,status:'unreviewed' as const,productCategory:null}))]};
}
