import BookingPage from './booking-page';
export default async function Page({params}:{params:Promise<{id:string}>}) { const {id}=await params; return <BookingPage id={id}/>; }
