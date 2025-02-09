'use client'

import { useState, useEffect } from 'react'
import { Editor, TLStore } from '@tldraw/tldraw'
import { useRouter } from 'next/navigation'
import { ShareDesignForm } from './ShareDesignForm'
import { API_BASE_URL } from '@/lib/utils/config'

interface Design {
  id: string
  title: string
  description: string
  author: string
  content: any
  created_at: string
  tags: string[]
  downloads: number
}

interface DesignMarketplaceProps {
  editor?: Editor
  onClose: () => void
}

export function DesignMarketplace({ editor, onClose }: DesignMarketplaceProps) {
  const [designs, setDesigns] = useState<Design[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [showShareForm, setShowShareForm] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchDesigns()
  }, [selectedTag])

  const fetchDesigns = async () => {
    try {
      setLoading(true)
      const url = selectedTag 
        ? `${API_BASE_URL}/api/designs?tag=${selectedTag}`
        : `${API_BASE_URL}/api/designs`
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch designs')
      const data = await response.json()
      setDesigns(data)
    } catch (err) {
      console.error('Error fetching designs:', err)
      setError(err instanceof Error ? err.message : 'Failed to load designs')
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async (formData: {
    title: string
    description: string
    author: string
    tags: string[]
  }) => {
    if (!editor) return

    try {
      const snapshot = editor.store.getSnapshot()
      const design = {
        ...formData,
        content: snapshot,
        created_at: null,  // Let the backend handle this
        id: null,         // Let the backend generate this
        downloads: 0      // Initialize downloads
      }

      console.log('Sending design data:', design)  // Debug log

      const response = await fetch(`${API_BASE_URL}/api/designs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(design),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Server error:', errorData)
        throw new Error(errorData.detail || 'Failed to share design')
      }
      
      setShowShareForm(false)
      fetchDesigns() // Refresh the list
    } catch (err) {
      console.error('Error sharing design:', err)
      setError(err instanceof Error ? err.message : 'Failed to share design')
    }
  }

  const handleUseDesign = async (design: Design) => {
    if (!editor) return

    try {
      // Increment download count
      await fetch(`${API_BASE_URL}/api/designs/${design.id}/download`, {
        method: 'POST',
      })

      // Load the design into the editor
      editor.store.loadSnapshot(design.content)
      onClose()
    } catch (err) {
      console.error('Error using design:', err)
      setError(err instanceof Error ? err.message : 'Failed to load design')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Design Marketplace</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )} */}

        <div className="flex justify-between mb-6">
          <button
            onClick={() => setShowShareForm(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Share Current Design
          </button>
          
          <div className="flex gap-2">
            {['robot', 'movement', 'speech', 'ai'].map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-3 py-1 rounded ${
                  selectedTag === tag
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {designs.map((design) => (
              <div
                key={design.id}
                className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
              >
                <h3 className="font-bold text-lg mb-2">{design.title}</h3>
                <p className="text-gray-600 mb-2">{design.description}</p>
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <span>By {design.author}</span>
                  <span className="mx-2">•</span>
                  <span>{new Date(design.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {design.tags.map(tag => (
                    <span
                      key={tag}
                      className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {design.downloads} downloads
                  </span>
                  <button
                    onClick={() => handleUseDesign(design)}
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                  >
                    Use Design
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showShareForm && (
        <ShareDesignForm
          onSubmit={handleShare}
          onCancel={() => setShowShareForm(false)}
        />
      )}
    </div>
  )
} 