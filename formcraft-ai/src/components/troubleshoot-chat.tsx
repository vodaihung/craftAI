'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Send, Bot, User, AlertCircle, CheckCircle, Clock } from 'lucide-react'

interface TroubleshootMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  troubleshooting?: {
    diagnosis: string
    suggestions: Array<{
      title: string
      description: string
      priority: 'high' | 'medium' | 'low'
      category: string
    }>
    followUpQuestions: string[]
  }
}

interface TroubleshootChatProps {
  formId: string
  formName: string
  onClose?: () => void
  className?: string
}

export function TroubleshootChat({ formId, formName, onClose, className = '' }: TroubleshootChatProps) {
  const [messages, setMessages] = useState<TroubleshootMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi! I'm here to help you troubleshoot and optimize "${formName}". What issue are you experiencing with your form? For example:\n\n• Low response rates\n• Technical problems\n• User experience issues\n• Form design concerns\n• Analytics questions`,
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: TroubleshootMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/troubleshoot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId,
          issue: userMessage.content,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      const result = await response.json()

      if (result.success) {
        const assistantMessage: TroubleshootMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.troubleshooting.diagnosis,
          timestamp: new Date(),
          troubleshooting: result.troubleshooting
        }

        setMessages(prev => [...prev, assistantMessage])
      } else {
        const errorMessage: TroubleshootMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `I'm sorry, I encountered an error while analyzing your form: ${result.error}. Could you please try rephrasing your question?`,
          timestamp: new Date()
        }

        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      const errorMessage: TroubleshootMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I\'m sorry, there was a technical issue. Please try again in a moment.',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
      console.error('Troubleshoot error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getPriorityIcon = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'medium':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'low':
        return <CheckCircle className="w-4 h-4 text-green-500" />
    }
  }

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
    }
  }

  return (
    <Card className={`flex flex-col h-full ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <span>Troubleshoot with AI</span>
        </CardTitle>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="flex flex-col h-full p-4">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((message) => (
            <div key={message.id} className="space-y-4">
              <div
                className={`flex items-start space-x-3 ${
                  message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-blue-500 text-white'
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
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* Troubleshooting Suggestions */}
              {message.troubleshooting && (
                <div className="ml-11 space-y-4">
                  {/* Suggestions */}
                  {message.troubleshooting.suggestions.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-foreground">💡 Suggestions:</h4>
                      {message.troubleshooting.suggestions.map((suggestion, index) => (
                        <Card key={index} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h5 className="font-medium text-sm">{suggestion.title}</h5>
                              <div className="flex items-center space-x-2">
                                {getPriorityIcon(suggestion.priority)}
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${getPriorityColor(suggestion.priority)}`}
                                >
                                  {suggestion.priority}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {suggestion.description}
                            </p>
                            <Badge variant="secondary" className="text-xs">
                              {suggestion.category}
                            </Badge>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Follow-up Questions */}
                  {message.troubleshooting.followUpQuestions.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-foreground">❓ Follow-up Questions:</h4>
                      <div className="space-y-1">
                        {message.troubleshooting.followUpQuestions.map((question, index) => (
                          <button
                            key={index}
                            onClick={() => setInput(question)}
                            className="block w-full text-left p-2 text-sm text-blue-600 hover:bg-blue-50 rounded border border-blue-200 hover:border-blue-300 transition-colors"
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="inline-block p-3 rounded-lg bg-muted">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Analyzing your form...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe the issue you're experiencing..."
            disabled={isLoading}
            className="flex-1"
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
