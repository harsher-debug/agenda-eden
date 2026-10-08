import {cookies} from 'next/headers';
import {db,json,sameOrigin,failure} from '@/lib/server';
import {emailAuthReady,supabase,validEmail,hashToken,sessionCookie,rateLimit,emailUser} from '@/lib/email-auth';
import {getChatGPTUser} from '@/app/chatgpt-auth';
export async function GET(){const user=await emailUser()||await getChatGPTUser();return json({emailLoginReady:emailAuthReady(),user:user?{email:user.email}:null})}
export async function POST(req:Request){
 try{if(!sameOrigin(req)||!req.headers.get('origin'))return json({error:'Origem inválida.'},403);
 if(Number(req.headers.get('content-length'))>2048)return json({error:'Dados inválidos.'},400);
 const body=await req.json() as any;if(!validEmail(body.email))return json({error:'Informe um e-mail válido.'},400);
 if(!emailAuthReady())return json({error:'O login por e-mail ainda está sendo configurado.'},503);
 const email=body.email.trim().toLowerCase();const ip=req.headers.get('cf-connecting-ip')||'local';
 const key=await hashToken(`${body.code?'verify':'send'}:${ip}:${email}`);
 const ipKey=await hashToken(`ip:${ip}`);
 if(!await rateLimit(ipKey,30,15*60000)||!await rateLimit(key,body.code?10:3,body.code?15*60000:10*60000))return json({error:'Muitas tentativas. Aguarde alguns minutos e tente novamente.'},429);
 if(!body.code){const {error}=await supabase().auth.signInWithOtp({email});if(error)return json({error:'Não foi possível enviar o código. Aguarde um minuto e tente novamente.'},400);return json({ok:true})}
 if(typeof body.code!=='string'||!/^[0-9]{8}$/.test(body.code))return json({error:'Informe o codigo de 8 digitos.'},400);
 const {data,error}=await supabase().auth.verifyOtp({email,token:body.code,type:'email'});
 if(error||!data.user?.email_confirmed_at||!data.user.email)return json({error:'Código inválido ou expirado. Solicite outro código.'},400);
 const verifiedEmail=data.user.email.toLowerCase();const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
 // The one-time code is verified by Supabase. Provider tokens never enter the browser.
 await db().prepare('INSERT INTO email_sessions (hash,user_id,email,expires) VALUES (?,?,?,?)').bind(await hashToken(token),data.user.id,verifiedEmail,Date.now()+7*86400000).run();
 await db().prepare('DELETE FROM email_sessions WHERE expires<=?').bind(Date.now()).run();
 const jar=await cookies();const old=jar.get(sessionCookie)?.value;if(old)await db().prepare('DELETE FROM email_sessions WHERE hash=?').bind(await hashToken(old)).run();
 jar.set(sessionCookie,token,{httpOnly:true,secure:new URL(req.url).protocol==='https:',sameSite:'lax',path:'/',maxAge:7*86400});return json({ok:true});
 }catch(e){return failure(e)}
}
export async function DELETE(req:Request){try{if(!sameOrigin(req)||!req.headers.get('origin'))return json({error:'Origem inválida.'},403);const jar=await cookies();const token=jar.get(sessionCookie)?.value;if(token)await db().prepare('DELETE FROM email_sessions WHERE hash=?').bind(await hashToken(token)).run();jar.delete(sessionCookie);return json({ok:true})}catch(e){return failure(e)}}



