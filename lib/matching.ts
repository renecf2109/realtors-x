import type { Property } from "./types";

export type SearchIntent = { maxPrice?:number; minBeds?:number; minBaths?:number; type?:string; location?:string; features:string[] };

const propertyTypes = ["apartment","house","villa","townhouse","studio","office","land"];
const stopLocations = new Set(["a","an","the","my","our","under","below","around","near","in","at","for","with","and","or","to","from","bedroom","bedrooms","bed","bath","bathroom","bathrooms"]);

export function parseSearch(message:string):SearchIntent {
  const q=message.toLowerCase().replace(/,/g,"");
  const money=q.match(/(?:under|below|max(?:imum)?|budget(?: of)?|up to)\s*\$?([\d.]+)\s*(k|m)?/);
  const beds=q.match(/(\d+)\s*(?:bed|bedroom)/);
  const baths=q.match(/(\d+(?:\.\d+)?)\s*(?:bath|bathroom)/);
  const type=propertyTypes.find(t=>q.includes(t));
  const loc=q.match(/(?:in|near|around)\s+([a-z][a-z\s-]{1,30}?)(?:\s+(?:under|below|with|for|that|and|,)|$)/)?.[1]?.trim();
  const features=["parking","balcony","garden","pool","furnished","sea view","pet friendly","elevator","gym"].filter(f=>q.includes(f));
  let maxPrice:number|undefined;
  if(money){maxPrice=parseFloat(money[1])*(money[2]==="k"?1000:money[2]==="m"?1000000:1)}
  return {maxPrice,minBeds:beds?+beds[1]:undefined,minBaths:baths?+baths[1]:undefined,type,location:loc&&!stopLocations.has(loc)?loc:undefined,features};
}

export function rankProperties(properties:Property[], intent:SearchIntent){
  return properties.map(property=>{
    let score=0; const reasons:string[]=[];
    if(intent.maxPrice!==undefined){if(property.price<=intent.maxPrice){score+=4;reasons.push("within budget")}else score-=Math.min(6,(property.price-intent.maxPrice)/Math.max(intent.maxPrice,1)*10)}
    if(intent.minBeds!==undefined){if(property.bedrooms>=intent.minBeds){score+=3;reasons.push(`${property.bedrooms} bedrooms`)}else score-=5}
    if(intent.minBaths!==undefined){if(property.bathrooms>=intent.minBaths)score+=2;else score-=3}
    if(intent.type){if(property.type.toLowerCase()===intent.type){score+=4;reasons.push(`the right property type`)}else score-=2}
    if(intent.location){if(property.location.toLowerCase().includes(intent.location)){score+=5;reasons.push(`in ${property.location}`)}else score-=3}
    const haystack=`${property.description} ${property.features.join(" ")}`.toLowerCase();
    intent.features.forEach(f=>{if(haystack.includes(f)){score+=2;reasons.push(f)}});
    return {property,score,reasons};
  }).sort((a,b)=>b.score-a.score).filter(x=>x.score>=0).slice(0,4);
}
