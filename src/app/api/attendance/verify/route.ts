import { NextResponse } from 'next/server';
import { db, storage } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Validate inputs
    const { userId, location, photoUrl, method, distanceMeters, deviceId } = data;

    if (!userId || !location) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Here we can run an optional face-match service. 
    // For MVP, we will set verified to false, flagging it for manual review if it's auto or if it needs review.
    const isVerified = false; // Admin needs to verify the selfie

    // Add record to Firestore
    const docRef = await addDoc(collection(db, "attendance"), {
      userId,
      checkInTime: serverTimestamp(),
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
      status: "present",
      date: new Date().toISOString().split("T")[0],
      photoUrl: photoUrl || null,
      method: method || "manual",
      distanceMeters: distanceMeters || 0,
      deviceId: deviceId || "web-client",
      verified: isVerified,
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({ success: true, recordId: docRef.id, verified: isVerified });
  } catch (error: any) {
    console.error("Error in verification API:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
