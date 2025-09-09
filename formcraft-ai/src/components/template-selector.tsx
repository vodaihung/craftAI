'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Filter, 
  Star, 
  Loader2,
  AlertCircle,
  Sparkles
} from 'lucide-react'
import type { FormSchema } from '@/lib/db/schema'

interface FormTemplate {
  id: string
  name: string
  description: string
  category: string
  icon: string
  schema: FormSchema
  tags: string[]
  popular?: boolean
}

interface TemplateSelectorProps {
  onTemplateSelect: (template: FormTemplate) => void
  className?: string
}

export function TemplateSelector({ onTemplateSelect, className = '' }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<FormTemplate[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showPopularOnly, setShowPopularOnly] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [selectedCategory, showPopularOnly, searchTerm])

  const fetchTemplates = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') params.set('category', selectedCategory)
      if (showPopularOnly) params.set('popular', 'true')
      if (searchTerm) params.set('search', searchTerm)
      
      const response = await fetch(`/api/templates?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setTemplates(result.templates)
        setCategories(result.categories)
      } else {
        setError(result.error || 'Failed to fetch templates')
      }
    } catch (err) {
      setError('Failed to fetch templates')
      console.error('Template fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTemplateSelect = (template: FormTemplate) => {
    onTemplateSelect(template)
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Templates</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchTemplates}>Try Again</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Choose a Template</h2>
        </div>
        <p className="text-muted-foreground">
          Start with a pre-built template or create from scratch
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category and Popular Filter */}
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          <div className="flex items-center space-x-1">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Category:</span>
          </div>
          
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            All
          </Button>
          
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
          
          <Button
            variant={showPopularOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowPopularOnly(!showPopularOnly)}
            className="ml-4"
          >
            <Star className="w-4 h-4 mr-1" />
            Popular
          </Button>
        </div>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Templates Found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card 
              key={template.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleTemplateSelect(template)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{template.icon}</span>
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      {template.popular && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          <Star className="w-3 h-3 mr-1" />
                          Popular
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-3">
                  {template.description}
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{template.schema.fields.length} fields</span>
                    <Badge variant="outline" className="text-xs">
                      {template.category}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {template.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {template.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{template.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create from Scratch Option */}
      <Card className="border-dashed border-2 hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="pt-6 text-center">
          <div className="space-y-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Start from Scratch</h3>
              <p className="text-sm text-muted-foreground">
                Create a custom form using AI assistance
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => onTemplateSelect({
                id: 'blank',
                name: 'Blank Form',
                description: 'Start with a blank form',
                category: 'Custom',
                icon: '✨',
                tags: ['custom', 'blank'],
                schema: {
                  title: 'New Form',
                  description: 'Describe your form and let AI create it for you',
                  fields: [],
                  settings: {
                    submitButtonText: 'Submit',
                    successMessage: 'Thank you for your submission!',
                    allowMultipleSubmissions: true
                  }
                }
              })}
            >
              Start Creating
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
