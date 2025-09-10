'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'

export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm'

interface AlertModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
  type: AlertType
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
}

const alertConfig = {
  success: {
    icon: CheckCircle,
    iconColor: 'text-green-600',
    title: 'Success',
  },
  error: {
    icon: XCircle,
    iconColor: 'text-red-600',
    title: 'Error',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-orange-600',
    title: 'Warning',
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-600',
    title: 'Information',
  },
  confirm: {
    icon: AlertTriangle,
    iconColor: 'text-orange-600',
    title: 'Confirm Action',
  },
}

export function AlertModal({
  isOpen,
  onClose,
  onConfirm,
  type,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
}: AlertModalProps) {
  const config = alertConfig[type]
  const Icon = config.icon
  const isConfirmDialog = type === 'confirm'

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Icon className={`w-5 h-5 ${config.iconColor}`} />
            <span>{title || config.title}</span>
          </DialogTitle>
          <DialogDescription className="text-left">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          {isConfirmDialog && (
            <Button variant="outline" onClick={onClose}>
              {cancelText}
            </Button>
          )}
          <Button
            onClick={handleConfirm}
            variant={type === 'error' ? 'destructive' : 'default'}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook for easier usage
export function useAlertModal() {
  const [alertState, setAlertState] = useState<{
    isOpen: boolean
    type: AlertType
    title?: string
    message: string
    onConfirm?: () => void
    confirmText?: string
    cancelText?: string
  }>({
    isOpen: false,
    type: 'info',
    message: '',
  })

  const showAlert = (
    type: AlertType,
    message: string,
    options?: {
      title?: string
      onConfirm?: () => void
      confirmText?: string
      cancelText?: string
    }
  ) => {
    setAlertState({
      isOpen: true,
      type,
      message,
      title: options?.title,
      onConfirm: options?.onConfirm,
      confirmText: options?.confirmText,
      cancelText: options?.cancelText,
    })
  }

  const closeAlert = () => {
    setAlertState(prev => ({ ...prev, isOpen: false }))
  }

  const AlertModalComponent = () => (
    <AlertModal
      isOpen={alertState.isOpen}
      onClose={closeAlert}
      onConfirm={alertState.onConfirm}
      type={alertState.type}
      title={alertState.title}
      message={alertState.message}
      confirmText={alertState.confirmText}
      cancelText={alertState.cancelText}
    />
  )

  return {
    showAlert,
    closeAlert,
    AlertModal: AlertModalComponent,
  }
}
