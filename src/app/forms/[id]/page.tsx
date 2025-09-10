import { notFound } from 'next/navigation'
import { getPublishedFormById } from '@/lib/db/queries'
import { PublicFormRenderer } from '@/components/public-form-renderer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Globe, Calendar, Users } from 'lucide-react'

interface PublicFormPageProps {
  params: {
    id: string
  }
}

export default async function PublicFormPage({ params }: PublicFormPageProps) {
  const { id } = await params
  const form = await getPublishedFormById(id)
  
  if (!form) {
    notFound()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">FC</span>
                </div>
                <span className="text-xl font-bold">FormCraft AI</span>
              </div>
              <div className="h-6 w-px bg-border" />
              <Badge variant="default" className="flex items-center space-x-1">
                <Globe className="w-3 h-3" />
                <span>Public Form</span>
              </Badge>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Powered by FormCraft AI
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Form Header */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{form.name}</CardTitle>
                  {form.schema && typeof form.schema === 'object' && 'description' in form.schema && (
                    <p className="text-muted-foreground">
                      {(form.schema as any).description}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-4 mt-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Published {formatDate(form.createdAt)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>Public Form</span>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Form Content */}
          <Card>
            <CardContent className="p-6">
              <PublicFormRenderer 
                formId={form.id}
                formSchema={form.schema}
              />
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8 text-sm text-muted-foreground">
            <p>
              This form was created with{' '}
              <a
                href="/"
                className="text-primary hover:underline font-medium"
              >
                FormCraft AI
              </a>
              {' '}• Create your own forms with AI
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

// Generate metadata for the page
export async function generateMetadata({ params }: PublicFormPageProps) {
  const { id } = await params
  const form = await getPublishedFormById(id)
  
  if (!form) {
    return {
      title: 'Form Not Found',
      description: 'The requested form could not be found.'
    }
  }

  return {
    title: `${form.name} | FormCraft AI`,
    description: form.schema && typeof form.schema === 'object' && 'description' in form.schema 
      ? (form.schema as any).description 
      : `Fill out the ${form.name} form`,
    robots: 'noindex, nofollow', // Don't index public forms for privacy
  }
}
