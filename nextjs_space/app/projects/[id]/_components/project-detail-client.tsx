'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Box, Trash2, Edit, Calendar, FileImage } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Template {
  id: string
  name: string
  category: string
}

interface Item {
  id: string
  name: string
  status: string
  createdAt: Date
  updatedAt: Date
  template: Template | null
  _count: {
    designInstructions: number
    generatedFiles: number
  }
}

interface School {
  id: string
  name: string
}

interface Team {
  id: string
  name: string
  school: School
}

interface Project {
  id: string
  name: string
  season: string | null
  year: number | null
  description: string | null
  team: Team
  items: Item[]
}

const statuses = ['pending', 'in_progress', 'completed', 'cancelled']

export function ProjectDetailClient({ 
  project, 
  templates 
}: { 
  project: Project
  templates: Template[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    templateId: '',
    status: 'pending',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const url = editingItem ? `/api/items/${editingItem.id}` : '/api/items'
      const method = editingItem ? 'PATCH' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, projectId: project.id }),
      })
      if (response.ok) {
        setOpen(false)
        setEditingItem(null)
        setFormData({ name: '', templateId: '', status: 'pending' })
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to save item:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return
    try {
      const response = await fetch(`/api/items/${id}`, { method: 'DELETE' })
      if (response.ok) router.refresh()
    } catch (error) {
      console.error('Failed to delete item:', error)
    }
  }

  const handleEdit = (item: Item) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      templateId: item.template?.id ?? '',
      status: item.status,
    })
    setOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'in_progress': return 'bg-blue-500'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href={`/teams/${project.team.id}`}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to {project.team.name}
            </Button>
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{project.name}</h1>
              <p className="text-lg text-gray-600 mb-2">
                {project.team.name} • {project.team.school.name}
              </p>
              <div className="flex items-center space-x-3">
                {(project.season || project.year) && (
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-1" />
                    {project.season && <span className="capitalize">{project.season}</span>}
                    {project.season && project.year && <span className="mx-1">•</span>}
                    {project.year && <span>{project.year}</span>}
                  </div>
                )}
                <Badge variant="secondary">
                  {project.items.length} {project.items.length === 1 ? 'Item' : 'Items'}
                </Badge>
              </div>
              {project.description && (
                <p className="text-gray-600 mt-3 max-w-2xl">{project.description}</p>
              )}
            </div>
            <Dialog open={open} onOpenChange={(open) => {
              if (!open) {
                setEditingItem(null)
                setFormData({ name: '', templateId: '', status: 'pending' })
              }
              setOpen(open)
            }}>
              <DialogTrigger asChild>
                <Button size="lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
                  <DialogDescription>
                    Design item for {project.name}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Item Name *</Label>
                      <Input 
                        value={formData.name} 
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                        placeholder="Player Jersey - #10 Smith" 
                        required 
                      />
                    </div>
                    <div>
                      <Label>Template</Label>
                      <Select 
                        value={formData.templateId} 
                        onValueChange={(value) => setFormData({ ...formData, templateId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a template..." />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name} ({template.category})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Status *</Label>
                      <Select 
                        value={formData.status} 
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                        required
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {statuses.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Saving...' : editingItem ? 'Update' : 'Create'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {project.items.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Box className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No items yet</h3>
              <p className="text-gray-600 mb-4">Add your first design item for {project.name}</p>
              <Button onClick={() => setOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {project.items.map((item, index) => (
              <motion.div 
                key={item.id} 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/items/${item.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      {item.template && (
                        <div className="w-full aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden mb-4 flex items-center justify-center">
                          <FileImage className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      <CardTitle className="flex items-start justify-between">
                        <span className="flex-1">{item.name}</span>
                        <div className="flex flex-col items-end space-y-1">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(item.status)}`} />
                          <span className="text-xs text-gray-500 capitalize">
                            {item.status.replace('_', ' ')}
                          </span>
                        </div>
                      </CardTitle>
                      <CardDescription>
                        {item.template && (
                          <p className="text-sm mb-2">
                            <span className="font-medium">Template:</span> {item.template.name}
                          </p>
                        )}
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          <span>{item._count.designInstructions} instructions</span>
                          <span>•</span>
                          <span>{item._count.generatedFiles} files</span>
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1" 
                          onClick={(e) => { 
                            e.preventDefault(); 
                            handleEdit(item); 
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => { 
                            e.preventDefault(); 
                            handleDelete(item.id); 
                          }} 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
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
