'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Copy, 
  Share, 
  Globe, 
  QrCode, 
  Mail, 
  MessageSquare,
  Check,
  ExternalLink
} from 'lucide-react'

interface ShareFormModalProps {
  formId: string
  formName: string
  isPublished: boolean
  onPublishToggle: () => void
  children?: React.ReactNode
}

export function ShareFormModal({ 
  formId, 
  formName, 
  isPublished, 
  onPublishToggle,
  children 
}: ShareFormModalProps) {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)
  
  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/forms/${formId}`
  
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = publicUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Please fill out: ${formName}`)
    const body = encodeURIComponent(`Hi,\n\nI'd like you to fill out this form: ${formName}\n\n${publicUrl}\n\nThanks!`)
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  const handleSocialShare = (platform: string) => {
    const text = encodeURIComponent(`Check out this form: ${formName}`)
    const url = encodeURIComponent(publicUrl)
    
    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`)
        break
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`)
        break
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`)
        break
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5" />
            <span>Share Form</span>
          </DialogTitle>
          <DialogDescription>
            Share "{formName}" with others to collect responses
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Publish Status */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4" />
                  <span className="text-sm font-medium">Public Access</span>
                  <Badge variant={isPublished ? "default" : "secondary"}>
                    {isPublished ? "Published" : "Draft"}
                  </Badge>
                </div>
                <Button
                  variant={isPublished ? "outline" : "default"}
                  size="sm"
                  onClick={onPublishToggle}
                >
                  {isPublished ? "Unpublish" : "Publish"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {isPublished 
                  ? "Your form is live and accepting responses"
                  : "Publish your form to make it accessible to others"
                }
              </p>
            </CardContent>
          </Card>

          {/* Share URL */}
          {isPublished && (
            <>
              <div className="space-y-2">
                <Label htmlFor="share-url">Form URL</Label>
                <div className="flex space-x-2">
                  <Input
                    id="share-url"
                    value={publicUrl}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyUrl}
                    className="px-3"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {copied && (
                  <p className="text-xs text-green-600">URL copied to clipboard!</p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <Label>Quick Share</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEmailShare}
                    className="justify-start"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSocialShare('twitter')}
                    className="justify-start"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Twitter
                  </Button>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(publicUrl, '_blank')}
                  className="w-full justify-start"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Preview Form
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
