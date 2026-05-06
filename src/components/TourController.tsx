import { useEffect, useRef, useState } from 'react'
import Shepherd from 'shepherd.js'
import 'shepherd.js/dist/css/shepherd.css'
import { tourSteps, tourOptions } from '@/lib/tourSteps'
import { HelpCircle, X } from 'lucide-react'

const TOUR_STORAGE_KEY = 'mapa-relevamiento-tour-completed'

export const TourController = () => {
  const tourRef = useRef<any>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    tourRef.current = new Shepherd.Tour({
      ...tourOptions,
      tourName: 'mapa-relevamiento-tour'
    })
    tourRef.current.addSteps(tourSteps)

    tourRef.current.on('cancel', () => {
      setIsOpen(false)
    })

    tourRef.current.on('complete', () => {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true')
      setIsOpen(false)
    })

    tourRef.current.on('show', () => {
      setIsOpen(true)
    })

    return () => {
      tourRef.current?.cancel()
    }
  }, [])

  useEffect(() => {
    const hasCompleted = localStorage.getItem(TOUR_STORAGE_KEY) === 'true'

    if (!hasCompleted) {
      const timer = setTimeout(() => {
        tourRef.current?.start()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const startTour = () => {
    tourRef.current?.start()
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3">
      {isOpen && (
        <button
          onClick={() => tourRef.current?.cancel()}
          className="bg-white/90 backdrop-blur shadow-lg rounded-full px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2 border border-gray-200"
        >
          <X className="w-4 h-4" />
          Cerrar tour
        </button>
      )}

      {!isOpen && (
        <button
          onClick={startTour}
          className="bg-primary-600 hover:bg-primary-700 text-white shadow-lg rounded-full p-3 transition-all hover:scale-110 flex items-center justify-center"
          title="Iniciar tour interactivo"
        >
          <HelpCircle className="w-6 h-6" />
        </button>
      )}
    </div>
  )
}