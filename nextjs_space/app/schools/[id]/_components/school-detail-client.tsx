'use client'

import { useState, useEffect } from 'react'
import { NavBar } from '@/components/nav-bar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { FileUpload } from '@/components/file-upload'
import { ColorPicker } from '@/components/color-picker'
import { ArrowLeft, Plus, Users, Palette, Trash2, Edit, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

interface Team {
  id: string
  name: string
  address: string | null
  primaryColor: string | null
  secondaryColor: string | null
  logoPath: string | null
  logoIsPublic: boolean
  createdAt: string
  updatedAt: string
  _count: { projects: number }
}

interface School {
  id: string
  name: string
  address: string | null
  logoPath: string | null
  logoIsPublic: boolean
  createdAt: string
  updatedAt: string
  teams: Team[]
}

export function SchoolDetailClient({ school }: { school: School }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    primaryColor: '#FF0000',
    secondaryColor: '#0000FF',
    logoPath: '',
    logoIsPublic: false,
  })
  const [loading, setLoading] = useState(false)
  const [schoolLogoUrl, setSchoolLogoUrl] = useState<string | null>(null)
  const [logoUrls, setLogoUrls] = useState<Record<string, string>>({})

  const fetchFileUrl = async (path: string, isPublic: boolean, id: string) => {
    if (!path || logoUrls[id]) return
    try {
      const response = await fetch('/api/upload/file-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cloud_storage_path: path, isPublic }),
      })
      if (response.ok) {
        const { url } = await response.json()
        setLogoUrls((prev) => ({ ...prev, [id]: url }))
      }
    } catch (error) {
      console.error('Failed to fetch file URL:', error)
    }
  }

  const fetchSchoolLogo = async () => {
    if (!school.logoPath) return
    try {
      const response = await fetch('/api/upload/file-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cloud_storage_path: school.logoPath, isPublic: school.logoIsPublic }),
      })
      if (response.ok) {
        const { url } = await response.json()
        setSchoolLogoUrl(url)
      }
    } catch (error) {
      console.error('Failed to fetch school logo:', error)
    }
  }

  useEffect(() => {
    fetchSchoolLogo()
    school.teams.forEach((team) => {
      if (team.logoPath) fetchFileUrl(team.logoPath, team.logoIsPublic, team.id)
    })
  }, [school])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const url = editingTeam ? `/api/teams/${editingTeam.id}` : '/api/teams'
      const method = editingTeam ? 'PATCH' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, schoolId: school.id }),
      })
      if (response.ok) {
        setOpen(false)
        setEditingTeam(null)
        setFormData({ name: '', address: '', primaryColor: '#FF0000', secondaryColor: '#0000FF', logoPath: '', logoIsPublic: false })
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to save team:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return
    try {
      const response = await fetch(`/api/teams/${id}`, { method: 'DELETE' })
      if (response.ok) router.refresh()
    } catch (error) {
      console.error('Failed to delete team:', error)
    }
  }

  const handleEdit = (team: Team) => {
    setEditingTeam(team)
    setFormData({
      name: team.name,
      address: team.address ?? '',
      primaryColor: team.primaryColor ?? '#FF0000',
      secondaryColor: team.secondaryColor ?? '#0000FF',
      logoPath: team.logoPath ?? '',
      logoIsPublic: team.logoIsPublic,
    })
    setOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/schools">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Schools
            </Button>
          </Link>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-6">
              {schoolLogoUrl && (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-white shadow-md">
                  <Image
                    src={schoolLogoUrl}
                    alt={school.name}
                    fill
                    className="object-contain p-2"
                  />
                </div>
              )}
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{school.name}</h1>
                {school.address && (
                  <p className="text-lg text-gray-600 flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    {school.address}
                  </p>
                )}
                <Badge variant="secondary" className="mt-2">
                  {school.teams.length} {school.teams.length === 1 ? 'Team' : 'Teams'}
                </Badge>
              </div>
            </div>
            <Dialog open={open} onOpenChange={(open) => {
              if (!open) {
                setEditingTeam(null)
                setFormData({ name: '', address: '', primaryColor: '#FF0000', secondaryColor: '#0000FF', logoPath: '', logoIsPublic: false })
              }
              setOpen(open)
            }}>
              <DialogTrigger asChild>
                <Button size="lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Team
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingTeam ? 'Edit Team' : 'Add New Team'}</DialogTitle>
                  <DialogDescription>Team for {school.name}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Team Name *</Label>
                      <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Varsity Basketball" required />
                    </div>
                    <div>
                      <Label>Address</Label>
                      <Textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows={2} placeholder="Team facility address..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <ColorPicker label="Primary Color" color={formData.primaryColor} onChange={(color) => setFormData({ ...formData, primaryColor: color })} />
                      <ColorPicker label="Secondary Color" color={formData.secondaryColor} onChange={(color) => setFormData({ ...formData, secondaryColor: color })} />
                    </div>
                    <FileUpload
                      label="Team Logo"
                      accept="image/*"
                      isPublic={false}
                      onUploadComplete={(cloud_storage_path, isPublic) => setFormData({ ...formData, logoPath: cloud_storage_path, logoIsPublic: isPublic })}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={loading}>{loading ? 'Saving...' : editingTeam ? 'Update' : 'Create'}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {school.teams.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No teams yet</h3>
              <p className="text-gray-600 mb-4">Add your first team for {school.name}</p>
              <Button onClick={() => setOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Team
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {school.teams.map((team, index) => (
              <motion.div key={team.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <Link href={`/teams/${team.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    {logoUrls[team.id] && (
                      <div className="relative w-full aspect-video bg-gray-100 border-b">
                        <Image src={logoUrls[team.id]} alt={team.name} fill className="object-contain p-4" />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="flex items-start justify-between">
                        <span className="flex-1">{team.name}</span>
                        <Badge variant="secondary">{team._count?.projects ?? 0}</Badge>
                      </CardTitle>
                      <CardDescription>
                        {team.address && (
                          <p className="text-sm flex items-start mb-2">
                            <MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                            {team.address}
                          </p>
                        )}
                        {team.primaryColor && team.secondaryColor && (
                          <div className="flex items-center space-x-2 mt-2">
                            <Palette className="w-4 h-4 text-gray-500" />
                            <div className="flex space-x-1">
                              <div className="w-6 h-6 rounded border" style={{ backgroundColor: team.primaryColor }} />
                              <div className="w-6 h-6 rounded border" style={{ backgroundColor: team.secondaryColor }} />
                            </div>
                          </div>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={(e) => { e.preventDefault(); handleEdit(team); }}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={(e) => { e.preventDefault(); handleDelete(team.id); }} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
