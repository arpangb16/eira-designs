'use client'

import { useState } from 'react'
import { NavBar } from '@/components/nav-bar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Plus, Grid3x3, Trash2 } from 'lucide-react'
import { FileUpload } from '@/components/file-upload'
import { useRouter } from 'next/navigation'

type Pattern = {
  id: string
  name: string
  category: string
  description: string | null
  filePath: string
  fileIsPublic: boolean
  svgPath: string | null
  thumbnailPath: string | null
}

export function PatternsClient({ patterns }: { patterns: Pattern[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category: 'body',
    description: '',
    filePath: '',
    fileIsPublic: false,
    svgPath: '',
    svgIsPublic: false,
    thumbnailPath: '',
    thumbnailIsPublic: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.filePath) {
      alert('Please upload the .ai file')
      return
    }
    setLoading(true)

    try {
      const response = await fetch('/api/patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed to create pattern')

      setOpen(false)
      setFormData({
        name: '',
        category: 'body',
        description: '',
        filePath: '',
        fileIsPublic: false,
        svgPath: '',
        svgIsPublic: false,
        thumbnailPath: '',
        thumbnailIsPublic: false,
      })
      router.refresh()
    } catch (error) {
      console.error('Error creating pattern:', error)
      alert('Failed to create pattern')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pattern?')) return

    try {
      const response = await fetch(`/api/patterns/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete pattern')
      router.refresh()
    } catch (error) {
      console.error('Error deleting pattern:', error)
      alert('Failed to delete pattern')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pattern Library</h1>
            <p className="text-gray-600 mt-2">{patterns.length} patterns available</p>
          </div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Pattern
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Pattern</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Pattern Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Stripes - Diagonal"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Layer Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="body">Body</SelectItem>
                      <SelectItem value="inseam">Inseam</SelectItem>
                      <SelectItem value="cuff">Cuff</SelectItem>
                      <SelectItem value="sleeve">Sleeve</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Pattern description..."
                  />
                </div>

                <FileUpload
                  label="Pattern .ai File *"
                  accept=".ai"
                  onUploadComplete={(cloud_storage_path, isPublic) => {
                    setFormData({ ...formData, filePath: cloud_storage_path, fileIsPublic: isPublic })
                  }}
                  isPublic={false}
                />

                <FileUpload
                  label="Pattern SVG (Optional)"
                  accept=".svg"
                  onUploadComplete={(cloud_storage_path, isPublic) => {
                    setFormData({ ...formData, svgPath: cloud_storage_path, svgIsPublic: isPublic })
                  }}
                  isPublic={false}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Pattern'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patterns.map((pattern) => (
            <Card key={pattern.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{pattern.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(pattern.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge variant="outline" className="capitalize">{pattern.category}</Badge>
                  {pattern.description && (
                    <p className="text-sm text-gray-600">{pattern.description}</p>
                  )}
                  <div className="flex items-center gap-2 pt-2">
                    <Grid3x3 className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {pattern.svgPath ? 'Has SVG preview' : 'No SVG preview'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {patterns.length === 0 && (
          <div className="text-center py-12">
            <Grid3x3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No patterns yet. Add your first pattern to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}
