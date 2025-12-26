'use client'

import { useState, useEffect } from 'react'
import { NavBar } from '@/components/nav-bar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { FileUpload } from '@/components/file-upload'
import { Plus, FileImage, Trash2, Edit, Download } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface Template {
  id: string
  name: string
  category: string
  filePath: string
  fileIsPublic: boolean
  description: string | null
  _count: { items: number }
}

const categories = ['t-shirts', 'shorts', 'jerseys', 'hoodies', 'jackets', 'other']

export function TemplatesClient({ templates }: { templates: Template[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [formData, setFormData] = useState({ name: '', category: 't-shirts', filePath: '', fileIsPublic: false, description: '' })
  const [loading, setLoading] = useState(false)
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({})

  const fetchFileUrl = async (template: Template) => {
    if (!template?.filePath || fileUrls[template.id]) return
    try {
      const response = await fetch('/api/upload/file-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cloud_storage_path: template.filePath, isPublic: template.fileIsPublic }),
      })
      if (response.ok) {
        const { url } = await response.json()
        setFileUrls((prev) => ({ ...prev, [template.id]: url }))
      }
    } catch (error) {
      console.error('Failed to fetch file URL:', error)
    }
  }

  useEffect(() => {
    templates.forEach((template) => {
      if (template?.filePath) fetchFileUrl(template)
    })
  }, [templates])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const url = editingTemplate ? `/api/templates/${editingTemplate.id}` : '/api/templates'
      const method = editingTemplate ? 'PATCH' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        setOpen(false)
        setEditingTemplate(null)
        setFormData({ name: '', category: 't-shirts', filePath: '', fileIsPublic: false, description: '' })
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to save template:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return
    try {
      const response = await fetch(`/api/templates/${id}`, { method: 'DELETE' })
      if (response.ok) router.refresh()
    } catch (error) {
      console.error('Failed to delete template:', error)
    }
  }

  const handleEdit = (template: Template) => {
    setEditingTemplate(template)
    setFormData({ name: template.name, category: template.category, filePath: template.filePath, fileIsPublic: template.fileIsPublic, description: template.description ?? '' })
    setOpen(true)
  }

  const handleDownload = (template: Template) => {
    const url = fileUrls[template.id]
    if (!url) return
    const link = document.createElement('a')
    link.href = url
    link.target = '_blank'
    link.click()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Templates</h1>
            <p className="text-lg text-gray-600">Manage .ai template files</p>
          </div>
          <Dialog open={open} onOpenChange={(open) => {
            if (!open) { setEditingTemplate(null); setFormData({ name: '', category: 't-shirts', filePath: '', fileIsPublic: false, description: '' }) }
            setOpen(open)
          }}>
            <DialogTrigger asChild>
              <Button size="lg"><Plus className="w-5 h-5 mr-2" />Add Template</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTemplate ? 'Edit Template' : 'Add New Template'}</DialogTitle>
                <DialogDescription>{editingTemplate ? 'Update template information' : 'Upload a new .ai template file'}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div><Label>Template Name *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Basic T-Shirt Design" required /></div>
                  <div><Label>Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })} required>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{categories.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} /></div>
                  <FileUpload label=".AI Template File" accept=".ai,application/postscript,application/illustrator" isPublic={false} maxSize={500} onUploadComplete={(cloud_storage_path, isPublic) => setFormData({ ...formData, filePath: cloud_storage_path, fileIsPublic: isPublic })} />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={loading || !formData.filePath}>{loading ? 'Saving...' : editingTemplate ? 'Update' : 'Create'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {templates.length === 0 ? (
          <Card className="text-center py-12"><CardContent><FileImage className="w-16 h-16 mx-auto text-gray-400 mb-4" /><h3 className="text-xl font-semibold mb-2">No templates yet</h3><p className="text-gray-600 mb-4">Upload your first .ai template</p><Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />Add Template</Button></CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template, index) => (
              <motion.div key={template.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <Card className="hover:shadow-lg transition-shadow h-full">
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between"><span className="flex-1">{template.name}</span><Badge variant="secondary">{template._count?.items ?? 0}</Badge></CardTitle>
                    <CardDescription>
                      <Badge className="mb-2">{template.category}</Badge>
                      {template?.description && <p className="text-sm mt-2">{template.description}</p>}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(template)}><Edit className="w-4 h-4 mr-2" />Edit</Button>
                      <Button variant="outline" size="sm" onClick={() => handleDownload(template)}><Download className="w-4 h-4" /></Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(template.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
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
