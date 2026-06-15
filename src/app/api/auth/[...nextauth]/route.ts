import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        const validUsers = [
          { id: '1', email: 'manager@imf-togo.com', password: 'password123', name: 'Manager Prospera', role: 'MANAGER' },
          { id: '2', email: 'k.amavi@imf-togo.com', password: 'password123', name: 'Kofi Amavi', role: 'GESTIONNAIRE' },
        ]
        const user = validUsers.find(
          u => u.email === credentials?.email && u.password === credentials?.password
        )
        if (user) {
          return { id: user.id, email: user.email, name: user.name }
        }
        return null
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async session({ session, token }) {
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }
