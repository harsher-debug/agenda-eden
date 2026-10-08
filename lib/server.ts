import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {defaults} from './schedule';
import {emailUser} from './email-auth';
export function db() { if(!env.DB) throw new Error('Database unavailable'); return env.DB; }
export function unpack(row:any) { return {...row,hours:JSON.parse(row.hours)}; }
export async function ownCalendar(create=false) {
 const emailIdentity=await emailUser();const user=emailIdentity||await getChatGPTUser(); if(!user) return null;
 const email=user.email.toLowerCase();
 let row=emailIdentity?await db().prepare('SELECT * FROM calendars WHERE owner_email=?').bind(email).first():null;
 if(!row)row=await db().prepare('SELECT * FROM calendars WHERE owner = ?').bind(user.userId).first();
 if(row&&!emailIdentity){
  // Both identities have proved control of the same email. Prefer the legacy
  // calendar when linking, preserving its original booking URL and records.
  await db().batch([
   db().prepare('UPDATE calendars SET owner_email=NULL WHERE owner_email=? AND id<>?').bind(email,row.id),
   db().prepare('UPDATE calendars SET owner_email=? WHERE id=?').bind(email,row.id),
  ]);
  row={...row,owner_email:email};
 }
 if(!row&&emailIdentity)row=await db().prepare('SELECT * FROM calendars WHERE owner_email=?').bind(email).first();
 if(!row&&create) {
  await db().prepare('INSERT OR IGNORE INTO calendars (id,owner,owner_email,name,service,duration,hours,location,active) VALUES (?,?,?,?,?,?,?,?,1)').bind(crypto.randomUUID(),user.userId,email,'Agenda Éden','Atendimento',60,JSON.stringify(defaults),'A combinar').run();
  row=await db().prepare('SELECT * FROM calendars WHERE owner = ?').bind(user.userId).first();
  if(!row)row=await db().prepare('SELECT * FROM calendars WHERE owner_email=?').bind(email).first();
 }
 return row?unpack(row):null;
}
export const json = (data:unknown,status=200) => Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export function sameOrigin(req:Request) { const origin=req.headers.get('origin'); return !origin||origin===new URL(req.url).origin; }
export function failure(e:unknown) { console.error('Agenda request failed',e); return json({error:'Não foi possível acessar a agenda. Tente novamente.'},503); }
