'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/file-upload';
import { Plus, Image as ImageIcon, Trash2, Edit, School as SchoolIcon, Users, FolderKanban, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';

interface Logo {
  id: string;
  name: string;
  description?: string | null;
  logoPath: string;
  logoIsPublic: boolean;
  schoolId?: string | null;
  teamId?: string | null;
  projectId?: string | null;
  itemId?: string | null;
  school?: { id: string; name: string } | null;
  team?: { id: string; name: string; schoolId: string } | null;
  project?: { id: string; name: string } | null;
  item?: { id: string; name: string } | null;
}

interface School {
  id: string;
  name: string;
}

interface Team {
  id: string;
  name: string;
  schoolId: string;
  school?: { id: string; name: string };
}

interface Project {
  id: string;
  name: string;
}

interface Item {
  id: string;
  name: string;
}

interface LogosClientProps {
  initialLogos: Logo[];
  schools: School[];
  teams: Team[];
  projects: Project[];
  items: Item[];
}

export default function LogosClient({
  initialLogos,
  schools,
  teams,
  projects,
  items,
}: LogosClientProps) {
  const router = useRouter();
  const [logos, setLogos] = useState<Logo[]>(initialLogos);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingLogo, setEditingLogo] = useState<Logo | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logoPath: '',
    logoIsPublic: false,
    schoolId: '',
    teamId: '',
    projectId: '',
    itemId: '',
  });

  // Filtered teams based on selected school
  const [filteredTeams, setFilteredTeams] = useState<Team[]>(teams);

  // Update filtered teams when school changes
  useEffect(() => {
    if (formData.schoolId) {
      setFilteredTeams(teams.filter(t => t.schoolId === formData.schoolId));
      // Clear team selection if it doesn't belong to the selected school
      if (formData.teamId) {
        const team = teams.find(t => t.id === formData.teamId);
        if (team && team.schoolId !== formData.schoolId) {
          setFormData(prev => ({ ...prev, teamId: '' }));
        }
      }
    } else {
      setFilteredTeams(teams);
    }
  }, [formData.schoolId, teams, formData.teamId]);

  // Fetch file URL
  async function fetchFileUrl(path: string, isPublic: boolean) {
    try {
      const response = await fetch('/api/upload/file-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cloud_storage_path: path, isPublic }),
      });
      const data = await response.json();
      return data.url || '';
    } catch (error) {
      console.error('Error fetching file URL:', error);
      return '';
    }
  }

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingLogo ? `/api/logos/${editingLogo.id}` : '/api/logos';
      const method = editingLogo ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          logoPath: formData.logoPath,
          logoIsPublic: formData.logoIsPublic,
          schoolId: formData.schoolId || null,
          teamId: formData.teamId || null,
          projectId: formData.projectId || null,
          itemId: formData.itemId || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save logo');
      }

      toast.success(editingLogo ? 'Logo updated!' : 'Logo added!');
      router.refresh();
      handleOpenChange(false);
    } catch (error) {
      console.error('Error saving logo:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save logo');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle delete
  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this logo?')) return;

    try {
      const response = await fetch(`/api/logos/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete logo');
      toast.success('Logo deleted!');
      router.refresh();
    } catch (error) {
      console.error('Error deleting logo:', error);
      toast.error('Failed to delete logo');
    }
  }

  // Handle edit
  function handleEdit(logo: Logo) {
    setEditingLogo(logo);
    setFormData({
      name: logo.name,
      description: logo.description || '',
      logoPath: logo.logoPath,
      logoIsPublic: logo.logoIsPublic,
      schoolId: logo.schoolId || '',
      teamId: logo.teamId || '',
      projectId: logo.projectId || '',
      itemId: logo.itemId || '',
    });
    setDialogOpen(true);
  }

  // Handle dialog open/close
  function handleOpenChange(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      setEditingLogo(null);
      setFormData({
        name: '',
        description: '',
        logoPath: '',
        logoIsPublic: false,
        schoolId: '',
        teamId: '',
        projectId: '',
        itemId: '',
      });
    }
  }

  // Logo file upload handler
  function handleLogoUpload(path: string, isPublic: boolean) {
    setFormData(prev => ({ ...prev, logoPath: path, logoIsPublic: isPublic }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Logo Library</h1>
          <p className="text-muted-foreground mt-1">
            Manage logos for schools, teams, projects, and items
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Logo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLogo ? 'Edit Logo' : 'Add New Logo'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Primary Logo, Mascot"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description..."
                  rows={3}
                />
              </div>

              <div>
                <FileUpload
                  label="Logo File *"
                  accept=".png,.jpg,.jpeg,.svg,.ai,.pdf"
                  isPublic={true}
                  onUploadComplete={handleLogoUpload}
                  existingFilePath={formData.logoPath}
                />
              </div>

              <div className="border-t pt-4 space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground">
                  Optional Associations (all optional)
                </h3>

                <div>
                  <Label htmlFor="schoolId">School</Label>
                  <Select
                    value={formData.schoolId}
                    onValueChange={(value) => setFormData({ ...formData, schoolId: value })}
                  >
                    <SelectTrigger id="schoolId">
                      <SelectValue placeholder="Select school (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {schools.map((school) => (
                        <SelectItem key={school.id} value={school.id}>
                          {school.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="teamId">Team</Label>
                  <Select
                    value={formData.teamId}
                    onValueChange={(value) => setFormData({ ...formData, teamId: value })}
                    disabled={filteredTeams.length === 0}
                  >
                    <SelectTrigger id="teamId">
                      <SelectValue placeholder="Select team (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {filteredTeams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                          {team.school && ` (${team.school.name})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.schoolId && filteredTeams.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      No teams available for the selected school
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="projectId">Project</Label>
                  <Select
                    value={formData.projectId}
                    onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                  >
                    <SelectTrigger id="projectId">
                      <SelectValue placeholder="Select project (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="itemId">Item</Label>
                  <Select
                    value={formData.itemId}
                    onValueChange={(value) => setFormData({ ...formData, itemId: value })}
                  >
                    <SelectTrigger id="itemId">
                      <SelectValue placeholder="Select item (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !formData.name || !formData.logoPath}>
                  {isSubmitting ? 'Saving...' : editingLogo ? 'Update' : 'Add Logo'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {initialLogos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No logos yet. Click &quot;Add Logo&quot; to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {initialLogos.map((logo, index) => (
            <motion.div
              key={logo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{logo.name}</CardTitle>
                      {logo.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {logo.description}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Logo Preview */}
                  <div className="relative w-full aspect-square bg-muted rounded-md overflow-hidden">
                    <LogoImage logoPath={logo.logoPath} logoIsPublic={logo.logoIsPublic} name={logo.name} />
                  </div>

                  {/* Associations */}
                  {(logo.school || logo.team || logo.project || logo.item) && (
                    <div className="space-y-2">
                      {logo.school && (
                        <div className="flex items-center gap-2 text-sm">
                          <SchoolIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{logo.school.name}</span>
                        </div>
                      )}
                      {logo.team && (
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{logo.team.name}</span>
                        </div>
                      )}
                      {logo.project && (
                        <div className="flex items-center gap-2 text-sm">
                          <FolderKanban className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{logo.project.name}</span>
                        </div>
                      )}
                      {logo.item && (
                        <div className="flex items-center gap-2 text-sm">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{logo.item.name}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleEdit(logo)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(logo.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// Separate component for logo image to handle async loading
function LogoImage({ logoPath, logoIsPublic, name }: { logoPath: string; logoIsPublic: boolean; name: string }) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadImage() {
      try {
        const response = await fetch('/api/upload/file-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cloud_storage_path: logoPath, isPublic: logoIsPublic }),
        });
        const data = await response.json();
        setImageUrl(data.url || '');
      } catch (error) {
        console.error('Error loading logo:', error);
      } finally {
        setLoading(false);
      }
    }
    loadImage();
  }, [logoPath, logoIsPublic]);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <ImageIcon className="h-12 w-12 text-muted-foreground" />
      </div>
    );
  }

  return (
    <Image
      src={imageUrl}
      alt={name}
      fill
      className="object-contain p-4"
    />
  );
}
