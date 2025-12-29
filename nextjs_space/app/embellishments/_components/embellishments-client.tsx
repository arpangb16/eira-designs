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
import { Plus, Sparkles, Trash2 } from 'lucide-react'
import { FileUpload } from '@/components/file-upload'
import { useRouter } from 'next/navigation'

type Embellishment = {
  id: string
  name: string
  category: string | null
  description: string | null
  filePath: string
  fileIsPublic: boolean
  svgPath: string | null
}

export function EmbellishmentsClient({ embellishments }: { embellishments: Embellishment[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category: 'animal',
    description: '',
    filePath: '',
    fileIsPublic: false,
    svgPath: '',
    svgIsPublic: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.filePath) {
      alert('Please upload the .ai file')
      return
    }
    setLoading(true)

    try {
      const response = await fetch('/api/embellishments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed to create embellishment')

      setOpen(false)
      setFormData({
        name: '',
        category: 'animal',
        description: '',
        filePath: '',
        fileIsPublic: false,
        svgPath: '',
        svgIsPublic: false,
      })
      router.refresh()
    } catch (error) {
      console.error('Error creating embellishment:', error)
      alert('Failed to create embellishment')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this embellishment?')) return

    try {
      const response = await fetch(`/api/embellishments/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete embellishment')
      router.refresh()
    } catch (error) {
      console.error('Error deleting embellishment:', error)
      alert('Failed to delete embellishment')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Embellishment Library</h1>
            <p className="text-gray-600 mt-2">{embellishments.length} embellishments available</p>
          </div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Embellishment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Embellishment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Embellishment Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Eagle Claw"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="animal">Animal</SelectItem>
                      <SelectItem value="abstract">Abstract</SelectItem>
                      <SelectItem value="team-specific">Team Specific</SelectItem>
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
                    placeholder="Embellishment description..."
                  />
                </div>

                <FileUpload
                  label="Embellishment .ai File *"
                  accept=".ai"
                  onUploadComplete={(cloud_storage_path, isPublic) => {
                    setFormData({ ...formData, filePath: cloud_storage_path, fileIsPublic: isPublic })
                  }}
                  isPublic={false}
                />

                <FileUpload
                  label="Embellishment SVG (Optional)"
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
                    {loading ? 'Creating...' : 'Create Embellishment'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {embellishments.map((embellishment) => (
            <Card key={embellishment.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{embellishment.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(embellishment.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {embellishment.category && (
                    <Badge variant="outline" className="capitalize">{embellishment.category}</Badge>
                  )}
                  {embellishment.description && (
                    <p className="text-sm text-gray-600">{embellishment.description}</p>
                  )}
                  <div className="flex items-center gap-2 pt-2">
                    <Sparkles className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {embellishment.svgPath ? 'Has SVG preview' : 'No SVG preview'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {embellishments.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No embellishments yet. Add your first embellishment to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}
