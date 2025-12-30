'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, Palette, Trash2 } from 'lucide-react'
import { ColorPicker } from '@/components/color-picker'
import { useRouter } from 'next/navigation'

type Color = {
  id: string
  name: string
  hexCode: string
  pantoneCode: string | null
  category: string | null
  isCustom: boolean
}

export function ColorsClient({ colors }: { colors: Color[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    hexCode: '#000000',
    pantoneCode: '',
    category: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, isCustom: true }),
      })

      if (!response.ok) throw new Error('Failed to create color')

      setOpen(false)
      setFormData({ name: '', hexCode: '#000000', pantoneCode: '', category: '' })
      router.refresh()
    } catch (error) {
      console.error('Error creating color:', error)
      alert('Failed to create color')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this color?')) return

    try {
      const response = await fetch(`/api/colors/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete color')
      router.refresh()
    } catch (error) {
      console.error('Error deleting color:', error)
      alert('Failed to delete color')
    }
  }

  const groupedColors = colors.reduce((acc, color) => {
    const group = color.isCustom ? 'Custom Colors' : color.category || 'Other'
    if (!acc[group]) acc[group] = []
    acc[group].push(color)
    return acc
  }, {} as Record<string, Color[]>)

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Color Library</h1>
            <p className="text-gray-600 mt-2">{colors.length} colors available</p>
          </div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Custom Color
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Custom Color</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Color Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Team Gold"
                    required
                  />
                </div>

                <ColorPicker
                  label="Hex Code *"
                  color={formData.hexCode}
                  onChange={(hexCode) => setFormData({ ...formData, hexCode })}
                />

                <div>
                  <Label htmlFor="pantoneCode">Pantone Code (Optional)</Label>
                  <Input
                    id="pantoneCode"
                    value={formData.pantoneCode}
                    onChange={(e) => setFormData({ ...formData, pantoneCode: e.target.value })}
                    placeholder="e.g., PANTONE 123 C"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category (Optional)</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., gold, blue"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Color'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-8">
          {Object.entries(groupedColors).map(([groupName, groupColors]) => (
            <div key={groupName}>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 capitalize">{groupName}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {groupColors.map((color) => (
                  <Card key={color.id} className="overflow-hidden">
                    <div
                      className="h-24 w-full"
                      style={{ backgroundColor: color.hexCode }}
                    />
                    <CardContent className="p-3">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{color.name}</p>
                        <p className="text-xs text-gray-600">{color.hexCode}</p>
                        {color.pantoneCode && (
                          <p className="text-xs text-gray-500">{color.pantoneCode}</p>
                        )}
                        <div className="flex items-center justify-between pt-2">
                          {color.isCustom ? (
                            <Badge variant="secondary" className="text-xs">Custom</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Pantone</Badge>
                          )}
                          {color.isCustom && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(color.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
