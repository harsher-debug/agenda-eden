import {env} from 'cloudflare:workers';
import {db} from './server';
import {timeLabel,parseDay} from './schedule';
export const notificationsReady=()=>!!(env.RESEND_API_KEY&&env.EMAIL_FROM);
export function notificationStatements(c:any,b:any,id:string,end:number){
 const when=`${parseDay(b.date).toLocaleDateString('pt-BR',{dateStyle:'full'})}, ${timeLabel(b.start)} às ${timeLabel(end)} (Brasília)`;
 const details=`Atendimento: ${c.service}\nData e horário: ${when}\nLocal: ${c.location}\n\nPara cancelar ou remarcar, entre em contato com o responsável pelo atendimento.`;
 const entries=[{to:b.email.trim(),subject:`Agendamento confirmado — ${c.name}`,body:`Olá, ${b.name.trim()}!\n\nSeu horário está confirmado.\n\n${details}`}];
 if(c.owner_email)entries.push({to:c.owner_email,subject:`Novo agendamento — ${b.name.trim()}`,body:`Você recebeu um novo agendamento.\n\nCliente: ${b.name.trim()}\nE-mail: ${b.email.trim()}\nTelefone: ${b.phone.trim()||'Não informado'}\n\n${details}`});
 return entries.map((mail,i)=>db().prepare('INSERT INTO email_outbox (id,calendar,recipient,subject,body,status,created) VALUES (?,?,?,?,?,?,?)').bind(`${id}:${i}`,c.id,mail.to,mail.subject,mail.body,'pending',Date.now()));
}
export async function sendPending(calendar:string,booking?:string){
 if(!notificationsReady())return {configured:false,sent:0,pending:true};
 const q=booking?db().prepare("SELECT * FROM email_outbox WHERE calendar=? AND status='pending' AND created>? AND id LIKE ? LIMIT 2").bind(calendar,Date.now()-23*3600000,`${booking}:%`):db().prepare("SELECT * FROM email_outbox WHERE calendar=? AND status='pending' AND created>? ORDER BY created LIMIT 10").bind(calendar,Date.now()-23*3600000);
 const rows=await q.all<any>();let sent=0;
 for(const mail of rows.results){try{const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`eden-${mail.id}`},body:JSON.stringify({from:env.EMAIL_FROM,to:[mail.recipient],subject:mail.subject,text:mail.body}),signal:AbortSignal.timeout(8000)});if(response.ok){await db().prepare("UPDATE email_outbox SET status='sent' WHERE id=?").bind(mail.id).run();sent++}}catch{console.error('Notification delivery unavailable')}}
 return {configured:true,sent,pending:sent<rows.results.length};
}
