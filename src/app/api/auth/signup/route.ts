import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail, createUserWithPassword } from '@/lib/db/queries'
import { 
  hashPassword,
  createSession, 
  validateEmail, 
  validatePassword,
  validateName,
  AuthError,
  ValidationError 
} from '@/lib/auth'
import { setSessionCookie, createValidationErrorResponse } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, confirmPassword } = body

    // Validate input
    if (!name || !email || !password || !confirmPassword) {
      return createValidationErrorResponse('All fields are required')
    }

    // Validate name
    const nameValidation = validateName(name)
    if (!nameValidation.isValid) {
      return createValidationErrorResponse(nameValidation.message!)
    }

    // Validate email
    if (!validateEmail(email)) {
      return createValidationErrorResponse('Invalid email format')
    }

    // Validate password
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return createValidationErrorResponse(passwordValidation.message!)
    }

    // Check password confirmation
    if (password !== confirmPassword) {
      return createValidationErrorResponse('Passwords do not match')
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email.toLowerCase().trim())
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User already exists with this email' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const newUser = await createUserWithPassword({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    })

    // Create session token
    const sessionToken = await createSession({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      image: newUser.image,
    })

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        image: newUser.image,
      }
    })

    // Set session cookie
    setSessionCookie(response, sessionToken)

    console.log('User signed up successfully:', newUser.email)
    return response

  } catch (error) {
    console.error('Signup error:', error)

    if (error instanceof ValidationError) {
      return createValidationErrorResponse(error.message)
    }

    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    // Handle database constraint errors
    if (error instanceof Error && error.message.includes('unique constraint')) {
      return NextResponse.json(
        { success: false, error: 'User already exists with this email' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred during signup' },
      { status: 500 }
    )
  }
}
