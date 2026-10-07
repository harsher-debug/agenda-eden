import {ownCalendar,db,json,sameOrigin,failure} from '@/lib/server';
import {minutes} from '@/lib/schedule';
export async function GET() { try { const c=await ownCalendar(true); if(!c)return json({error:'Entre para acessar sua agenda.'},401); const rows=await db().prepare('SELECT * FROM bookings WHERE calendar = ? ORDER BY date, start').bind(c.id).all(); const {owner,...calendar}=c; return json({calendar,bookings:rows.results}); }catch(e){return failure(e);} }
export async function PATCH(req:Request) {
 try { if(!sameOrigin(req))return json({error:'Origem inválida.'},403); const c=await ownCalendar(); if(!c)return json({error:'Acesso restrito.'},401);
 const b=await req.json() as any;
 if(typeof b.name!=='string'||!b.name.trim()||b.name.length>80||typeof b.service!=='string'||!b.service.trim()||b.service.length>80||typeof b.location!=='string'||b.location.length>160||![15,30,45,60,90,120].includes(b.duration)||![0,1].includes(b.active)||!Array.isArray(b.hours)||b.hours.length!==7||b.hours.some((h:any)=>typeof h.enabled!=='boolean'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(h.start)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(h.end)||minutes(h.start)%15||minutes(h.end)%15||minutes(h.start)>=minutes(h.end)))return json({error:'Confira os horários e os dados da agenda. Use intervalos de 15 minutos.'},400);
 await db().prepare('UPDATE calendars SET name=?,service=?,duration=?,hours=?,location=?,active=? WHERE id=?').bind(b.name.trim(),b.service.trim(),b.duration,JSON.stringify(b.hours),b.location.trim(),b.active,c.id).run(); return json({ok:true});
 }catch(e){return failure(e);}
}
