import GoogleProvider from 'next-auth/providers/google';

// 구글 이메일 계정으로 로그인하는 방식. 비밀번호를 우리가 직접 관리하지 않아서 안전하고,
// 스터디 그룹에 초대된 사람이 실제로 어떤 계정인지 확실히 알 수 있어요.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, profile }) {
      if (profile) {
        token.userId = profile.sub;
        token.email = profile.email;
        token.role = ADMIN_EMAILS.includes((profile.email || '').toLowerCase()) ? 'admin' : 'member';
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.userId;
      session.user.role = token.role || 'member';
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
};

export function isAdminEmail(email) {
  return ADMIN_EMAILS.includes((email || '').toLowerCase());
}
