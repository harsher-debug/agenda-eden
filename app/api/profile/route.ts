import {db,ownCalendar,json,sameOrigin,failure} from '@/lib/server';
export async function GET(){try{const c=await ownCalendar();if(!c)return json({error:'Acesso restrito.'},401);const p=await db().prepare('SELECT name,phone,city,bio,photo FROM profiles WHERE calendar=?').bind(c.id).first();return json({profile:p||{name:'',phone:'',city:'',bio:'',photo:''},email:c.owner_email||''});}catch(e){return failure(e)}}
export async function PUT(req:Request){try{
 if(!req.headers.get('origin')||!sameOrigin(req))return json({error:'Origem inválida.'},403);
 const c=await ownCalendar();if(!c)return json({error:'Acesso restrito.'},401);
 const text=await req.text();if(text.length>220000)return json({error:'A foto é muito grande.'},400);
 const p=JSON.parse(text);
 for(const [key,max] of Object.entries({name:80,phone:30,city:100,bio:500,photo:200000}))if(typeof p[key]!=='string'||p[key].length>max)return json({error:'Confira os campos do perfil.'},400);
 if(!p.name.trim())return json({error:'Informe seu nome.'},400);
 if(p.phone&&!/^\+?[0-9\s().-]{10,30}$/.test(p.phone))return json({error:'Confira o telefone com DDD.'},400);
 if(p.photo&&!/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/=]+$/.test(p.photo))return json({error:'Selecione uma foto válida.'},400);
 await db().prepare('INSERT INTO profiles(calendar,name,phone,city,bio,photo) VALUES(?,?,?,?,?,?) ON CONFLICT(calendar) DO UPDATE SET name=excluded.name,phone=excluded.phone,city=excluded.city,bio=excluded.bio,photo=excluded.photo').bind(c.id,p.name.trim(),p.phone.trim(),p.city.trim(),p.bio.trim(),p.photo).run();return json({ok:true});
}catch(e){return failure(e)}}
