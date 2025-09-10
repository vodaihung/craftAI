'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Send, Bot, User } from 'lucide-react'
import type { FormSchema } from '@/lib/db/schema'
import { ReactElement } from 'react'

// Component to format chat messages with proper styling
function FormattedMessage({ content }: { content: string }) {
  const formatText = (text: string) => {
    const lines = text.split('\n')
    const elements: ReactElement[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      if (!line) {
        elements.push(<br key={i} />)
        continue
      }

      // Headers (## or ###)
      if (line.startsWith('### ')) {
        elements.push(
          <h4 key={i} className="font-semibold text-sm mt-3 mb-1 first:mt-0">
            {line.substring(4)}
          </h4>
        )
      } else if (line.startsWith('## ')) {
        elements.push(
          <h3 key={i} className="font-semibold text-base mt-4 mb-2 first:mt-0">
            {line.substring(3)}
          </h3>
        )
      }
      // Bullet points (• or -)
      else if (line.startsWith('• ') || line.startsWith('- ')) {
        elements.push(
          <div key={i} className="flex items-start space-x-2 my-1">
            <span className="text-primary mt-0.5">•</span>
            <span className="flex-1">{formatInlineText(line.substring(2))}</span>
          </div>
        )
      }
      // Bold text patterns (**text**)
      else if (line.includes('**')) {
        elements.push(
          <p key={i} className="my-1">
            {formatInlineText(line)}
          </p>
        )
      }
      // Regular paragraphs
      else {
        elements.push(
          <p key={i} className="my-1">
            {formatInlineText(line)}
          </p>
        )
      }
    }

    return elements
  }

  const formatInlineText = (text: string) => {
    // Handle **bold** text
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        )
      }
      return part
    })
  }

  return <div className="text-sm space-y-1">{formatText(content)}</div>
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatInterfaceProps {
  onFormGenerated: (formSchema: FormSchema) => void
  currentFormSchema?: FormSchema | null
  formAnalytics?: {
    responseCount: number
    completionRate: number
    averageTimeToComplete?: number
  } | null
  className?: string
}

export function ChatInterface({ onFormGenerated, currentFormSchema, formAnalytics, className = '' }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m your intelligent form assistant. \nWhat would you like to work on today?',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Detect if user wants form analysis vs generation
  const isAnalysisRequest = (prompt: string): boolean => {
    const analysisKeywords = [
      'analyze', 'analysis', 'why', 'improve', 'optimize', 'better', 'issues', 'problems',
      'suggestions', 'recommendations', 'conversion', 'responses', 'performance',
      'ux', 'user experience', 'feedback', 'review', 'evaluate', 'assessment'
    ]

    const lowerPrompt = prompt.toLowerCase()
    return analysisKeywords.some(keyword => lowerPrompt.includes(keyword)) && currentFormSchema !== null
  }

  // Generate intelligent quick actions based on current form state
  const generateQuickActions = (): string[] => {
    if (!currentFormSchema) {
      // No form exists - suggest form creation
      return [
        "Create a contact form",
        "Create a customer feedback survey",
        "Create an event registration form",
        "Create a job application form"
      ]
    }

    // Check if the last message was an analysis
    const lastMessage = messages[messages.length - 1]
    const wasAnalysis = lastMessage?.content.includes('📊 Form Analysis Results')

    if (wasAnalysis) {
      // Show analysis-specific actions
      return [
        "Fix the critical issues",
        "Implement high priority recommendations",
        "Make the form more mobile-friendly",
        "Reduce form abandonment",
        "Optimize for better conversion",
        "Add missing accessibility features"
      ]
    }

    // Analyze current form and suggest relevant actions
    const existingFields = currentFormSchema.fields.map(field => field.type.toLowerCase())
    const existingFieldIds = currentFormSchema.fields.map(field => field.id.toLowerCase())
    const actions: string[] = []

    // Always include analysis options for existing forms
    actions.push("Analyze my form for UX issues")
    actions.push("Why isn't my form getting responses?")

    // Suggest missing common fields (avoid duplicates)
    if (!existingFields.includes('phone') && !existingFieldIds.some(id => id.includes('phone'))) {
      actions.push("Add a phone number field")
    }

    if (!existingFields.includes('file') && !existingFieldIds.some(id => id.includes('file') || id.includes('upload'))) {
      actions.push("Add file upload field")
    }

    if (!existingFields.includes('date') && !existingFieldIds.some(id => id.includes('date'))) {
      actions.push("Add a date field")
    }

    if (!existingFields.includes('rating') && !existingFieldIds.some(id => id.includes('rating') || id.includes('star'))) {
      actions.push("Add a rating field")
    }

    // Suggest field modifications for existing fields
    const requiredFields = currentFormSchema.fields.filter(field => field.required)
    const optionalFields = currentFormSchema.fields.filter(field => !field.required)

    if (requiredFields.length > 2) {
      // Find a non-essential required field to suggest making optional
      const nonEssentialRequired = requiredFields.find(field =>
        field.type !== 'email' && !field.id.toLowerCase().includes('name')
      )
      if (nonEssentialRequired) {
        actions.push(`Make the ${nonEssentialRequired.label.toLowerCase()} field optional`)
      }
    }

    // Suggest form improvements based on field count
    if (currentFormSchema.fields.length > 6) {
      actions.push("Simplify my form to reduce abandonment")
    } else if (currentFormSchema.fields.length < 3) {
      actions.push("Add more fields to collect better data")
    }

    // Limit to 6 actions to avoid overwhelming the user
    return actions.slice(0, 6)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submitForm()
    }
  }

  const submitForm = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Continue with the existing message processing logic
    await processUserMessage(userMessage)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submitForm()
  }

  const processUserMessage = async (userMessage: Message) => {
    try {
      const isAnalysis = isAnalysisRequest(userMessage.content)

      if (isAnalysis && currentFormSchema) {
        // Handle form analysis
        const response = await fetch('/api/ai/analyze-form', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            formSchema: currentFormSchema,
            context: {
              responseCount: formAnalytics?.responseCount,
              completionRate: formAnalytics?.completionRate,
              averageTimeToComplete: formAnalytics?.averageTimeToComplete,
              userQuestion: userMessage.content
            }
          })
        })

        const result = await response.json()

        if (result.success) {
          const analysis = result.analysis
          let responseContent = `## 📊 Form Analysis Results\n\n`
          responseContent += `**Overall Score: ${analysis.overallScore}/100**\n\n`

          if (analysis.issues.length > 0) {
            responseContent += `### 🚨 Issues Found:\n`
            analysis.issues.forEach((issue: any, index: number) => {
              const emoji = issue.type === 'critical' ? '🔴' : issue.type === 'warning' ? '🟡' : '💡'
              responseContent += `${emoji} **${issue.title}** (${issue.impact} impact)\n`
              responseContent += `${issue.description}\n`
              responseContent += `*Solution:* ${issue.solution}\n\n`
            })
          }

          if (analysis.recommendations.length > 0) {
            responseContent += `### 💡 Recommendations:\n`
            analysis.recommendations.forEach((rec: any) => {
              const priority = rec.priority === 'high' ? '🔥' : rec.priority === 'medium' ? '⚡' : '💫'
              responseContent += `${priority} **${rec.title}**\n`
              responseContent += `${rec.description}\n`
              responseContent += `*Expected Impact:* ${rec.expectedImpact}\n\n`
            })
          }

          responseContent += `### 📝 Summary:\n${analysis.summary}`

          // Add contextual next steps
          responseContent += `\n\n### 🎯 What would you like to do next?\n`
          responseContent += `You can ask me to implement any of the recommendations above, or try:\n`
          responseContent += `• "Fix the critical issues"\n`
          responseContent += `• "Implement the high priority recommendations"\n`
          responseContent += `• "Make the form more mobile-friendly"\n`
          responseContent += `• "Reduce form abandonment"`

          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: responseContent,
            timestamp: new Date()
          }

          setMessages(prev => [...prev, assistantMessage])
        } else {
          throw new Error(result.error)
        }
      } else {
        // Handle form generation/modification
        const response = await fetch('/api/ai/generate-form', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: userMessage.content,
            conversationHistory: messages.map(m => ({
              role: m.role,
              content: m.content
            })),
            currentFormSchema: currentFormSchema
          })
        })

        const result = await response.json()

        if (result.success) {
          // Generate AI-powered response content with suggestions
          let responseContent = ''

          try {
            // Call the analyze-form API to get intelligent suggestions
            const analysisResponse = await fetch('/api/ai/analyze-form', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                formSchema: result.formSchema,
                context: {
                  responseCount: formAnalytics?.responseCount || 0,
                  completionRate: formAnalytics?.completionRate || 0,
                  averageTimeToComplete: formAnalytics?.averageTimeToComplete,
                  userQuestion: userMessage.content,
                  isModification: currentFormSchema !== null,
                  previousFieldCount: currentFormSchema?.fields.length || 0,
                  currentFieldCount: result.formSchema.fields.length
                }
              })
            })

            const analysisResult = await analysisResponse.json()

            if (analysisResult.success && analysisResult.analysis) {
              const analysis = analysisResult.analysis
              const isModification = currentFormSchema !== null
              const fieldCount = result.formSchema.fields.length
              const previousFieldCount = currentFormSchema?.fields.length || 0

              // Create contextual response based on the action performed
              let actionDescription = ''
              if (isModification) {
                if (fieldCount > previousFieldCount) {
                  actionDescription = `Perfect! I've added ${fieldCount - previousFieldCount} new field(s) to your "${result.formSchema.title}". The form now has ${fieldCount} fields.`
                } else if (fieldCount < previousFieldCount) {
                  actionDescription = `Done! I've removed ${previousFieldCount - fieldCount} field(s) from your "${result.formSchema.title}". The form now has ${fieldCount} fields.`
                } else {
                  actionDescription = `Great! I've updated your "${result.formSchema.title}" form with your requested changes.`
                }
              } else {
                actionDescription = `Excellent! I've created a "${result.formSchema.title}" for you with ${fieldCount} fields.`
              }

              // Combine action description with AI suggestions
              responseContent = `${actionDescription}\n\n${analysis.summary}`

              // Add top recommendations if available
              if (analysis.recommendations && analysis.recommendations.length > 0) {
                responseContent += `\n\n**💡 Quick wins:**\n`
                analysis.recommendations.slice(0, 2).forEach((recommendation: { title: string; description: string; priority: string }) => {
                  responseContent += `• ${recommendation.description}\n`
                })
              }

              responseContent += `\nYou can see the updated preview on the right. Would you like me to make any adjustments?`
            } else {
              // Fallback to basic response if analysis fails
              const isModification = currentFormSchema !== null
              const fieldCount = result.formSchema.fields.length
              const previousFieldCount = currentFormSchema?.fields.length || 0

              if (isModification) {
                if (fieldCount > previousFieldCount) {
                  responseContent = `Perfect! I've added the new field(s) to your "${result.formSchema.title}". The form now has ${fieldCount} fields (was ${previousFieldCount}). You can see the updated preview on the right.`
                } else if (fieldCount < previousFieldCount) {
                  responseContent = `Done! I've removed the field(s) from your "${result.formSchema.title}". The form now has ${fieldCount} fields (was ${previousFieldCount}). Check the updated preview on the right.`
                } else {
                  responseContent = `Great! I've updated your "${result.formSchema.title}" form. The form still has ${fieldCount} fields but with your requested changes. See the updated preview on the right.`
                }
              } else {
                responseContent = `Great! I've created a "${result.formSchema.title}" for you. You can see the preview on the right. The form includes ${fieldCount} fields. Would you like me to add, remove, or modify anything?`
              }
            }
          } catch (analysisError) {
            console.error('Failed to get AI analysis:', analysisError)
            // Fallback to basic response if analysis fails
            const isModification = currentFormSchema !== null
            const fieldCount = result.formSchema.fields.length
            const previousFieldCount = currentFormSchema?.fields.length || 0

            if (isModification) {
              if (fieldCount > previousFieldCount) {
                responseContent = `Perfect! I've added the new field(s) to your "${result.formSchema.title}". The form now has ${fieldCount} fields (was ${previousFieldCount}). You can see the updated preview on the right.`
              } else if (fieldCount < previousFieldCount) {
                responseContent = `Done! I've removed the field(s) from your "${result.formSchema.title}". The form now has ${fieldCount} fields (was ${previousFieldCount}). Check the updated preview on the right.`
              } else {
                responseContent = `Great! I've updated your "${result.formSchema.title}" form. The form still has ${fieldCount} fields but with your requested changes. See the updated preview on the right.`
              }
            } else {
              responseContent = `Great! I've created a "${result.formSchema.title}" for you. You can see the preview on the right. The form includes ${fieldCount} fields. Would you like me to add, remove, or modify anything?`
            }
          }

          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: responseContent,
            timestamp: new Date()
          }

          setMessages(prev => [...prev, assistantMessage])
          onFormGenerated(result.formSchema)
        } else {
          throw new Error(result.error)
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I apologize, but I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or rephrase your request.`,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className={`flex flex-col h-full ${className}`}>
      <CardContent className="flex flex-col h-full p-4">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-3 ${
                message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {message.role === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>
              <div className={`flex-1 max-w-[80%] ${
                message.role === 'user' ? 'text-right' : ''
              }`}>
                <div className={`inline-block p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  <FormattedMessage content={message.content} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="inline-block p-3 rounded-lg bg-muted">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Generating your form...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Quick Actions */}
        {!isLoading && (messages.length === 1 || (messages.length > 1 && messages[messages.length - 1].role === 'assistant')) && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">
              {currentFormSchema ? "Suggested improvements:" : "Quick actions:"}
            </p>
            <div className="flex flex-wrap gap-2">
              {generateQuickActions().map((action, index) => (
                <button
                  key={`${currentFormSchema?.id || 'new'}-${index}`}
                  onClick={() => setInput(action)}
                  className="px-3 py-1 text-sm bg-muted hover:bg-muted/80 rounded-full transition-colors"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the form you want to create... (Shift+Enter for new line)"
            disabled={isLoading}
            className="flex-1 min-h-[40px] max-h-[120px] resize-none"
            rows={1}
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
