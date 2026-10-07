import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {defaults} from './schedule';
export function db() { if(!env.DB) throw new Error('Database unavailable'); return env.DB; }
export function unpack(row:any) { return {...row,hours:JSON.parse(row.hours)}; }
export async function ownCalendar(create=false) {
 const user=await getChatGPTUser(); if(!user) return null;
 let row=await db().prepare('SELECT * FROM calendars WHERE owner = ?').bind(user.userId).first();
 if(!row&&create) {
  await db().prepare('INSERT OR IGNORE INTO calendars (id,owner,name,service,duration,hours,location,active) VALUES (?,?,?,?,?,?,?,1)').bind(crypto.randomUUID(),user.userId,'Agenda Éden','Atendimento',60,JSON.stringify(defaults),'A combinar').run();
  row=await db().prepare('SELECT * FROM calendars WHERE owner = ?').bind(user.userId).first();
 }
 return row?unpack(row):null;
}
export const json = (data:unknown,status=200) => Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export function sameOrigin(req:Request) { const origin=req.headers.get('origin'); return !origin||origin===new URL(req.url).origin; }
export function failure(e:unknown) { console.error('Agenda request failed',e); return json({error:'Não foi possível acessar a agenda. Tente novamente.'},503); }
