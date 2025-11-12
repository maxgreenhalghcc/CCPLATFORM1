<<<<<<< HEAD
export { GET, POST } from '@/auth'
=======
import NextAuth from 'next-auth';
import { authOptions } from '@/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
>>>>>>> pr-22
