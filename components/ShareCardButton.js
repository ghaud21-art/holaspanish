'use client';
import { useState } from 'react';

let iconImgCache = null;
function loadIcon() {
  if (iconImgCache) return iconImgCache;
  iconImgCache = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = '/icon.png';
  });
  return iconImgCache;
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

const MAX_WORDS_ON_CARD = 14;

async function buildCanvas({ eyebrow, title, subtitle, stats, quote, wordList }) {
  const W = 1080;
  const MAX_H = 2200;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = MAX_H;
  const ctx = canvas.getContext('2d');

  // 배경
  ctx.fillStyle = '#f3f2f2';
  ctx.fillRect(0, 0, W, MAX_H);
  ctx.fillStyle = '#ec3013';
  ctx.fillRect(0, 0, W, 220);

  // 아이콘 + 브랜드 (아이콘 배경이 투명 처리되어 있어 그대로 그리면 헤더 색이 자연스럽게 비쳐요)
  const icon = await loadIcon();
  if (icon) ctx.drawImage(icon, 56, 46, 128, 128);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 56px Archivo, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText('Hola.', icon ? 204 : 56, 110);
  ctx.font = '600 26px Archivo, sans-serif';
  ctx.fillText('스페인어 학습 기록', icon ? 204 : 56, 158);

  let y = 300;
  ctx.fillStyle = '#ec3013';
  ctx.font = '700 26px Archivo, sans-serif';
  ctx.textBaseline = 'alphabetic';
  if (eyebrow) {
    ctx.fillText(eyebrow.toUpperCase(), 56, y);
    y += 56;
  }

  ctx.fillStyle = '#201e1d';
  ctx.font = '800 58px Archivo, sans-serif';
  const titleLines = wrapText(ctx, title || '', W - 112);
  for (const line of titleLines) {
    ctx.fillText(line, 56, y);
    y += 68;
  }

  if (subtitle) {
    ctx.font = '600 34px Archivo, sans-serif';
    ctx.fillStyle = 'rgba(32,30,29,0.75)';
    const subLines = wrapText(ctx, subtitle, W - 112);
    for (const line of subLines) {
      ctx.fillText(line, 56, y + 14);
      y += 46;
    }
  }

  y += 40;

  if (stats && stats.length) {
    const boxW = (W - 112 - 24 * (stats.length - 1)) / stats.length;
    stats.forEach((s, i) => {
      const x = 56 + i * (boxW + 24);
      ctx.fillStyle = '#eae9e9';
      ctx.fillRect(x, y, boxW, 170);
      ctx.fillStyle = '#ec3013';
      ctx.font = '700 20px Archivo, sans-serif';
      ctx.fillText(s.label, x + 20, y + 46);
      ctx.fillStyle = '#201e1d';
      ctx.font = '800 46px Archivo, sans-serif';
      ctx.fillText(String(s.value), x + 20, y + 118);
    });
    y += 170 + 56;
  }

  if (wordList && wordList.length) {
    ctx.strokeStyle = '#201e1d';
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.moveTo(56, y);
    ctx.lineTo(W - 56, y);
    ctx.stroke();
    ctx.globalAlpha = 1;
    y += 50;

    ctx.fillStyle = '#ec3013';
    ctx.font = '700 26px Archivo, sans-serif';
    ctx.fillText(`오늘 배운 단어 ${wordList.length}개`, 56, y);
    y += 44;

    const shown = wordList.slice(0, MAX_WORDS_ON_CARD);
    const colW = (W - 112 - 24) / 2;
    const rowH = 84;
    shown.forEach((w, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 56 + col * (colW + 24);
      const rowY = y + row * (rowH + 14);
      ctx.fillStyle = '#eae9e9';
      ctx.fillRect(x, rowY, colW, rowH);
      ctx.fillStyle = '#201e1d';
      ctx.font = '800 30px Archivo, sans-serif';
      ctx.fillText(w.es, x + 22, rowY + 36);
      ctx.fillStyle = '#7d7979';
      ctx.font = '500 24px Archivo, sans-serif';
      const krLine = wrapText(ctx, w.kr, colW - 44)[0] || w.kr;
      ctx.fillText(krLine, x + 22, rowY + 68);
    });
    const rows = Math.ceil(shown.length / 2);
    y += rows * (rowH + 14);

    if (wordList.length > MAX_WORDS_ON_CARD) {
      ctx.fillStyle = 'rgba(32,30,29,0.55)';
      ctx.font = '600 24px Archivo, sans-serif';
      ctx.fillText(`+${wordList.length - MAX_WORDS_ON_CARD}개 더 학습했어요`, 56, y + 16);
      y += 40;
    }
    y += 20;
  } else if (quote) {
    ctx.strokeStyle = '#201e1d';
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.moveTo(56, y);
    ctx.lineTo(W - 56, y);
    ctx.stroke();
    ctx.globalAlpha = 1;
    y += 60;
    ctx.fillStyle = '#201e1d';
    ctx.font = 'italic 600 32px Archivo, sans-serif';
    const qLines = wrapText(ctx, `"${quote.es}"`, W - 112);
    for (const line of qLines) {
      ctx.fillText(line, 56, y);
      y += 44;
    }
    if (quote.kr) {
      ctx.font = '400 28px Archivo, sans-serif';
      ctx.fillStyle = 'rgba(32,30,29,0.7)';
      ctx.fillText(quote.kr, 56, y + 8);
      y += 36;
    }
  }

  const finalH = Math.min(MAX_H, y + 90);
  ctx.fillStyle = 'rgba(32,30,29,0.45)';
  ctx.font = '600 22px Archivo, sans-serif';
  ctx.fillText(new Date().toLocaleDateString('ko-KR'), 56, finalH - 40);

  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = W;
  finalCanvas.height = finalH;
  finalCanvas.getContext('2d').drawImage(canvas, 0, 0, W, finalH, 0, 0, W, finalH);
  return finalCanvas;
}

export default function ShareCardButton({ eyebrow, title, subtitle, stats, quote, wordList, label, filename, className }) {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    try {
      const canvas = await buildCanvas({ eyebrow, title, subtitle, stats, quote, wordList });
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('이미지를 만들지 못했어요.');

      // 공유 시트로 바로 넘기지 않고, 갤러리/다운로드 폴더에 이미지로 저장만 해요.
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename || 'hola-study-card'}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (err) {
      alert('이미지를 저장하지 못했어요: ' + err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button type="button" className={className || 'btn btn-secondary'} onClick={handleClick} disabled={busy}>
      {busy ? '카드 만드는 중…' : label || '이미지로 저장'}
    </button>
  );
}
