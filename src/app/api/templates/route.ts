import { NextRequest, NextResponse } from 'next/server'
import type { FormSchema } from '@/lib/db/schema'

interface FormTemplate {
  id: string
  name: string
  description: string
  category: string
  icon: string
  schema: FormSchema
  tags: string[]
  popular?: boolean
}

const templates: FormTemplate[] = [
  {
    id: 'contact-form',
    name: 'Contact Form',
    description: 'A simple contact form with name, email, subject, and message fields',
    category: 'Business',
    icon: '📧',
    tags: ['contact', 'business', 'communication'],
    popular: true,
    schema: {
      title: 'Contact Us',
      description: 'Get in touch with us',
      fields: [
        {
          id: 'name',
          type: 'text',
          label: 'Full Name',
          required: true,
          placeholder: 'Enter your full name'
        },
        {
          id: 'email',
          type: 'email',
          label: 'Email Address',
          required: true,
          placeholder: 'Enter your email address'
        },
        {
          id: 'subject',
          type: 'text',
          label: 'Subject',
          required: true,
          placeholder: 'What is this about?'
        },
        {
          id: 'message',
          type: 'textarea',
          label: 'Message',
          required: true,
          placeholder: 'Enter your message here...'
        },
        {
          id: 'attachment',
          type: 'file',
          label: 'Attachment (Optional)',
          required: false,
          fileConfig: {
            maxSize: 50,
            allowedTypes: [], // Allow all file types
            multiple: true
          }
        }
      ],
      settings: {
        submitButtonText: 'Send Message',
        successMessage: 'Thank you for your message! We\'ll get back to you soon.',
        allowMultipleSubmissions: true
      }
    }
  },
  {
    id: 'feedback-survey',
    name: 'Customer Feedback Survey',
    description: 'Collect customer feedback with ratings and comments',
    category: 'Survey',
    icon: '⭐',
    tags: ['feedback', 'survey', 'rating', 'customer'],
    popular: true,
    schema: {
      title: 'Customer Feedback Survey',
      description: 'Help us improve by sharing your feedback',
      fields: [
        {
          id: 'overall_rating',
          type: 'rating',
          label: 'Overall Experience',
          required: true,
          scale: 5
        },
        {
          id: 'service_quality',
          type: 'radio',
          label: 'How would you rate our service quality?',
          required: true,
          options: ['Excellent', 'Good', 'Average', 'Poor']
        },
        {
          id: 'recommend',
          type: 'radio',
          label: 'Would you recommend us to others?',
          required: true,
          options: ['Definitely', 'Probably', 'Not sure', 'Probably not', 'Definitely not']
        },
        {
          id: 'improvements',
          type: 'checkbox',
          label: 'What areas need improvement?',
          required: false,
          options: ['Customer Service', 'Product Quality', 'Pricing', 'Website', 'Delivery', 'Other']
        },
        {
          id: 'comments',
          type: 'textarea',
          label: 'Additional Comments',
          required: false,
          placeholder: 'Share any additional thoughts...'
        }
      ],
      settings: {
        submitButtonText: 'Submit Feedback',
        successMessage: 'Thank you for your valuable feedback!',
        allowMultipleSubmissions: false
      }
    }
  },
  {
    id: 'event-registration',
    name: 'Event Registration',
    description: 'Register attendees for events with personal details and preferences',
    category: 'Events',
    icon: '🎟️',
    tags: ['event', 'registration', 'attendee'],
    schema: {
      title: 'Event Registration',
      description: 'Register for our upcoming event',
      fields: [
        {
          id: 'first_name',
          type: 'text',
          label: 'First Name',
          required: true,
          placeholder: 'Enter your first name'
        },
        {
          id: 'last_name',
          type: 'text',
          label: 'Last Name',
          required: true,
          placeholder: 'Enter your last name'
        },
        {
          id: 'email',
          type: 'email',
          label: 'Email Address',
          required: true,
          placeholder: 'Enter your email'
        },
        {
          id: 'company',
          type: 'text',
          label: 'Company/Organization',
          required: false,
          placeholder: 'Enter your company name'
        },
        {
          id: 'ticket_type',
          type: 'select',
          label: 'Ticket Type',
          required: true,
          options: ['General Admission', 'VIP', 'Student', 'Group']
        },
        {
          id: 'dietary_restrictions',
          type: 'checkbox',
          label: 'Dietary Restrictions',
          required: false,
          options: ['Vegetarian', 'Vegan', 'Gluten-free', 'Nut allergy', 'Other']
        },
        {
          id: 'special_requests',
          type: 'textarea',
          label: 'Special Requests',
          required: false,
          placeholder: 'Any special accommodations needed?'
        }
      ],
      settings: {
        submitButtonText: 'Register Now',
        successMessage: 'Registration successful! Check your email for confirmation.',
        allowMultipleSubmissions: false
      }
    }
  },
  {
    id: 'job-application',
    name: 'Job Application Form',
    description: 'Collect job applications with resume upload and screening questions',
    category: 'HR',
    icon: '💼',
    tags: ['job', 'application', 'hr', 'recruitment'],
    schema: {
      title: 'Job Application',
      description: 'Apply for a position at our company',
      fields: [
        {
          id: 'full_name',
          type: 'text',
          label: 'Full Name',
          required: true,
          placeholder: 'Enter your full name'
        },
        {
          id: 'email',
          type: 'email',
          label: 'Email Address',
          required: true,
          placeholder: 'Enter your email'
        },
        {
          id: 'phone',
          type: 'text',
          label: 'Phone Number',
          required: true,
          placeholder: 'Enter your phone number'
        },
        {
          id: 'position',
          type: 'select',
          label: 'Position Applied For',
          required: true,
          options: ['Software Engineer', 'Product Manager', 'Designer', 'Marketing Specialist', 'Sales Representative']
        },
        {
          id: 'experience',
          type: 'radio',
          label: 'Years of Experience',
          required: true,
          options: ['0-1 years', '2-5 years', '6-10 years', '10+ years']
        },
        {
          id: 'resume',
          type: 'file',
          label: 'Resume/CV',
          required: true,
          fileConfig: {
            maxSize: 50,
            allowedTypes: [], // Allow all file types - users can upload any format
            multiple: true
          }
        },
        {
          id: 'cover_letter',
          type: 'textarea',
          label: 'Cover Letter',
          required: false,
          placeholder: 'Tell us why you\'re interested in this position...'
        }
      ],
      settings: {
        submitButtonText: 'Submit Application',
        successMessage: 'Application submitted successfully! We\'ll review it and get back to you.',
        allowMultipleSubmissions: false
      }
    }
  },
  {
    id: 'newsletter-signup',
    name: 'Newsletter Signup',
    description: 'Simple newsletter subscription form with preferences',
    category: 'Marketing',
    icon: '📰',
    tags: ['newsletter', 'subscription', 'marketing'],
    popular: true,
    schema: {
      title: 'Subscribe to Our Newsletter',
      description: 'Stay updated with our latest news and updates',
      fields: [
        {
          id: 'email',
          type: 'email',
          label: 'Email Address',
          required: true,
          placeholder: 'Enter your email address'
        },
        {
          id: 'name',
          type: 'text',
          label: 'First Name',
          required: false,
          placeholder: 'Enter your first name'
        },
        {
          id: 'interests',
          type: 'checkbox',
          label: 'What are you interested in?',
          required: false,
          options: ['Product Updates', 'Industry News', 'Tips & Tutorials', 'Company News', 'Special Offers']
        },
        {
          id: 'frequency',
          type: 'radio',
          label: 'How often would you like to hear from us?',
          required: true,
          options: ['Daily', 'Weekly', 'Monthly', 'Only important updates']
        }
      ],
      settings: {
        submitButtonText: 'Subscribe',
        successMessage: 'Thank you for subscribing! Check your email to confirm your subscription.',
        allowMultipleSubmissions: false
      }
    }
  }
]

// GET /api/templates - Get all form templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const popular = searchParams.get('popular') === 'true'
    const search = searchParams.get('search')?.toLowerCase()

    let filteredTemplates = templates

    // Filter by category
    if (category && category !== 'all') {
      filteredTemplates = filteredTemplates.filter(template => 
        template.category.toLowerCase() === category.toLowerCase()
      )
    }

    // Filter by popular
    if (popular) {
      filteredTemplates = filteredTemplates.filter(template => template.popular)
    }

    // Filter by search
    if (search) {
      filteredTemplates = filteredTemplates.filter(template =>
        template.name.toLowerCase().includes(search) ||
        template.description.toLowerCase().includes(search) ||
        template.tags.some(tag => tag.toLowerCase().includes(search))
      )
    }

    return NextResponse.json({
      success: true,
      templates: filteredTemplates,
      categories: [...new Set(templates.map(t => t.category))],
      total: filteredTemplates.length
    })

  } catch (error) {
    console.error('❌ Failed to fetch templates:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch templates',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
