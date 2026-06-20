import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request:Request){
  try{
    const body=await request.json();
    const required=["name","phone","budget","preferred_area","requested_property_type"];
    if(required.some(k=>!body[k]))return NextResponse.json({error:"Please complete all required fields."},{status:400});
    const payload={name:String(body.name).trim(),phone:String(body.phone).trim(),budget:Number(body.budget),preferred_area:String(body.preferred_area).trim(),move_in_date:body.move_in_date||null,requested_property_type:String(body.requested_property_type).trim()};
    if(!Number.isFinite(payload.budget)||payload.budget<0)return NextResponse.json({error:"Please enter a valid budget."},{status:400});
    const {error}=await (await createClient()).from("leads").insert(payload);
    if(error)throw error;
    return NextResponse.json({ok:true});
  }catch{return NextResponse.json({error:"We couldn't save your details. Please try again."},{status:500})}
}
