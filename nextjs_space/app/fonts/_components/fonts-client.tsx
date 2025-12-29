'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Type } from 'lucide-react'

type Font = {
  id: string
  name: string
  fontFamily: string
  category: string
  isSystemFont: boolean
}

export function FontsClient({ fonts }: { fonts: Font[] }) {
  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Font Library</h1>
          <p className="text-gray-600 mt-2">{fonts.length} fonts available</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fonts.map((font) => (
            <Card key={font.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Type className="w-5 h-5 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{font.name}</h3>
                    <p className="text-sm text-gray-600" style={{ fontFamily: font.fontFamily }}>
                      The quick brown fox jumps over the lazy dog
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Badge variant="outline" className="text-xs">{font.category}</Badge>
                      {font.isSystemFont && <Badge className="text-xs">System</Badge>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
