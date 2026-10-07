export type Hours = {enabled:boolean; start:string; end:string}[];
export type CalendarData = {id:string; name:string; service:string; duration:number; hours:Hours; location:string; active:number};
export type Booking = {id:string; date:string; start:number; end:number; name:string; email:string; phone:string; kind:string};
export const weekdays = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
export const defaults:Hours = weekdays.map((_,i)=>({enabled:i>0&&i<6,start:'09:00',end:'18:00'}));
export const minutes = (time:string) => Number(time.slice(0,2))*60+Number(time.slice(3));
export const timeLabel = (value:number) => `${String(Math.floor(value/60)).padStart(2,'0')}:${String(value%60).padStart(2,'0')}`;
export const dateKey = (date:Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export function todayKey() { return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()); }
export const parseDay = (day:string) => new Date(`${day}T12:00:00`);
export function validDay(day:string) { return typeof day==='string' && /^\d{4}-\d{2}-\d{2}$/.test(day) && !isNaN(parseDay(day).getTime()) && dateKey(parseDay(day))===day; }
export function inFuture(day:string,start:number,now=Date.now()) { return new Date(`${day}T${timeLabel(start)}:00-03:00`).getTime()>now; }
export function availableSlots(c:CalendarData,day:string,busy:{start:number;end:number}[]) {
 const h=c.hours[parseDay(day).getDay()]; if(!h?.enabled||!c.active) return [];
 const slots:number[]=[];
 for(let start=minutes(h.start); start+c.duration<=minutes(h.end); start+=c.duration) {
  if(inFuture(day,start)&&!busy.some(b=>start<b.end&&start+c.duration>b.start)) slots.push(start);
 }
 return slots;
}
