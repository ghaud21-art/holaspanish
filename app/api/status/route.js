import { NextResponse } from 'next/server';
import { backendMode } from '../../../lib/db';

export async function GET() {
  return NextResponse.json({ mode: backendMode() });
}
