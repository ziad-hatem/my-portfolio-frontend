import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, itemId, itemTitle, metadata, ipAddress, locationData } = body;

    if (!type || !itemId || !itemTitle) {
      return NextResponse.json(
        { error: 'Missing required fields: type, itemId, itemTitle' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const eventsCollection = db.collection('events');

    const event = {
      type,
      itemId,
      itemTitle,
      metadata: metadata || {},
      ipAddress: ipAddress || null,
      locationData: locationData || null,
      timestamp: new Date(),
      createdAt: new Date(),
    };

    const result = await eventsCollection.insertOne(event);
    const locationStr = locationData
      ? `from ${locationData.city}, ${locationData.country} (${ipAddress})`
      : ipAddress
        ? `from IP ${ipAddress}`
        : '';
    console.log(`📊 Tracked ${type} event for ${itemTitle} (${itemId}) ${locationStr}`);

    return NextResponse.json({
      success: true,
      eventId: result.insertedId,
      message: 'Event tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking analytics event:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to track event: ${errorMessage}` },
      { status: 500 }
    );
  }
}
