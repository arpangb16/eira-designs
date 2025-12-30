'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, Trash2, Download, RefreshCw, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface DesignVariant {
  id: string;
  variantName: string;
  status: 'preview' | 'selected' | 'generating' | 'generated';
  previewSvgPath: string | null;
  finalAiPath: string | null;
  errorMessage: string | null;
  createdAt: string;
}

interface VariantGalleryTabProps {
  itemId: string;
  refreshTrigger: number;
}

export default function VariantGalleryTab({ itemId, refreshTrigger }: VariantGalleryTabProps) {
  const [variants, setVariants] = useState<DesignVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set());
  const [generatingFinalFiles, setGeneratingFinalFiles] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<Map<string, string>>(new Map());

  // Fetch variants
  const fetchVariants = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/items/${itemId}/variants`);
      const data = await response.json();

      if (response.ok) {
        setVariants(data.variants || []);
        // Auto-select variants that are already selected
        const alreadySelected = new Set<string>(
          data.variants.filter((v: DesignVariant) => v.status === 'selected').map((v: DesignVariant) => v.id)
        );
        setSelectedVariants(alreadySelected);

        // Fetch preview URLs for all variants
        const urlPromises = data.variants.map(async (variant: DesignVariant) => {
          if (variant.previewSvgPath) {
            try {
              const urlRes = await fetch('/api/upload/file-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  cloud_storage_path: variant.previewSvgPath,
                  isPublic: true,
                }),
              });
              const urlData = await urlRes.json();
              if (urlRes.ok) {
                return [variant.id, urlData.url];
              }
            } catch (error) {
              console.error('Error fetching preview URL:', error);
            }
          }
          return [variant.id, null];
        });

        const urls = await Promise.all(urlPromises);
        setPreviewUrls(new Map(urls.filter(([, url]) => url !== null) as [string, string][]));
      }
    } catch (error) {
      console.error('Error fetching variants:', error);
      toast.error('Failed to load variants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVariants();
  }, [itemId, refreshTrigger]);

  const toggleVariantSelection = async (variantId: string) => {
    const newSelected = new Set(selectedVariants);
    const isCurrentlySelected = newSelected.has(variantId);

    if (isCurrentlySelected) {
      newSelected.delete(variantId);
    } else {
      newSelected.add(variantId);
    }

    setSelectedVariants(newSelected);

    // Update variant status in database
    try {
      await fetch(`/api/items/${itemId}/variants/${variantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: isCurrentlySelected ? 'preview' : 'selected',
        }),
      });
    } catch (error) {
      console.error('Error updating variant:', error);
      toast.error('Failed to update variant selection');
    }
  };

  const handleDeleteAllVariants = async () => {
    try {
      const response = await fetch(`/api/items/${itemId}/variants`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('All variants deleted');
        setVariants([]);
        setSelectedVariants(new Set());
        setPreviewUrls(new Map());
      } else {
        throw new Error('Failed to delete variants');
      }
    } catch (error) {
      console.error('Error deleting variants:', error);
      toast.error('Failed to delete variants');
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    try {
      const response = await fetch(`/api/items/${itemId}/variants/${variantId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Variant deleted');
        setVariants(variants.filter((v) => v.id !== variantId));
        setSelectedVariants((prev) => {
          const newSet = new Set(prev);
          newSet.delete(variantId);
          return newSet;
        });
        setPreviewUrls((prev) => {
          const newMap = new Map(prev);
          newMap.delete(variantId);
          return newMap;
        });
      } else {
        throw new Error('Failed to delete variant');
      }
    } catch (error) {
      console.error('Error deleting variant:', error);
      toast.error('Failed to delete variant');
    }
  };

  const handleSendToBridge = async () => {
    if (selectedVariants.size === 0) {
      toast.error('No variants selected');
      return;
    }

    setGeneratingFinalFiles(true);
    try {
      const response = await fetch('/api/bridge/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantIds: Array.from(selectedVariants),
          priority: 0,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          `${data.created} variant${data.created > 1 ? 's' : ''} queued for processing! ${
            data.skipped > 0 ? `(${data.skipped} already queued)` : ''
          }`
        );
        
        // Refresh variants to show updated status
        await fetchVariants();
      } else {
        throw new Error(data.error || 'Failed to queue variants');
      }
    } catch (error) {
      console.error('Error sending variants to bridge:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to queue variants for processing');
    } finally {
      setGeneratingFinalFiles(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'preview':
        return (
          <Badge variant="outline">
            <Clock className="mr-1 h-3 w-3" />
            Preview
          </Badge>
        );
      case 'selected':
        return (
          <Badge variant="default">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Selected
          </Badge>
        );
      case 'generating':
        return (
          <Badge variant="secondary">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Generating
          </Badge>
        );
      case 'generated':
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Generated
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (variants.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No variants generated yet. Go to the Configuration tab to create your first design variants.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Design Variants</h3>
          <p className="text-sm text-muted-foreground">
            {selectedVariants.size} of {variants.length} selected
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchVariants}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {variants.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete all variants?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {variants.length} variant(s) and their preview files.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAllVariants} className="bg-red-600">
                    Delete All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Variants Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {variants.map((variant, index) => {
          const previewUrl = previewUrls.get(variant.id);
          const isSelected = selectedVariants.has(variant.id);

          return (
            <motion.div
              key={variant.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`relative ${isSelected ? 'ring-2 ring-primary' : ''}`}>
                <CardContent className="p-4">
                  {/* Preview Image */}
                  <div className="relative mb-4 aspect-square overflow-hidden rounded-lg bg-gray-100">
                    {previewUrl ? (
                      <Image
                        src={previewUrl}
                        alt={variant.variantName}
                        fill
                        className="object-contain"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    )}

                    {/* Selection Checkbox */}
                    <div className="absolute left-2 top-2">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleVariantSelection(variant.id)}
                        className="h-5 w-5 bg-white shadow-lg"
                      />
                    </div>

                    {/* Delete Button */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute right-2 top-2 h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete variant?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{variant.variantName}" and its files.
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteVariant(variant.id)}
                            className="bg-red-600"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  {/* Variant Info */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold">{variant.variantName}</h4>
                      {getStatusBadge(variant.status)}
                    </div>

                    {variant.errorMessage && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">{variant.errorMessage}</AlertDescription>
                      </Alert>
                    )}

                    {variant.finalAiPath && (
                      <Button variant="outline" size="sm" className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Download .AI
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Generate Final Files Button */}
      {selectedVariants.size > 0 && (
        <Card className="border-primary/50">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-semibold text-lg mb-2">Ready to Generate Final Files</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedVariants.size} variant{selectedVariants.size > 1 ? 's' : ''} selected. 
                  Click the button to send {selectedVariants.size > 1 ? 'them' : 'it'} to the Adobe Illustrator 
                  bridge for processing into production-ready .AI files.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  <strong>Note:</strong> Make sure your Adobe Illustrator bridge utility is running on your local machine.
                </p>
              </div>
              <Button
                size="lg"
                onClick={handleSendToBridge}
                disabled={generatingFinalFiles}
                className="whitespace-nowrap"
              >
                {generatingFinalFiles ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Queueing...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-5 w-5" />
                    Generate Final Files
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
