'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Loader2, Shirt } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // AUTHENTICATION DISABLED - Auto sign in with any credentials
    setLoading(true)
    
    try {
      // Automatically sign in with mock credentials
      const result = await signIn('credentials', {
        email: email || 'admin@eira.com',
        password: password || 'any',
        redirect: false,
      })

      if (result?.error) {
        // Even if there's an error, try to redirect (auth is disabled)
        router.replace('/dashboard')
      } else {
        router.replace('/dashboard')
      }
    } catch (err) {
      // On error, still redirect (auth is disabled)
      router.replace('/dashboard')
    } finally {
      setLoading(false)
    }
  }
  
  // Auto sign in on page load (authentication disabled)
  useEffect(() => {
    const autoSignIn = async () => {
      try {
        await signIn('credentials', {
          email: 'admin@eira.com',
          password: 'any',
          redirect: false,
        })
        router.replace('/dashboard')
      } catch (err) {
        // Ignore errors, auth is disabled
      }
    }
    autoSignIn()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mb-2">
            <Shirt className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold">Apparel Design Manager</CardTitle>
          <CardDescription className="text-base">Sign in to manage your team designs</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/signup" className="text-blue-600 hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
