import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import type { Session } from 'next-auth'

const BYPASS_USER_ID = 'bypass-user-id'

/** Mock session used when BYPASS_AUTH is enabled */
const MOCK_SESSION: Session = {
  user: {
    id: BYPASS_USER_ID,
    email: 'bypass@local.dev',
    name: 'Bypass User',
    role: 'ADMIN',
  },
  expires: '2099-12-31',
}

/**
 * Returns the current session. When BYPASS_AUTH=true, returns a mock admin session
 * so you can use the app without signing up or logging in.
 */
export async function getSession(): Promise<Session | null> {
  if (process.env.BYPASS_AUTH === 'true') {
    return MOCK_SESSION
  }
  return getServerSession(authOptions)
}
