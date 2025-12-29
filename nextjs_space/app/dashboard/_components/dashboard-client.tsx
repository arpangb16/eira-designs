'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { School, Users, FolderKanban, Palette } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface DashboardClientProps {
  stats: {
    schools: number
    teams: number
    projects: number
    items: number
  }
}

const statCards = [
  { 
    title: 'Schools', 
    icon: School, 
    color: 'bg-blue-500',
    href: '/schools',
    key: 'schools' as const
  },
  { 
    title: 'Teams', 
    icon: Users, 
    color: 'bg-green-500',
    href: '/teams',
    key: 'teams' as const
  },
  { 
    title: 'Projects', 
    icon: FolderKanban, 
    color: 'bg-orange-500',
    href: '/projects',
    key: 'projects' as const
  },
  { 
    title: 'Design Items', 
    icon: Palette, 
    color: 'bg-purple-500',
    href: '/items',
    key: 'items' as const
  },
]

export function DashboardClient({ stats }: DashboardClientProps) {
  return (
    <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-lg text-gray-600">Manage your team apparel designs efficiently</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => {
            const Icon = card.icon
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={card.href}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        {card.title}
                      </CardTitle>
                      <div className={`${card.color} p-2 rounded-lg`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats[card.key]}</div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Start</CardTitle>
              <CardDescription>Get started with your apparel design workflow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link 
                href="/schools" 
                className="block p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <School className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Add a School</p>
                    <p className="text-sm text-gray-600">Create your first school profile</p>
                  </div>
                </div>
              </Link>
              <Link 
                href="/templates" 
                className="block p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Palette className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium">Upload Templates</p>
                    <p className="text-sm text-gray-600">Add .ai template files to your library</p>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates in your workspace</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">No recent activity yet. Start creating designs!</p>
            </CardContent>
          </Card>
        </div>
    </div>
  )
}
