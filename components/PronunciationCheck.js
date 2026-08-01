'use client';
import { useRef, useState } from 'react';
import { api } from '../lib/api';

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// 첨삭에서 나온 문장을 소리 내어 읽고, 정확한 단어로 말했는지 확인해보는 베타 기능이에요.
// 억양/발음의 미세한 정확도까지는 채점하지 않고, "말한 단어가 목표 문장과 맞는지"만 확인해요.
export default function PronunciationCheck({ targetText }) {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | checking | done
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioBlobRef = useRef(null);

  const startRecording = async () => {
    setError('');
    setResult(null);
    setStatus('idle');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
        audioBlobRef.current = blob;
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch {
      setError('마이크를 사용할 수 없어요. 브라우저의 마이크 권한을 확인해주세요.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const checkPronunciation = async () => {
    if (!audioBlobRef.current) return;
    setStatus('checking');
    setError('');
    try {
      const base64 = await blobToBase64(audioBlobRef.current);
      const res = await api.checkPronunciation({ targetText, audioBase64: base64, mimeType: audioBlobRef.current.type });
      setResult(res);
      setStatus('done');
    } catch (err) {
      setError(err.message);
      setStatus('idle');
    }
  };

  return (
    <div className="card elev-sm" style={{ gap: 10, marginTop: 12 }}>
      <div className="card-kicker">발음 연습 (베타)</div>
      <p className="card-body" style={{ opacity: 1, fontSize: 13, margin: 0 }}>
        아래 문장을 소리 내어 읽고 녹음해보세요. 억양보다는 &ldquo;정확한 단어로 말했는지&rdquo;를 확인해드려요.
      </p>
      <p className="card-title" style={{ fontWeight: 700, fontSize: 15 }}>{targetText}</p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {!recording ? (
          <button type="button" className="btn btn-secondary" onClick={startRecording}>녹음 시작</button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={stopRecording}>녹음 종료</button>
        )}
        {audioUrl && !recording && <audio controls src={audioUrl} style={{ height: 32 }} />}
        {audioUrl && !recording && (
          <button type="button" className="btn btn-primary" disabled={status === 'checking'} onClick={checkPronunciation}>
            {status === 'checking' ? '확인 중...' : '발음 확인하기'}
          </button>
        )}
      </div>

      {error && <p className="text-muted" style={{ fontSize: 12, color: 'var(--color-accent)', margin: 0 }}>{error}</p>}

      {status === 'done' && result && (
        <div className="card elev-sm" style={{ gap: 6 }}>
          <span className={result.matched ? 'tag tag-accent' : 'tag tag-neutral'} style={{ alignSelf: 'flex-start' }}>
            {result.matched ? '정확해요!' : '다시 확인해보세요'}
          </span>
          <p className="text-muted" style={{ fontSize: 12, margin: 0 }}>인식된 발화: &ldquo;{result.transcript}&rdquo;</p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, display: 'grid', gap: 4 }}>
            {result.feedback.map((f) => <li key={f}>{f}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
