// Production environment validation utilities

interface ProductionValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export function validateProductionEnvironment(): ProductionValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Critical validations
  if (!process.env.JWT_SECRET && !process.env.NEXTAUTH_SECRET) {
    errors.push('JWT_SECRET or NEXTAUTH_SECRET must be set in production')
  }

  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET
  if (secret && secret.length < 32) {
    errors.push('JWT secret must be at least 32 characters long')
  }

  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL must be set in production')
  }

  if (process.env.NODE_ENV !== 'production') {
    warnings.push('NODE_ENV should be set to "production"')
  }

  // Warning validations
  if (!process.env.COOKIE_DOMAIN && process.env.NODE_ENV === 'production') {
    warnings.push('Consider setting COOKIE_DOMAIN for subdomain support')
  }

  if (!process.env.OPENAI_API_KEY) {
    warnings.push('OPENAI_API_KEY not set - AI features will not work')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

export function logProductionValidation(): void {
  if (process.env.NODE_ENV === 'production') {
    const validation = validateProductionEnvironment()
    
    if (!validation.isValid) {
      console.error('PRODUCTION VALIDATION FAILED:', {
        errors: validation.errors,
        warnings: validation.warnings,
        timestamp: new Date().toISOString()
      })
    } else {
      console.log('PRODUCTION VALIDATION PASSED:', {
        warnings: validation.warnings,
        timestamp: new Date().toISOString()
      })
    }
  }
}
