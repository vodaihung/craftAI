// Performance monitoring and optimization utilities

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()
  private isEnabled: boolean = process.env.NODE_ENV === 'development'

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  startTimer(label: string): () => void {
    if (!this.isEnabled) return () => {}
    
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime
      
      if (!this.metrics.has(label)) {
        this.metrics.set(label, [])
      }
      
      this.metrics.get(label)!.push(duration)
      
      // Log slow operations (> 100ms)
      if (duration > 100) {
        console.warn(`⚠️ Slow operation detected: ${label} took ${duration.toFixed(2)}ms`)
      }
      
      // Keep only last 100 measurements
      const measurements = this.metrics.get(label)!
      if (measurements.length > 100) {
        measurements.shift()
      }
    }
  }

  getMetrics(label: string): { avg: number; min: number; max: number; count: number } | null {
    if (!this.isEnabled) return null
    
    const measurements = this.metrics.get(label)
    if (!measurements || measurements.length === 0) return null
    
    const avg = measurements.reduce((sum, val) => sum + val, 0) / measurements.length
    const min = Math.min(...measurements)
    const max = Math.max(...measurements)
    
    return { avg, min, max, count: measurements.length }
  }

  getAllMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    if (!this.isEnabled) return {}
    
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {}
    
    for (const [label, measurements] of this.metrics.entries()) {
      if (measurements.length > 0) {
        const avg = measurements.reduce((sum, val) => sum + val, 0) / measurements.length
        const min = Math.min(...measurements)
        const max = Math.max(...measurements)
        result[label] = { avg, min, max, count: measurements.length }
      }
    }
    
    return result
  }

  logSummary(): void {
    if (!this.isEnabled) return
    
    const metrics = this.getAllMetrics()
    if (Object.keys(metrics).length === 0) {
      console.log('📊 No performance metrics collected')
      return
    }
    
    console.group('📊 Performance Metrics Summary')
    for (const [label, stats] of Object.entries(metrics)) {
      console.log(`${label}:`, {
        avg: `${stats.avg.toFixed(2)}ms`,
        min: `${stats.min.toFixed(2)}ms`,
        max: `${stats.max.toFixed(2)}ms`,
        samples: stats.count
      })
    }
    console.groupEnd()
  }

  clear(): void {
    this.metrics.clear()
  }
}

// Debounce utility for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

// Throttle utility for performance optimization
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Memoization utility
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>()
  
  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args)
    
    if (cache.has(key)) {
      return cache.get(key)!
    }
    
    const result = func(...args)
    cache.set(key, result)
    
    // Prevent memory leaks by limiting cache size
    if (cache.size > 1000) {
      const firstKey = cache.keys().next().value
      cache.delete(firstKey)
    }
    
    return result
  }) as T
}

// React hook for performance monitoring
export function usePerformanceMonitor(label: string) {
  const monitor = PerformanceMonitor.getInstance()
  
  return {
    startTimer: () => monitor.startTimer(label),
    getMetrics: () => monitor.getMetrics(label)
  }
}

// Lazy loading utility for components
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) {
  const LazyComponent = React.lazy(importFunc)
  
  return (props: React.ComponentProps<T>) => (
    <React.Suspense fallback={fallback ? React.createElement(fallback) : <div>Loading...</div>}>
      <LazyComponent {...props} />
    </React.Suspense>
  )
}

// Bundle size analyzer (development only)
export function analyzeBundleSize() {
  if (process.env.NODE_ENV !== 'development') return
  
  const scripts = Array.from(document.querySelectorAll('script[src]'))
  const totalSize = scripts.reduce((total, script) => {
    const src = (script as HTMLScriptElement).src
    if (src.includes('/_next/static/')) {
      // Estimate size based on typical Next.js bundle patterns
      return total + 100 // KB estimate
    }
    return total
  }, 0)
  
  console.log(`📦 Estimated bundle size: ~${totalSize}KB`)
  
  // Check for large dependencies
  if (totalSize > 1000) {
    console.warn('⚠️ Large bundle detected. Consider code splitting or removing unused dependencies.')
  }
}

// Memory usage monitoring
export function monitorMemoryUsage() {
  if (process.env.NODE_ENV !== 'development' || !('memory' in performance)) return
  
  const memory = (performance as any).memory
  if (memory) {
    console.log('🧠 Memory Usage:', {
      used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
      total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
      limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
    })
    
    // Warn if memory usage is high
    const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    if (usagePercent > 80) {
      console.warn(`⚠️ High memory usage: ${usagePercent.toFixed(1)}%`)
    }
  }
}

// Initialize performance monitoring in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Log performance metrics every 30 seconds
  setInterval(() => {
    PerformanceMonitor.getInstance().logSummary()
    monitorMemoryUsage()
  }, 30000)
  
  // Analyze bundle size on load
  window.addEventListener('load', () => {
    setTimeout(analyzeBundleSize, 1000)
  })
}
