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
import { Plus, Palette, Trash2, Edit, MessageSquare, Sparkles, FileText } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Project { id: string; name: string; team: { name: string; school: { name: string } } }
interface Template { id: string; name: string; category: string }
interface Item {
  id: string
  name: string
  projectId: string
  project: Project
  templateId: string | null
  template: Template | null
  status: string
  _count: { designInstructions: number; generatedFiles: number }
}

export function ItemsClient({ items, projects, templates }: { items: Item[]; projects: Project[]; templates: Template[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [designOpen, setDesignOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [formData, setFormData] = useState({ name: '', projectId: '', templateId: '', status: 'draft' })
  const [instruction, setInstruction] = useState('')
  const [parsedResult, setParsedResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [parsing, setParsing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const url = editingItem ? `/api/items/${editingItem.id}` : '/api/items'
      const method = editingItem ? 'PATCH' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        setOpen(false)
        setEditingItem(null)
        setFormData({ name: '', projectId: '', templateId: '', status: 'draft' })
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
    setFormData({ name: item.name, projectId: item.projectId, templateId: item.templateId ?? '', status: item.status })
    setOpen(true)
  }

  const handleParseInstruction = async () => {
    if (!instruction.trim()) return
    setParsing(true)
    setParsedResult(null)

    try {
      const response = await fetch('/api/design/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction }),
      })

      if (!response.ok) {
        throw new Error('Failed to parse instruction')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let partialRead = ''

      while (true) {
        const { done, value } = await reader?.read() ?? { done: true, value: undefined }
        if (done) break

        partialRead += decoder.decode(value, { stream: true })
        let lines = partialRead.split('\n')
        partialRead = lines.pop() ?? ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              return
            }
            try {
              const parsed = JSON.parse(data)
              if (parsed.status === 'completed') {
                setParsedResult(parsed.result)
                return
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to parse instruction:', error)
    } finally {
      setParsing(false)
    }
  }

  const handleSaveInstruction = async () => {
    if (!selectedItem || !instruction.trim()) return
    setLoading(true)
    try {
      const response = await fetch('/api/design-instructions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: selectedItem.id,
          instruction,
          parsedData: parsedResult,
        }),
      })
      if (response.ok) {
        setDesignOpen(false)
        setSelectedItem(null)
        setInstruction('')
        setParsedResult(null)
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to save instruction:', error)
    } finally {
      setLoading(false)
    }
  }

  const openDesignDialog = (item: Item) => {
    setSelectedItem(item)
    setInstruction('')
    setParsedResult(null)
    setDesignOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Design Items</h1>
            <p className="text-lg text-gray-600">Create and manage apparel designs</p>
          </div>
          <Dialog open={open} onOpenChange={(open) => {
            if (!open) { setEditingItem(null); setFormData({ name: '', projectId: '', templateId: '', status: 'draft' }) }
            setOpen(open)
          }}>
            <DialogTrigger asChild>
              <Button size="lg"><Plus className="w-5 h-5 mr-2" />Add Item</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
                <DialogDescription>{editingItem ? 'Update item information' : 'Create a new design item'}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div><Label>Item Name *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Home Jersey Design" required /></div>
                  <div><Label>Project *</Label>
                    <Select value={formData.projectId} onValueChange={(value) => setFormData({ ...formData, projectId: value })} required>
                      <SelectTrigger><SelectValue placeholder="Select a project" /></SelectTrigger>
                      <SelectContent>{projects.map((project) => (<SelectItem key={project.id} value={project.id}>{project.name} - {project.team?.name}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Template</Label>
                    <Select value={formData.templateId} onValueChange={(value) => setFormData({ ...formData, templateId: value })}>
                      <SelectTrigger><SelectValue placeholder="Select a template (optional)" /></SelectTrigger>
                      <SelectContent>{templates.map((template) => (<SelectItem key={template.id} value={template.id}>{template.name} ({template.category})</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="final">Final</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={loading}>{loading ? 'Saving...' : editingItem ? 'Update' : 'Create'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={designOpen} onOpenChange={setDesignOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span>Conversational Design</span>
              </DialogTitle>
              <DialogDescription>Describe your design in natural language</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Design Instruction</Label>
                <Textarea
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="Example: Put GT logo on top left, player name on back center, manufacturer logo bottom right"
                  rows={4}
                  className="mt-2"
                />
              </div>
              <Button type="button" onClick={handleParseInstruction} disabled={parsing || !instruction.trim()} className="w-full">
                {parsing ? 'Parsing...' : 'Parse Instruction'}
              </Button>
              {parsedResult && (
                <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="font-semibold text-sm">Parsed Design:</div>
                  <div className="text-sm"><strong>Summary:</strong> {parsedResult.summary}</div>
                  <div className="space-y-2">
                    <div className="font-semibold text-sm">Elements:</div>
                    {parsedResult.elements?.map((element: any, index: number) => (
                      <div key={index} className="p-3 bg-white rounded border space-y-1 text-sm">
                        <div><strong>Type:</strong> {element.type}</div>
                        <div><strong>Content:</strong> {element.content}</div>
                        <div><strong>Location:</strong> {element.location}</div>
                        <div><strong>Size:</strong> {element.size}</div>
                        {element?.notes && <div><strong>Notes:</strong> {element.notes}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDesignOpen(false)}>Cancel</Button>
              <Button type="button" onClick={handleSaveInstruction} disabled={loading || !parsedResult}>
                {loading ? 'Saving...' : 'Save Design Instruction'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {items.length === 0 ? (
          <Card className="text-center py-12"><CardContent><Palette className="w-16 h-16 mx-auto text-gray-400 mb-4" /><h3 className="text-xl font-semibold mb-2">No items yet</h3><p className="text-gray-600 mb-4">Create your first design item</p><Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />Add Item</Button></CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item, index) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <Card className="hover:shadow-lg transition-shadow h-full">
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between">
                      <Link href={`/items/${item.id}`} className="flex-1 hover:text-blue-600 transition-colors">
                        {item.name}
                      </Link>
                      <Badge variant={item.status === 'approved' ? 'default' : item.status === 'final' ? 'secondary' : 'outline'}>
                        {item.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="space-y-1">
                      <div className="font-medium text-sm">{item.project?.name}</div>
                      <div className="text-xs">{item.project?.team?.name} - {item.project?.team?.school?.name}</div>
                      {item?.template && <div className="text-xs">Template: {item.template.name}</div>}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex space-x-3 text-xs text-gray-600">
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="w-3 h-3" />
                        <span>{item._count?.designInstructions ?? 0} instructions</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FileText className="w-3 h-3" />
                        <span>{item._count?.generatedFiles ?? 0} files</span>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <Link href={`/items/${item.id}`}>
                        <Button variant="default" size="sm" className="w-full">
                          <Palette className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => openDesignDialog(item)}>
                          <Sparkles className="w-4 h-4 mr-2" />Text
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(item)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                      </div>
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
