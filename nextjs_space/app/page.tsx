import { redirect } from 'next/navigation'

export default function HomePage() {
  if (process.env.BYPASS_AUTH === 'true') {
    redirect('/dashboard')
  }
  redirect('/login')
}
