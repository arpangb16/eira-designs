'use client'

import { useState } from 'react'
import { NavBar } from '@/components/nav-bar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, FolderKanban, Trash2, Edit, Palette } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface Team { id: string; name: string; school: { name: string } }
interface Project {
  id: string
  name: string
  teamId: string
  team: Team
  season: string | null
  year: number | null
  description: string | null
  _count: { items: number }
}

export function ProjectsClient({ projects, teams }: { projects: Project[]; teams: Team[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState({ name: '', teamId: '', season: '', year: new Date().getFullYear(), description: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const url = editingProject ? `/api/projects/${editingProject.id}` : '/api/projects'
      const method = editingProject ? 'PATCH' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        setOpen(false)
        setEditingProject(null)
        setFormData({ name: '', teamId: '', season: '', year: new Date().getFullYear(), description: '' })
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
      teamId: project.teamId,
      season: project.season ?? '',
      year: project.year ?? new Date().getFullYear(),
      description: project.description ?? '',
    })
    setOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Projects</h1>
            <p className="text-lg text-gray-600">Manage seasonal design projects</p>
          </div>
          <Dialog open={open} onOpenChange={(open) => {
            if (!open) { setEditingProject(null); setFormData({ name: '', teamId: '', season: '', year: new Date().getFullYear(), description: '' }) }
            setOpen(open)
          }}>
            <DialogTrigger asChild>
              <Button size="lg"><Plus className="w-5 h-5 mr-2" />Add Project</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingProject ? 'Edit Project' : 'Add New Project'}</DialogTitle>
                <DialogDescription>{editingProject ? 'Update project information' : 'Create a new design project'}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div><Label>Project Name *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Fall 2025 Tennis" required /></div>
                  <div><Label>Team *</Label>
                    <Select value={formData.teamId} onValueChange={(value) => setFormData({ ...formData, teamId: value })} required>
                      <SelectTrigger><SelectValue placeholder="Select a team" /></SelectTrigger>
                      <SelectContent>{teams.map((team) => (<SelectItem key={team.id} value={team.id}>{team.name} - {team.school?.name}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Season</Label><Input value={formData.season} onChange={(e) => setFormData({ ...formData, season: e.target.value })} placeholder="Fall" /></div>
                    <div><Label>Year</Label><Input type="number" value={formData.year} onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })} /></div>
                  </div>
                  <div><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} /></div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={loading}>{loading ? 'Saving...' : editingProject ? 'Update' : 'Create'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {projects.length === 0 ? (
          <Card className="text-center py-12"><CardContent><FolderKanban className="w-16 h-16 mx-auto text-gray-400 mb-4" /><h3 className="text-xl font-semibold mb-2">No projects yet</h3><p className="text-gray-600 mb-4">Create your first project</p><Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />Add Project</Button></CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <motion.div key={project.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <Card className="hover:shadow-lg transition-shadow h-full">
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between"><span className="flex-1">{project.name}</span><Badge variant="secondary" className="ml-2"><Palette className="w-3 h-3 mr-1" />{project._count?.items ?? 0}</Badge></CardTitle>
                    <CardDescription className="space-y-1">
                      <div className="font-medium">{project.team?.name}</div>
                      <div className="text-xs">{project.team?.school?.name}</div>
                      {(project?.season || project?.year) && <div className="text-xs">{project.season} {project.year}</div>}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(project)}><Edit className="w-4 h-4 mr-2" />Edit</Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(project.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
