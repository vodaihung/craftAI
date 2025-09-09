'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, AlertCircle, Star, Loader2 } from 'lucide-react'
import { FileUpload } from '@/components/file-upload'
import type { FormSchema } from '@/lib/db/schema'

interface PublicFormRendererProps {
  formId: string
  formSchema: FormSchema
}

interface FormData {
  [key: string]: any
}

export function PublicFormRenderer({ formId, formSchema }: PublicFormRendererProps) {
  const [formData, setFormData] = useState<FormData>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }))
    
    // Clear validation error when user starts typing
    if (validationErrors[fieldId]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldId]
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    formSchema.fields.forEach(field => {
      if (field.required && (!formData[field.id] || formData[field.id] === '')) {
        errors[field.id] = `${field.label} is required`
      }
      
      // Email validation
      if (field.type === 'email' && formData[field.id]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData[field.id])) {
          errors[field.id] = 'Please enter a valid email address'
        }
      }
      
      // Number validation
      if (field.type === 'number' && formData[field.id]) {
        if (isNaN(Number(formData[field.id]))) {
          errors[field.id] = 'Please enter a valid number'
        }
      }
    })
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    setSubmitError(null)
    
    try {
      const response = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId,
          responseData: formData
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setIsSubmitted(true)
      } else {
        setSubmitError(result.error || 'Failed to submit form')
      }
    } catch (error) {
      console.error('Form submission error:', error)
      setSubmitError('Failed to submit form. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderRatingField = (field: any) => {
    const rating = formData[field.id] || 0
    
    return (
      <div className="space-y-2">
        <Label htmlFor={field.id}>{field.label}</Label>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleInputChange(field.id, star)}
              className="p-1 hover:scale-110 transition-transform"
            >
              <Star
                className={`w-6 h-6 ${
                  star <= rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300 hover:text-yellow-400'
                }`}
              />
            </button>
          ))}
        </div>
        {validationErrors[field.id] && (
          <p className="text-sm text-red-500">{validationErrors[field.id]}</p>
        )}
      </div>
    )
  }

  const renderField = (field: any) => {
    const commonProps = {
      id: field.id,
      required: field.required,
    }

    switch (field.type) {
      case 'text':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              {...commonProps}
              type="text"
              placeholder={field.placeholder}
              value={formData[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            />
            {validationErrors[field.id] && (
              <p className="text-sm text-red-500">{validationErrors[field.id]}</p>
            )}
          </div>
        )

      case 'email':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              {...commonProps}
              type="email"
              placeholder={field.placeholder}
              value={formData[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            />
            {validationErrors[field.id] && (
              <p className="text-sm text-red-500">{validationErrors[field.id]}</p>
            )}
          </div>
        )

      case 'textarea':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              {...commonProps}
              placeholder={field.placeholder}
              value={formData[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              rows={4}
            />
            {validationErrors[field.id] && (
              <p className="text-sm text-red-500">{validationErrors[field.id]}</p>
            )}
          </div>
        )

      case 'number':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              {...commonProps}
              type="number"
              placeholder={field.placeholder}
              value={formData[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            />
            {validationErrors[field.id] && (
              <p className="text-sm text-red-500">{validationErrors[field.id]}</p>
            )}
          </div>
        )

      case 'date':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              {...commonProps}
              type="date"
              value={formData[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            />
            {validationErrors[field.id] && (
              <p className="text-sm text-red-500">{validationErrors[field.id]}</p>
            )}
          </div>
        )

      case 'file':
        return (
          <FileUpload
            fieldId={field.id}
            formId={formId}
            label={field.label}
            required={field.required}
            multiple={field.fileConfig?.multiple || false}
            maxSize={field.fileConfig?.maxSize || 10}
            allowedTypes={field.fileConfig?.allowedTypes || []}
            value={formData[field.id] || []}
            onChange={(files) => handleInputChange(field.id, files)}
          />
        )

      case 'select':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={formData[field.id] || ''}
              onValueChange={(value) => handleInputChange(field.id, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationErrors[field.id] && (
              <p className="text-sm text-red-500">{validationErrors[field.id]}</p>
            )}
          </div>
        )

      case 'radio':
        return (
          <div className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <RadioGroup
              value={formData[field.id] || ''}
              onValueChange={(value) => handleInputChange(field.id, value)}
            >
              {field.options?.map((option: string) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                  <Label htmlFor={`${field.id}-${option}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
            {validationErrors[field.id] && (
              <p className="text-sm text-red-500">{validationErrors[field.id]}</p>
            )}
          </div>
        )

      case 'checkbox':
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.id}
                checked={formData[field.id] || false}
                onCheckedChange={(checked) => handleInputChange(field.id, checked)}
              />
              <Label htmlFor={field.id}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            </div>
            {validationErrors[field.id] && (
              <p className="text-sm text-red-500">{validationErrors[field.id]}</p>
            )}
          </div>
        )

      case 'rating':
        return renderRatingField(field)

      default:
        return null
    }
  }

  if (isSubmitted) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <div className="text-green-500 mb-4">
            <CheckCircle className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Thank You!</h3>
          <p className="text-muted-foreground mb-4">
            {formSchema.settings?.successMessage || 'Your form has been submitted successfully.'}
          </p>
          <p className="text-sm text-muted-foreground">
            You can now close this page.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formSchema.fields.map((field) => (
        <div key={field.id}>
          {renderField(field)}
        </div>
      ))}

      {submitError && (
        <div className="flex items-center space-x-2 text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{submitError}</span>
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full" 
        disabled={isSubmitting}
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Submitting...
          </>
        ) : (
          formSchema.settings?.submitButtonText || 'Submit Form'
        )}
      </Button>
    </form>
  )
}
