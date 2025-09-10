'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Star } from 'lucide-react'
import type { FormSchema, FormField } from '@/lib/db/schema'

interface FormPreviewProps {
  formSchema: FormSchema | null
  className?: string
}

interface FormData {
  [key: string]: any
}

export function FormPreview({ formSchema, className = '' }: FormPreviewProps) {
  const [formData, setFormData] = useState<FormData>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!formSchema) {
    return (
      <Card className={`flex items-center justify-center ${className}`}>
        <CardContent className="text-center p-8">
          <div className="text-muted-foreground">
            <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-muted flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">No Form Generated Yet</h3>
            <p className="text-sm">Use the chat interface to describe your form and see a live preview here.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    alert(formSchema.settings?.successMessage || 'Form submitted successfully!')
    setIsSubmitting(false)
    
    // Reset form if multiple submissions not allowed
    if (!formSchema.settings?.allowMultipleSubmissions) {
      setFormData({})
    }
  }

  const renderField = (field: FormField) => {
    const value = formData[field.id] || ''

    switch (field.type) {
      case 'text':
      case 'email':
        return (
          <Input
            type={field.type}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
          />
        )

      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
            rows={4}
          />
        )

      case 'number':
        return (
          <Input
            type="number"
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        )

      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
          />
        )

      case 'file':
        return (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
            <div className="text-muted-foreground">
              📁 File upload field
              <div className="text-xs mt-1">
                {field.fileConfig?.multiple ? 'Multiple files' : 'Single file'} •
                Max {field.fileConfig?.maxSize || 10}MB
                {field.fileConfig?.allowedTypes && field.fileConfig.allowedTypes.length > 0 && (
                  <div>Types: {field.fileConfig.allowedTypes.map(type => type.split('/')[1]).join(', ')}</div>
                )}
              </div>
            </div>
          </div>
        )

      case 'select':
        return (
          <Select value={value} onValueChange={(val) => handleInputChange(field.id, val)}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'radio':
        return (
          <RadioGroup value={value} onValueChange={(val) => handleInputChange(field.id, val)}>
            {field.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                <Label htmlFor={`${field.id}-${option}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        )

      case 'checkbox':
        const checkboxValues = Array.isArray(value) ? value : []
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.id}-${option}`}
                  checked={checkboxValues.includes(option)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleInputChange(field.id, [...checkboxValues, option])
                    } else {
                      handleInputChange(field.id, checkboxValues.filter((v: string) => v !== option))
                    }
                  }}
                />
                <Label htmlFor={`${field.id}-${option}`}>{option}</Label>
              </div>
            ))}
          </div>
        )

      case 'rating':
        const rating = parseInt(value) || 0
        const scale = field.scale || 5
        return (
          <div className="flex space-x-1">
            {Array.from({ length: scale }, (_, i) => i + 1).map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleInputChange(field.id, star)}
                className="focus:outline-none"
              >
                <Star
                  className={`w-6 h-6 ${
                    star <= rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
        )

      default:
        return (
          <Input
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
          />
        )
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{formSchema.title}</CardTitle>
        {formSchema.description && (
          <CardDescription>{formSchema.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {formSchema.fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id} className="text-sm font-medium">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {renderField(field)}
            </div>
          ))}
          
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Submitting...' : (formSchema.settings?.submitButtonText || 'Submit')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
