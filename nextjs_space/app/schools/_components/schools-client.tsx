'use client'

import { useState } from 'react'
import { NavBar } from '@/components/nav-bar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { FileUpload } from '@/components/file-upload'
import { Plus, School, MapPin, Trash2, Edit, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface School {
  id: string
  name: string
  address: string | null
  logoPath: string | null
  logoIsPublic: boolean
  createdAt: string
  updatedAt: string
  _count: {
    teams: number
  }
}

interface SchoolsClientProps {
  schools: School[]
}

export function SchoolsClient({ schools: initialSchools }: SchoolsClientProps) {
  const router = useRouter()
  const [schools, setSchools] = useState(initialSchools)
  const [open, setOpen] = useState(false)
  const [editingSchool, setEditingSchool] = useState<School | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    logoPath: '',
    logoIsPublic: false,
  })
  const [loading, setLoading] = useState(false)
  const [logoUrls, setLogoUrls] = useState<Record<string, string>>({})

  // Fetch logo URLs
  const fetchLogoUrl = async (school: School) => {
    if (!school?.logoPath || logoUrls[school.id]) return

    try {
      const response = await fetch('/api/upload/file-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cloud_storage_path: school.logoPath,
          isPublic: school.logoIsPublic,
        }),
      })

      if (response.ok) {
        const { url } = await response.json()
        setLogoUrls((prev) => ({ ...prev, [school.id]: url }))
      }
    } catch (error) {
      console.error('Failed to fetch logo URL:', error)
    }
  }

  // Fetch all logo URLs
  useState(() => {
    schools.forEach((school) => {
      if (school?.logoPath) {
        fetchLogoUrl(school)
      }
    })
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingSchool ? `/api/schools/${editingSchool.id}` : '/api/schools'
      const method = editingSchool ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setOpen(false)
        setEditingSchool(null)
        setFormData({ name: '', address: '', logoPath: '', logoIsPublic: false })
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to save school:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this school?')) return

    try {
      const response = await fetch(`/api/schools/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to delete school:', error)
    }
  }

  const handleEdit = (school: School) => {
    setEditingSchool(school)
    setFormData({
      name: school.name,
      address: school.address ?? '',
      logoPath: school.logoPath ?? '',
      logoIsPublic: school.logoIsPublic,
    })
    setOpen(true)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setEditingSchool(null)
      setFormData({ name: '', address: '', logoPath: '', logoIsPublic: false })
    }
    setOpen(open)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Schools</h1>
            <p className="text-lg text-gray-600">Manage school profiles and information</p>
          </div>
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Add School
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingSchool ? 'Edit School' : 'Add New School'}</DialogTitle>
                <DialogDescription>
                  {editingSchool ? 'Update school information' : 'Create a new school profile'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">School Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Georgia Tech"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="225 North Ave NW, Atlanta, GA 30332"
                      rows={3}
                    />
                  </div>
                  <FileUpload
                    label="School Logo"
                    accept="image/*"
                    isPublic={true}
                    onUploadComplete={(cloud_storage_path, isPublic) => {
                      setFormData({ 
                        ...formData, 
                        logoPath: cloud_storage_path,
                        logoIsPublic: isPublic
                      })
                    }}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : editingSchool ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {schools.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <School className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No schools yet</h3>
              <p className="text-gray-600 mb-4">Get started by adding your first school</p>
              <Button onClick={() => setOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add School
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schools.map((school, index) => (
              <motion.div
                key={school.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-shadow h-full">
                  <CardHeader>
                    {school?.logoPath && logoUrls[school.id] && (
                      <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
                        <Image
                          src={logoUrls[school.id]}
                          alt={school.name}
                          fill
                          className="object-contain p-4"
                        />
                      </div>
                    )}
                    <CardTitle className="flex items-start justify-between">
                      <span className="flex-1">{school.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        <Users className="w-3 h-3 mr-1" />
                        {school._count?.teams ?? 0}
                      </Badge>
                    </CardTitle>
                    {school?.address && (
                      <CardDescription className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{school.address}</span>
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEdit(school)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(school.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
