'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { FileUpload } from '@/components/file-upload'
import { ColorPicker } from '@/components/color-picker'
import { Plus, Users, MapPin, Trash2, Edit, FolderKanban, Palette } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

interface School {
  id: string
  name: string
}

interface Team {
  id: string
  name: string
  schoolId: string
  school: School
  logoPath: string | null
  logoIsPublic: boolean
  primaryColor: string | null
  secondaryColor: string | null
  address: string | null
  _count: { projects: number }
}

interface TeamsClientProps {
  teams: Team[]
  schools: School[]
}

export function TeamsClient({ teams: initialTeams, schools }: TeamsClientProps) {
  const router = useRouter()
  const [teams, setTeams] = useState(initialTeams)
  const [open, setOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    schoolId: '',
    address: '',
    logoPath: '',
    logoIsPublic: false,
    primaryColor: '#003057',
    secondaryColor: '#B3A369',
  })
  const [loading, setLoading] = useState(false)
  const [logoUrls, setLogoUrls] = useState<Record<string, string>>({})

  const fetchLogoUrl = async (team: Team) => {
    if (!team?.logoPath || logoUrls[team.id]) return
    try {
      const response = await fetch('/api/upload/file-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cloud_storage_path: team.logoPath,
          isPublic: team.logoIsPublic,
        }),
      })
      if (response.ok) {
        const { url } = await response.json()
        setLogoUrls((prev) => ({ ...prev, [team.id]: url }))
      }
    } catch (error) {
      console.error('Failed to fetch logo URL:', error)
    }
  }

  useEffect(() => {
    teams.forEach((team) => {
      if (team?.logoPath) fetchLogoUrl(team)
    })
  }, [teams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const url = editingTeam ? `/api/teams/${editingTeam.id}` : '/api/teams'
      const method = editingTeam ? 'PATCH' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        setOpen(false)
        setEditingTeam(null)
        setFormData({ name: '', schoolId: '', address: '', logoPath: '', logoIsPublic: false, primaryColor: '#003057', secondaryColor: '#B3A369' })
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to save team:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return
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
      schoolId: team.schoolId,
      address: team.address ?? '',
      logoPath: team.logoPath ?? '',
      logoIsPublic: team.logoIsPublic,
      primaryColor: team.primaryColor ?? '#003057',
      secondaryColor: team.secondaryColor ?? '#B3A369',
    })
    setOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Teams</h1>
            <p className="text-lg text-gray-600">Manage team profiles, logos, and colors</p>
          </div>
          <Dialog open={open} onOpenChange={(open) => {
            if (!open) {
              setEditingTeam(null)
              setFormData({ name: '', schoolId: '', address: '', logoPath: '', logoIsPublic: false, primaryColor: '#003057', secondaryColor: '#B3A369' })
            }
            setOpen(open)
          }}>
            <DialogTrigger asChild>
              <Button size="lg"><Plus className="w-5 h-5 mr-2" />Add Team</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTeam ? 'Edit Team' : 'Add New Team'}</DialogTitle>
                <DialogDescription>{editingTeam ? 'Update team information' : 'Create a new team profile'}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Team Name *</Label>
                    <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Yellow Jackets" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="school">School *</Label>
                    <Select value={formData.schoolId} onValueChange={(value) => setFormData({ ...formData, schoolId: value })} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a school" />
                      </SelectTrigger>
                      <SelectContent>
                        {schools.map((school) => (
                          <SelectItem key={school.id} value={school.id}>{school.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Team contact address" rows={2} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ColorPicker label="Primary Color" color={formData.primaryColor} onChange={(color) => setFormData({ ...formData, primaryColor: color })} />
                    <ColorPicker label="Secondary Color" color={formData.secondaryColor} onChange={(color) => setFormData({ ...formData, secondaryColor: color })} />
                  </div>
                  <FileUpload label="Team Logo" accept="image/*" isPublic={true} onUploadComplete={(cloud_storage_path, isPublic) => setFormData({ ...formData, logoPath: cloud_storage_path, logoIsPublic: isPublic })} />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={loading}>{loading ? 'Saving...' : editingTeam ? 'Update' : 'Create'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {teams.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No teams yet</h3>
              <p className="text-gray-600 mb-4">Create your first team to get started</p>
              <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />Add Team</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team, index) => (
              <motion.div key={team.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <Link href={`/teams/${team.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      {team?.logoPath && logoUrls[team.id] && (
                        <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
                          <Image src={logoUrls[team.id]} alt={team.name} fill className="object-contain p-4" />
                        </div>
                      )}
                      <CardTitle className="flex items-start justify-between">
                        <span className="flex-1">{team.name}</span>
                        <Badge variant="secondary" className="ml-2">
                          <FolderKanban className="w-3 h-3 mr-1" />
                          {team._count?.projects ?? 0}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="space-y-1">
                        <div className="font-medium text-sm">{team.school?.name}</div>
                        {team?.address && (
                          <div className="flex items-start space-x-2 text-xs">
                            <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>{team.address}</span>
                          </div>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex space-x-2 mb-3">
                        {team?.primaryColor && (
                          <div className="flex items-center space-x-1">
                            <div className="w-6 h-6 rounded border" style={{ backgroundColor: team.primaryColor }} />
                            <span className="text-xs text-gray-600">Primary</span>
                          </div>
                        )}
                        {team?.secondaryColor && (
                          <div className="flex items-center space-x-1">
                            <div className="w-6 h-6 rounded border" style={{ backgroundColor: team.secondaryColor }} />
                            <span className="text-xs text-gray-600">Secondary</span>
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={(e) => { e.preventDefault(); handleEdit(team); }}>
                          <Edit className="w-4 h-4 mr-2" />Edit
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
