import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'


export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // AUTHENTICATION DISABLED - Always return mock admin user
        return {
          id: 'mock-user-id',
          email: 'admin@eira.com',
          name: 'Admin User',
          role: 'ADMIN',
        }
        
        // Original authentication code (disabled):
        // if (!credentials?.email || !credentials?.password) {
        //   return null
        // }
        // const user = await prisma.user.findUnique({
        //   where: { email: credentials.email },
        //   select: { id: true, email: true, name: true, password: true, role: true },
        // })
        // if (!user || !user?.password) {
        //   return null
        // }
        // const isPasswordValid = await bcrypt.compare(
        //   credentials.password,
        //   user.password
        // )
        // if (!isPasswordValid) {
        //   return null
        // }
        // return {
        //   id: user.id,
        //   email: user.email,
        //   name: user.name,
        //   role: user.role,
        // }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      // AUTHENTICATION DISABLED - Always return mock admin session
      if (!session?.user || !token.id) {
        return {
          user: {
            id: 'mock-user-id',
            email: 'admin@eira.com',
            name: 'Admin User',
            role: 'ADMIN',
          },
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        } as any
      }
      
      if (session?.user && token.id) {
        session.user.id = token.id as string
        session.user.role = (token.role as string) || 'ADMIN'
      }
      return session
    },
  },
}
