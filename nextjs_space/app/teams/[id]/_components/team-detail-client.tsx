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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Plus, FolderKanban, Trash2, Edit, MapPin, Palette, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

interface Project {
  id: string
  name: string
  season: string | null
  year: number | null
  description: string | null
  createdAt: string
  updatedAt: string
  _count: { items: number }
}

interface School {
  id: string
  name: string
  address: string | null
  createdAt: string
  updatedAt: string
}

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
  school: School
  projects: Project[]
}

const seasons = ['spring', 'summer', 'fall', 'winter']
const currentYear = new Date().getFullYear()
const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i)

export function TeamDetailClient({ team }: { team: Team }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    season: 'fall',
    year: currentYear,
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [teamLogoUrl, setTeamLogoUrl] = useState<string | null>(null)

  const fetchTeamLogo = async () => {
    if (!team.logoPath) return
    try {
      const response = await fetch('/api/upload/file-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cloud_storage_path: team.logoPath, isPublic: team.logoIsPublic }),
      })
      if (response.ok) {
        const { url } = await response.json()
        setTeamLogoUrl(url)
      }
    } catch (error) {
      console.error('Failed to fetch team logo:', error)
    }
  }

  useEffect(() => {
    fetchTeamLogo()
  }, [team])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const url = editingProject ? `/api/projects/${editingProject.id}` : '/api/projects'
      const method = editingProject ? 'PATCH' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, teamId: team.id }),
      })
      if (response.ok) {
        setOpen(false)
        setEditingProject(null)
        setFormData({ name: '', season: 'fall', year: currentYear, description: '' })
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to save project:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return
    try {
      const response = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      if (response.ok) router.refresh()
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setFormData({
      name: project.name,
      season: project.season ?? 'fall',
      year: project.year ?? currentYear,
      description: project.description ?? '',
    })
    setOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href={`/schools/${team.school.id}`}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to {team.school.name}
            </Button>
          </Link>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-6">
              {teamLogoUrl && (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-white shadow-md">
                  <Image
                    src={teamLogoUrl}
                    alt={team.name}
                    fill
                    className="object-contain p-2"
                  />
                </div>
              )}
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{team.name}</h1>
                <p className="text-lg text-gray-600 mb-2">{team.school.name}</p>
                {team.address && (
                  <p className="text-gray-600 flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    {team.address}
                  </p>
                )}
                <div className="flex items-center space-x-4 mt-3">
                  {team.primaryColor && team.secondaryColor && (
                    <div className="flex items-center space-x-2">
                      <Palette className="w-4 h-4 text-gray-500" />
                      <div className="flex space-x-1">
                        <div className="w-6 h-6 rounded border" style={{ backgroundColor: team.primaryColor }} />
                        <div className="w-6 h-6 rounded border" style={{ backgroundColor: team.secondaryColor }} />
                      </div>
                    </div>
                  )}
                  <Badge variant="secondary">
                    {team.projects.length} {team.projects.length === 1 ? 'Project' : 'Projects'}
                  </Badge>
                </div>
              </div>
            </div>
            <Dialog open={open} onOpenChange={(open) => {
              if (!open) {
                setEditingProject(null)
                setFormData({ name: '', season: 'fall', year: currentYear, description: '' })
              }
              setOpen(open)
            }}>
              <DialogTrigger asChild>
                <Button size="lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Project
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingProject ? 'Edit Project' : 'Add New Project'}</DialogTitle>
                  <DialogDescription>Project for {team.name}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Project Name *</Label>
                      <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="2025 Home Jersey Design" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Season</Label>
                        <Select value={formData.season} onValueChange={(value) => setFormData({ ...formData, season: value })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {seasons.map((season) => (
                              <SelectItem key={season} value={season}>
                                {season.charAt(0).toUpperCase() + season.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Year</Label>
                        <Select value={String(formData.year)} onValueChange={(value) => setFormData({ ...formData, year: parseInt(value) })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {years.map((year) => (
                              <SelectItem key={year} value={String(year)}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} placeholder="Project details..." />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={loading}>{loading ? 'Saving...' : editingProject ? 'Update' : 'Create'}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {team.projects.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FolderKanban className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
              <p className="text-gray-600 mb-4">Add your first project for {team.name}</p>
              <Button onClick={() => setOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.projects.map((project, index) => (
              <motion.div key={project.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <Link href={`/projects/${project.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <CardTitle className="flex items-start justify-between">
                        <span className="flex-1">{project.name}</span>
                        <Badge variant="secondary">{project._count?.items ?? 0}</Badge>
                      </CardTitle>
                      <CardDescription>
                        {(project.season || project.year) && (
                          <div className="flex items-center text-sm text-gray-500 mb-2">
                            <Calendar className="w-4 h-4 mr-1" />
                            {project.season && <span className="capitalize">{project.season}</span>}
                            {project.season && project.year && <span className="mx-1">•</span>}
                            {project.year && <span>{project.year}</span>}
                          </div>
                        )}
                        {project.description && <p className="text-sm mt-2">{project.description}</p>}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={(e) => { e.preventDefault(); handleEdit(project); }}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={(e) => { e.preventDefault(); handleDelete(project.id); }} className="text-red-600 hover:text-red-700 hover:bg-red-50">
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
