import {db,ownCalendar,unpack,json,sameOrigin,failure} from '@/lib/server';
import {availableSlots,validDay,inFuture,todayKey,parseDay} from '@/lib/schedule';
import {notificationStatements,sendPending} from '@/lib/notifications';
export async function POST(req:Request) {
 try { if(!sameOrigin(req))return json({error:'Origem invÃ¡lida.'},403); if(Number(req.headers.get('content-length'))>10000)return json({error:'Dados muito longos.'},400);
 const b=await req.json() as any; const owner=await ownCalendar();
 const raw=await db().prepare('SELECT * FROM calendars WHERE id=?').bind(typeof b.calendar==='string'?b.calendar:'').first(); if(!raw)return json({error:'Agenda nÃ£o encontrada.'},404);
 const c=unpack(raw);const isOwner=owner?.id===c.id;const block=b.kind==='block';
 if(block&&!isOwner)return json({error:'Acesso restrito.'},403);
 if(!validDay(b.date)||!Number.isInteger(b.start)||b.start<0||b.start>=1440||b.start%15||!inFuture(b.date,b.start)||parseDay(b.date).getTime()-parseDay(todayKey()).getTime()>90*86400000)return json({error:'Escolha uma data futura nos prÃ³ximos 90 dias.'},400);
 const end=block?b.end:b.start+c.duration;
 if(!Number.isInteger(end)||end<=b.start||end>1440||end%15)return json({error:'HorÃ¡rio final invÃ¡lido.'},400);
 if(!block&&(typeof b.name!=='string'||!b.name.trim()||b.name.length>100||typeof b.email!=='string'||!/^\S+@\S+\.\S+$/.test(b.email)||b.email.length>160||typeof b.phone!=='string'||b.phone.length>30))return json({error:'Informe nome e e-mail vÃ¡lidos.'},400);
 if(!block){
 const email=b.email.trim().toLowerCase();
 if(!/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email))return json({error:'Informe um e-mail válido, como nome@dominio.com.'},400);
 const phone=b.phone.replace(/[\s().-]/g,'');
 const normalized=phone.startsWith('+')?phone:(/^[1-9][0-9]9[0-9]{8}$/.test(phone)?'+55'+phone:(/^55[1-9][0-9]9[0-9]{8}$/.test(phone)?'+'+phone:''));
 if(!/^\+[1-9][0-9]{7,14}$/.test(normalized)|| (normalized.startsWith('+55')&&!/^\+55[1-9][0-9]9[0-9]{8}$/.test(normalized)))return json({error:'Informe seu WhatsApp com DDD (11 dígitos) ou +código do país.'},400);
 b.email=email;b.phone=normalized;
 }
 if(!block) {const busy=await db().prepare('SELECT start,end FROM bookings WHERE calendar=? AND date=?').bind(c.id,b.date).all();if(!availableSlots(c,b.date,busy.results as any).includes(b.start))return json({error:'Este horÃ¡rio nÃ£o estÃ¡ mais disponÃ­vel. Escolha outro.'},409);}
 const id=crypto.randomUUID(); const statements=[db().prepare('INSERT INTO bookings (id,calendar,date,start,end,name,email,phone,kind,created) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(id,c.id,b.date,b.start,end,block?'HorÃ¡rio bloqueado':b.name.trim(),block?'':b.email.trim(),block?'':b.phone.trim(),block?'block':'booking',Date.now())];
 for(let m=b.start;m<end;m+=15) statements.push(db().prepare('INSERT INTO slot_locks (calendar,date,minute,booking) VALUES (?,?,?,?)').bind(c.id,b.date,m,id));
 if(!block)statements.push(...notificationStatements(c,b,id,end));
 try {await db().batch(statements);}catch(e){if(String(e).includes('UNIQUE'))return json({error:'Este horÃ¡rio acabou de ser ocupado. Escolha outro.'},409);throw e;}
 const notification=block?null:await sendPending(c.id,id);
 return json({id,date:b.date,start:b.start,end,service:c.service,location:c.location,notification},201);
 }catch(e){return failure(e);}
}
export async function DELETE(req:Request) {try{if(!sameOrigin(req))return json({error:'Origem invÃ¡lida.'},403);const c=await ownCalendar();if(!c)return json({error:'Acesso restrito.'},401);const {id}=await req.json() as any;await db().batch([db().prepare("DELETE FROM email_outbox WHERE calendar=? AND id LIKE ? AND status='pending'").bind(c.id,`${id}:%`),db().prepare('DELETE FROM slot_locks WHERE booking IN (SELECT id FROM bookings WHERE id=? AND calendar=?)').bind(id,c.id),db().prepare('DELETE FROM bookings WHERE id=? AND calendar=?').bind(id,c.id)]);return json({ok:true});}catch(e){return failure(e);}}
