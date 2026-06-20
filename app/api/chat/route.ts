import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseSearch, rankProperties } from "@/lib/matching";
import type { Property } from "@/lib/types";

export async function POST(request:Request){
  try {
    const {message}=await request.json();
    if(typeof message!=="string"||message.trim().length<2)return NextResponse.json({error:"Please describe what you are looking for."},{status:400});
    const supabase=await createClient();
    const {data,error}=await supabase.from("properties").select("*").eq("availability","available");
    if(error)throw error;
    const intent=parseSearch(message);
    const matches=rankProperties((data??[]) as Property[],intent);
    const reply=matches.length?`I found ${matches.length} ${matches.length===1?"listing":"listings"} that ${matches.length===1?"looks":"look"} promising. ${Object.keys(intent).filter(k=>k!=="features"&&intent[k as keyof typeof intent]!==undefined).length===0&&intent.features.length===0?"For sharper matches, tell me your budget, area, bedrooms, or property type.":"I ranked them by the details you shared."}`:"I couldn't find a close match among the available listings. Try widening the area or budget, or leave your details and an agent can help.";
    return NextResponse.json({reply,intent,matches:matches.map(m=>({...m.property,matchReasons:m.reasons}))});
  } catch { return NextResponse.json({error:"I couldn't search the listings just now. Please try again."},{status:500}); }
}
