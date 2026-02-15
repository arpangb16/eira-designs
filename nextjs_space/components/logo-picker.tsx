"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileUpload } from "@/components/file-upload";
import { Upload, CheckCircle2, School, Users, FolderKanban, FileImage, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface Logo {
  id: string;
  name: string;
  description: string | null;
  logoPath: string;
  logoIsPublic: boolean;
  school?: { name: string } | null;
  team?: { name: string } | null;
  project?: { name: string } | null;
  item?: { name: string } | null;
}

interface LogoPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (logoPath: string, logoIsPublic: boolean) => void;
  itemId: string;
  currentLogoPath?: string | null;
}

export function LogoPicker({ open, onOpenChange, onSelect, itemId, currentLogoPath }: LogoPickerProps) {
  const [logos, setLogos] = useState<Logo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState<Logo | null>(null);
  
  // Upload new logo state
  const [uploadTab, setUploadTab] = useState<"library" | "upload">("library");
  const [newLogoName, setNewLogoName] = useState("");
  const [newLogoDescription, setNewLogoDescription] = useState("");
  const [uploadedLogoPath, setUploadedLogoPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Fetch logos when dialog opens
  useEffect(() => {
    if (open) {
      fetchLogos();
    }
  }, [open, itemId]);

  const fetchLogos = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/items/${itemId}/logos`);
      if (response.ok) {
        const data = await response.json();
        setLogos(data.logos || []);
      }
    } catch (error) {
      console.error("Failed to fetch logos:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFileUrl = async (logoPath: string, isPublic: boolean) => {
    try {
      const response = await fetch("/api/upload/file-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cloud_storage_path: logoPath, isPublic }),
      });
      if (response.ok) {
        const data = await response.json();
        return data.url;
      }
    } catch (error) {
      console.error("Failed to fetch file URL:", error);
    }
    return null;
  };

  const handleSelectFromLibrary = async (logo: Logo) => {
    setSelectedLogo(logo);
  };

  const handleConfirmSelection = () => {
    if (selectedLogo) {
      onSelect(selectedLogo.logoPath, selectedLogo.logoIsPublic);
      onOpenChange(false);
    }
  };

  const handleUploadNewLogo = async () => {
    if (!uploadedLogoPath || !newLogoName.trim()) {
      alert("Please provide a name and upload a logo file.");
      return;
    }

    setUploading(true);
    try {
      // Create a new logo entry associated with this item
      const response = await fetch("/api/logos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newLogoName.trim(),
          description: newLogoDescription.trim() || null,
          logoPath: uploadedLogoPath,
          logoIsPublic: true, // Logos are typically public for design usage
          itemId: itemId, // Associate with the current item
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Use the newly created logo
        onSelect(data.logoPath, data.logoIsPublic);
        onOpenChange(false);
        // Reset form
        setNewLogoName("");
        setNewLogoDescription("");
        setUploadedLogoPath(null);
      } else {
        const error = await response.json();
        alert(`Failed to create logo: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to upload new logo:", error);
      alert("Failed to upload new logo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select or Upload Logo</DialogTitle>
          <DialogDescription>
            Choose from existing logos or upload a new one for this design layer.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={uploadTab} onValueChange={(v) => setUploadTab(v as "library" | "upload")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="library">
              <ImageIcon className="w-4 h-4 mr-2" />
              Logo Library
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="w-4 h-4 mr-2" />
              Upload New
            </TabsTrigger>
          </TabsList>

          {/* Logo Library Tab */}
          <TabsContent value="library" className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading logos...</div>
            ) : logos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No logos found. Upload a new logo to get started.
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {logos.map((logo) => (
                    <LogoCard
                      key={logo.id}
                      logo={logo}
                      isSelected={selectedLogo?.id === logo.id}
                      isCurrent={currentLogoPath === logo.logoPath}
                      onSelect={() => handleSelectFromLibrary(logo)}
                      fetchFileUrl={fetchFileUrl}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
            
            {selectedLogo && (
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-semibold">{selectedLogo.name}</p>
                  {selectedLogo.description && (
                    <p className="text-sm text-muted-foreground">{selectedLogo.description}</p>
                  )}
                </div>
                <Button onClick={handleConfirmSelection}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Use This Logo
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Upload New Logo Tab */}
          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="logo-name">Logo Name *</Label>
                <Input
                  id="logo-name"
                  value={newLogoName}
                  onChange={(e) => setNewLogoName(e.target.value)}
                  placeholder="Enter logo name"
                />
              </div>

              <div>
                <Label htmlFor="logo-description">Description (Optional)</Label>
                <Textarea
                  id="logo-description"
                  value={newLogoDescription}
                  onChange={(e) => setNewLogoDescription(e.target.value)}
                  placeholder="Add a description for this logo"
                  rows={3}
                />
              </div>

              <div>
                <FileUpload
                  label="Logo File *"
                  accept="image/*"
                  isPublic={true}
                  onUploadComplete={(path) => setUploadedLogoPath(path)}
                />
              </div>

              <Button
                onClick={handleUploadNewLogo}
                disabled={!uploadedLogoPath || !newLogoName.trim() || uploading}
                className="w-full"
              >
                {uploading ? "Uploading..." : "Upload and Use Logo"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

interface LogoCardProps {
  logo: Logo;
  isSelected: boolean;
  isCurrent: boolean;
  onSelect: () => void;
  fetchFileUrl: (path: string, isPublic: boolean) => Promise<string | null>;
}

function LogoCard({ logo, isSelected, isCurrent, onSelect, fetchFileUrl }: LogoCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadImage = async () => {
      setLoading(true);
      const url = await fetchFileUrl(logo.logoPath, logo.logoIsPublic);
      setImageUrl(url);
      setLoading(false);
    };
    loadImage();
  }, [logo.logoPath, logo.logoIsPublic]);

  return (
    <button
      onClick={onSelect}
      className={cn(
        "group relative border-2 rounded-lg p-3 transition-all hover:shadow-md",
        isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
        isCurrent && "ring-2 ring-green-500"
      )}
    >
      {/* Image Preview */}
      <div className="relative aspect-square bg-muted rounded-md overflow-hidden mb-2">
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
            Loading...
          </div>
        ) : imageUrl ? (
          <Image
            src={imageUrl}
            alt={logo.name}
            fill
            className="object-contain p-2"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <ImageIcon className="w-8 h-8" />
          </div>
        )}
        {isSelected && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
        )}
        {isCurrent && (
          <Badge className="absolute top-1 right-1 bg-green-500 text-white text-xs">
            Current
          </Badge>
        )}
      </div>

      {/* Logo Info */}
      <div className="text-left">
        <p className="font-medium text-sm truncate">{logo.name}</p>
        {logo.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{logo.description}</p>
        )}
        
        {/* Association Badges */}
        <div className="flex flex-wrap gap-1 mt-2">
          {logo.school && (
            <Badge variant="outline" className="text-xs">
              <School className="w-3 h-3 mr-1" />
              {logo.school.name}
            </Badge>
          )}
          {logo.team && (
            <Badge variant="outline" className="text-xs">
              <Users className="w-3 h-3 mr-1" />
              {logo.team.name}
            </Badge>
          )}
          {logo.project && (
            <Badge variant="outline" className="text-xs">
              <FolderKanban className="w-3 h-3 mr-1" />
              {logo.project.name}
            </Badge>
          )}
          {logo.item && (
            <Badge variant="outline" className="text-xs">
              <FileImage className="w-3 h-3 mr-1" />
              {logo.item.name}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}
