import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import { getRows, appendRow } from '../../../lib/db';
import { generateVocabWithGemini, isGeminiConfigured } from '../../../lib/gemini';
import { nowIso } from '../../../lib/util';

export async function GET() {
  const rows = await getRows('GeneratedVocab');
  const words = rows
    .map((r) => ({ id: r.id, es: r.es, kr: r.kr, example: r.example || '', exampleKr: r.exampleKr || '', level: r.level || '', topic: r.topic || '' }))
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return NextResponse.json({ words });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  if (session.user.role !== 'admin') return NextResponse.json({ error: '관리자만 단어를 생성할 수 있어요.' }, { status: 403 });
  if (!isGeminiConfigured()) return NextResponse.json({ error: 'Gemini API가 설정되지 않았어요. GEMINI_API_KEY를 등록해주세요.' }, { status: 400 });

  const { levelLabel, topic, count } = await request.json();
  const safeCount = Math.max(1, Math.min(30, Number(count) || 10));

  let generated;
  try {
    generated = await generateVocabWithGemini({ levelLabel: levelLabel || '초급', topic, count: safeCount });
  } catch (err) {
    return NextResponse.json({ error: 'Gemini 호출에 실패했어요: ' + err.message }, { status: 502 });
  }

  const createdAt = nowIso();
  const saved = [];
  for (const w of generated) {
    if (!w.es || !w.kr) continue;
    const id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const row = { id, es: w.es, kr: w.kr, example: w.example || '', exampleKr: w.exampleKr || '', level: levelLabel || '', topic: topic || '', createdAt };
    await appendRow('GeneratedVocab', row);
    saved.push(row);
  }

  return NextResponse.json({ words: saved });
}
