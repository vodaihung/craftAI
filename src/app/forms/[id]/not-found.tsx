import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileX, Home, Search } from 'lucide-react'

export default function FormNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="text-muted-foreground mb-4">
                <FileX className="w-16 h-16 mx-auto" />
              </div>
              <CardTitle className="text-2xl">Form Not Found</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                The form you're looking for doesn't exist or is no longer available. 
                This could happen if:
              </p>
              
              <ul className="text-sm text-muted-foreground text-left space-y-1">
                <li>• The form has been unpublished</li>
                <li>• The form has been deleted</li>
                <li>• The link is incorrect or expired</li>
              </ul>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button asChild className="flex-1">
                  <Link href="/">
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </Link>
                </Button>
                <Button variant="outline" asChild className="flex-1">
                  <Link href="/dashboard">
                    <Search className="w-4 h-4 mr-2" />
                    Browse Forms
                  </Link>
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground pt-4 border-t">
                <p>
                  Need help? Contact the form creator or visit{' '}
                  <Link href="/" className="text-primary hover:underline">
                    FormCraft AI
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
