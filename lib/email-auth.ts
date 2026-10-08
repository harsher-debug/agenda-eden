import {createClient} from '@supabase/supabase-js';
import {env} from 'cloudflare:workers';
import {cookies} from 'next/headers';
import {db} from './server';
export const sessionCookie='eden_session';
export const emailAuthReady=()=>!!(env.SUPABASE_URL&&env.SUPABASE_ANON_KEY);
export function supabase(){if(!emailAuthReady())throw new Error('Login por e-mail ainda não configurado.');return createClient(env.SUPABASE_URL!,env.SUPABASE_ANON_KEY!,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:(url,init)=>fetch(url,{...init,signal:AbortSignal.timeout(10000)})}})}
export const validEmail=(email:unknown):email is string=>typeof email==='string'&&email.length<=160&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export async function hashToken(token:string){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));return Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,'0')).join('')}
export async function emailUser(){const token=(await cookies()).get(sessionCookie)?.value;if(!token||!/^[a-f0-9]{64}$/.test(token))return null;const hash=await hashToken(token);const row=await db().prepare('SELECT user_id,email FROM email_sessions WHERE hash=? AND expires>?').bind(hash,Date.now()).first<{user_id:string;email:string}>();return row?{userId:`supabase:${row.user_id}`,email:row.email}:null}
export async function rateLimit(key:string,max:number,windowMs:number){const now=Date.now();const row=await db().prepare('INSERT INTO auth_limits (key,count,until) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN until<=? THEN 1 ELSE count+1 END, until=CASE WHEN until<=? THEN ? ELSE until END RETURNING count').bind(key,now+windowMs,now,now,now+windowMs).first<{count:number}>();return !!row&&row.count<=max}
