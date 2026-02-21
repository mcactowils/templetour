import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'
import EmailProvider from 'next-auth/providers/email'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

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
        password: { label: 'Password', type: 'password' },
        name: { label: 'Name', type: 'text' },
        isSignUp: { label: 'Is Sign Up', type: 'text' }
      },
      async authorize(credentials) {
        try {
          console.log('Authorize attempt:', { email: credentials?.email, hasPassword: !!credentials?.password })

          if (!credentials?.email || !credentials?.password) {
            console.log('Missing credentials:', { email: !!credentials?.email, password: !!credentials?.password })
            return null
          }

          try {
            const isSignUpMode = credentials.isSignUp === 'true'

            // Check if user exists
            let user = await prisma.user.findUnique({
              where: { email: credentials.email }
            })

            if (!user) {
              if (!isSignUpMode) {
                console.log('User not found for signin')
                return null
              }

              // Create new user with hashed password (signup mode)
              console.log('Creating new user with password')
              const hashedPassword = await bcrypt.hash(credentials.password, 12)

              user = await prisma.user.create({
                data: {
                  email: credentials.email,
                  password: hashedPassword,
                  name: credentials.name || credentials.email.split('@')[0]
                }
              })
              console.log('Created user:', user.id)
            } else {
              if (isSignUpMode) {
                console.log('User already exists for signup')
                return null
              }

              // Verify password for existing user (signin mode)
              if (!user.password) {
                console.log('User has no password set')
                return null
              } else {
                // Verify existing password
                const isValidPassword = await bcrypt.compare(credentials.password, user.password)
                if (!isValidPassword) {
                  console.log('Invalid password')
                  return null
                }
              }
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name,
            }
          } catch (dbError) {
            console.log('Database error:', dbError)
            return null
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
      if (session?.user) {
        (session.user as any).id = token.sub
      }
      return session
    },
    jwt: async ({ user, token }) => {
      if (user) {
        token.sub = user.id
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