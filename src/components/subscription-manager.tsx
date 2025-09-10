'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertModal, useAlertModal } from '@/components/ui/alert-modal'
import {
  Crown,
  Check,
  X,
  Zap,
  Users,
  BarChart3,
  Shield,
  Sparkles
} from 'lucide-react'

interface SubscriptionTier {
  id: string
  name: string
  price: number
  interval: 'month' | 'year'
  features: {
    maxForms: number | 'unlimited'
    maxResponses: number | 'unlimited'
    aiTroubleshooting: boolean
    analytics: boolean
    customBranding: boolean
    priority: boolean
    webhooks: boolean
  }
  popular?: boolean
}

const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    features: {
      maxForms: 3,
      maxResponses: 100,
      aiTroubleshooting: false,
      analytics: false,
      customBranding: false,
      priority: false,
      webhooks: false
    }
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19,
    interval: 'month',
    popular: true,
    features: {
      maxForms: 'unlimited',
      maxResponses: 'unlimited',
      aiTroubleshooting: true,
      analytics: true,
      customBranding: true,
      priority: true,
      webhooks: true
    }
  }
]

interface SubscriptionManagerProps {
  currentTier?: string
  formsCount?: number
  responsesCount?: number
  onUpgrade?: (tierId: string) => void
  onClose?: () => void
}

export function SubscriptionManager({
  currentTier = 'free',
  formsCount = 0,
  responsesCount = 0,
  onUpgrade,
  onClose
}: SubscriptionManagerProps) {
  const [selectedTier, setSelectedTier] = useState<string>(currentTier)
  const [isProcessing, setIsProcessing] = useState(false)
  const { showAlert, AlertModal: AlertModalComponent } = useAlertModal()

  const currentTierData = SUBSCRIPTION_TIERS.find(tier => tier.id === currentTier)
  const selectedTierData = SUBSCRIPTION_TIERS.find(tier => tier.id === selectedTier)

  const handleUpgrade = async (tierId: string) => {
    if (tierId === currentTier) return

    setIsProcessing(true)
    try {
      // Call API to update subscription tier
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriptionTier: tierId }),
      })

      if (!response.ok) {
        throw new Error('Failed to update subscription')
      }

      const result = await response.json()

      if (onUpgrade) {
        onUpgrade(tierId)
      }

      showAlert('success', 'Upgrade Successful', `Successfully upgraded to ${SUBSCRIPTION_TIERS.find(t => t.id === tierId)?.name}!`)
    } catch (error) {
      console.error('Subscription upgrade error:', error)
      showAlert('error', 'Upgrade Failed', 'Upgrade failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const getUsageStatus = (current: number, limit: number | 'unlimited') => {
    if (limit === 'unlimited') return 'unlimited'
    const percentage = (current / limit) * 100
    if (percentage >= 90) return 'critical'
    if (percentage >= 70) return 'warning'
    return 'normal'
  }

  const formsUsageStatus = getUsageStatus(formsCount, currentTierData?.features.maxForms || 0)
  const responsesUsageStatus = getUsageStatus(responsesCount, currentTierData?.features.maxResponses || 0)

  return (
    <div className="space-y-6">
      {/* Current Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Current Usage</span>
            <Badge variant={currentTier === 'free' ? 'secondary' : 'default'}>
              {currentTierData?.name}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Forms</span>
                <span className={formsUsageStatus === 'critical' ? 'text-red-500' : formsUsageStatus === 'warning' ? 'text-yellow-500' : ''}>
                  {formsCount} / {currentTierData?.features.maxForms === 'unlimited' ? '∞' : currentTierData?.features.maxForms}
                </span>
              </div>
              {currentTierData?.features.maxForms !== 'unlimited' && (
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      formsUsageStatus === 'critical' ? 'bg-red-500' : 
                      formsUsageStatus === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ 
                      width: `${Math.min((formsCount / (currentTierData?.features.maxForms as number)) * 100, 100)}%` 
                    }}
                  />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Responses</span>
                <span className={responsesUsageStatus === 'critical' ? 'text-red-500' : responsesUsageStatus === 'warning' ? 'text-yellow-500' : ''}>
                  {responsesCount} / {currentTierData?.features.maxResponses === 'unlimited' ? '∞' : currentTierData?.features.maxResponses}
                </span>
              </div>
              {currentTierData?.features.maxResponses !== 'unlimited' && (
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      responsesUsageStatus === 'critical' ? 'bg-red-500' : 
                      responsesUsageStatus === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ 
                      width: `${Math.min((responsesCount / (currentTierData?.features.maxResponses as number)) * 100, 100)}%` 
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {(formsUsageStatus === 'critical' || responsesUsageStatus === 'critical') && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                ⚠️ You're approaching your plan limits. Consider upgrading to continue using all features.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription Plans */}
      <div className="grid md:grid-cols-2 gap-6">
        {SUBSCRIPTION_TIERS.map((tier) => (
          <Card 
            key={tier.id} 
            className={`relative transition-all cursor-pointer ${
              selectedTier === tier.id ? 'ring-2 ring-primary' : ''
            } ${tier.popular ? 'border-primary' : ''}`}
            onClick={() => setSelectedTier(tier.id)}
          >
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center space-x-2">
                {tier.id === 'pro' && <Crown className="w-5 h-5 text-yellow-500" />}
                <span>{tier.name}</span>
              </CardTitle>
              <div className="text-3xl font-bold">
                ${tier.price}
                <span className="text-sm font-normal text-muted-foreground">/{tier.interval}</span>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Forms</span>
                  <span className="font-medium">
                    {tier.features.maxForms === 'unlimited' ? 'Unlimited' : tier.features.maxForms}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Responses</span>
                  <span className="font-medium">
                    {tier.features.maxResponses === 'unlimited' ? 'Unlimited' : `${tier.features.maxResponses}/month`}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">AI Troubleshooting</span>
                  {tier.features.aiTroubleshooting ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <X className="w-4 h-4 text-red-500" />
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Advanced Analytics</span>
                  {tier.features.analytics ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <X className="w-4 h-4 text-red-500" />
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Custom Branding</span>
                  {tier.features.customBranding ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <X className="w-4 h-4 text-red-500" />
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Priority Support</span>
                  {tier.features.priority ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <X className="w-4 h-4 text-red-500" />
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Webhooks</span>
                  {tier.features.webhooks ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <X className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
              
              <Button 
                className="w-full" 
                variant={tier.id === currentTier ? 'outline' : 'default'}
                disabled={tier.id === currentTier || isProcessing}
                onClick={(e) => {
                  e.stopPropagation()
                  handleUpgrade(tier.id)
                }}
              >
                {isProcessing && selectedTier === tier.id ? (
                  'Processing...'
                ) : tier.id === currentTier ? (
                  'Current Plan'
                ) : tier.price === 0 ? (
                  'Downgrade'
                ) : (
                  'Upgrade'
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-2">
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      {/* Alert Modal */}
      <AlertModalComponent />
    </div>
  )
}
