import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'
import EmailProvider from 'next-auth/providers/email'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions: NextAuthOptions = {
  // Use adapter only when email provider is available
  ...(process.env.EMAIL_SERVER_HOST ? { adapter: PrismaAdapter(prisma) } : {}),
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development',
  providers: [
    ...(process.env.EMAIL_SERVER_HOST ? [
      EmailProvider({
        server: {
          host: process.env.EMAIL_SERVER_HOST,
          port: process.env.EMAIL_SERVER_PORT ? parseInt(process.env.EMAIL_SERVER_PORT) : undefined,
          auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD,
          },
        },
        from: process.env.EMAIL_FROM,
      })
    ] : []),
    // Fallback credentials provider for development
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        name: { label: 'Name', type: 'text' }
      },
      async authorize(credentials) {
        try {
          console.log('Authorize attempt:', { email: credentials?.email })

          if (!credentials?.email) {
            console.log('No email provided')
            return null
          }

          try {
            // Try to find or create user in database
            let user = await prisma.user.findUnique({
              where: { email: credentials.email }
            })

            console.log('Found user:', user ? 'yes' : 'no')

            if (!user) {
              console.log('Creating new user')
              user = await prisma.user.create({
                data: {
                  email: credentials.email,
                  name: credentials.name || credentials.email.split('@')[0]
                }
              })
              console.log('Created user:', user.id)
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name,
            }
          } catch (dbError) {
            // If database is not set up, create a temporary user for JWT-only auth
            console.log('Database error, using temporary auth:', dbError)

            return {
              id: `temp_${credentials.email}`,
              email: credentials.email,
              name: credentials.name || credentials.email.split('@')[0],
            }
          }
        } catch (error) {
          console.error('Authorization error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user && token?.sub) {
        (session.user as any).id = token.sub
      }
      return session
    },
    jwt: async ({ user, token }) => {
      if (user) {
        token.uid = user.id
      }
      return token
    },
  },
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request',
  },
}