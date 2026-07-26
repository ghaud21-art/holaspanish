import './globals.css';

export const metadata = {
  title: 'Hola. — 스페인어 공부 앱',
  description: '나만의 속도로 시작하는 스페인어 학습, 스터디 그룹과 함께.',
  icons: { icon: '/icon.png', apple: '/icon.png' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
