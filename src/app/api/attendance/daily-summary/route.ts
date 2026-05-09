import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function GET(req: Request) {
  // Protect this endpoint with a secret in production
  // const authHeader = req.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new NextResponse('Unauthorized', { status: 401 });
  // }

  try {
    const today = new Date().toISOString().split("T")[0];
    
    // Query for unverified check-ins today
    const q = query(
      collection(db, "attendance"),
      where("date", "==", today),
      where("verified", "==", false)
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.size > 0) {
      // In a real app, integrate SendGrid, Postmark, or FCM here
      console.log(`[DAILY SUMMARY] There are ${snapshot.size} unverified check-ins for today (${today}). Action required.`);
      
      // Example email sending logic here:
      // await sendEmail({ to: "admin@company.com", subject: "Unverified Check-ins", body: ... });
    }

    return NextResponse.json({ success: true, unverifiedCount: snapshot.size });
  } catch (error: any) {
    console.error("Error generating daily summary:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
