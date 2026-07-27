'use client';
import { signIn } from 'next-auth/react';

export default function LoginScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card elev-lg" style={{ maxWidth: 380, width: '100%', padding: 40, textAlign: 'center', gap: 20 }}>
        <img src="/icon.png" alt="Hola." width={88} height={88} style={{ margin: '0 auto' }} />
        <div>
          <h1 style={{ marginBottom: 4 }}>Hola<span style={{ color: 'var(--color-accent)' }}>.</span></h1>
          <p className="text-muted" style={{ margin: 0 }}>구글 계정으로 로그인하면 내 학습 기록이 안전하게 저장돼요.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-block"
          style={{ justifyContent: 'center' }}
          onClick={() => signIn('google')}
        >
          구글 계정으로 로그인
        </button>
        <p className="text-muted" style={{ fontSize: 12, margin: 0 }}>
          로그인하면 스터디 그룹, 작문 게시판, 학습 기록이 계정에 연결돼요.
        </p>
      </div>
    </div>
  );
}
