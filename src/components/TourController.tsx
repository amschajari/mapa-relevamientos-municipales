import { useEffect, useRef, useState } from 'react'
import Shepherd from 'shepherd.js'
import 'shepherd.js/dist/css/shepherd.css'
import { tourSteps, tourOptions } from '@/lib/tourSteps'
import { HelpCircle, X } from 'lucide-react'

interface TourControllerProps {
  onNavigateToLayers?: () => void
  onNavigateToNav?: () => void
  onSelectLuminariasLayer?: () => void
  onCloseLayerPanel?: () => void
}

export const TourController = ({ 
  onNavigateToLayers, 
  onNavigateToNav,
  onSelectLuminariasLayer,
  onCloseLayerPanel
}: TourControllerProps) => {
  const tourRef = useRef<any>(null)
  const [isOpen, setIsOpen] = useState(false)
  const onNavigateToLayersRef = useRef(onNavigateToLayers)
  const onNavigateToNavRef = useRef(onNavigateToNav)
  const onSelectLuminariasLayerRef = useRef(onSelectLuminariasLayer)
  const onCloseLayerPanelRef = useRef(onCloseLayerPanel)

  useEffect(() => {
    onNavigateToLayersRef.current = onNavigateToLayers
  }, [onNavigateToLayers])

  useEffect(() => {
    onNavigateToNavRef.current = onNavigateToNav
  }, [onNavigateToNav])

  useEffect(() => {
    onSelectLuminariasLayerRef.current = onSelectLuminariasLayer
  }, [onSelectLuminariasLayer])

  useEffect(() => {
    onCloseLayerPanelRef.current = onCloseLayerPanel
  }, [onCloseLayerPanel])

  useEffect(() => {
    if (tourRef.current) return

    tourRef.current = new Shepherd.Tour({
      ...tourOptions,
      tourName: 'mapa-relevamiento-tour'
    })
    tourRef.current.addSteps(tourSteps)

    tourRef.current.on('cancel', () => {
      setIsOpen(false)
      if (onCloseLayerPanelRef.current) onCloseLayerPanelRef.current()
    })

    tourRef.current.on('complete', () => {
      setIsOpen(false)
      if (onCloseLayerPanelRef.current) onCloseLayerPanelRef.current()
    })

    tourRef.current.on('show', (e: any) => {
      setIsOpen(true)
      if (e.step?.id === 'layers' && onNavigateToLayersRef.current) {
        onNavigateToLayersRef.current()
      } else if (e.step?.id === 'sidebar' && onNavigateToNavRef.current) {
        onNavigateToNavRef.current()
      } else if (e.step?.id === 'filtros-luminarias' && onSelectLuminariasLayerRef.current) {
        onSelectLuminariasLayerRef.current()
      } else if (e.step?.id === 'leyenda' && onCloseLayerPanelRef.current) {
        onCloseLayerPanelRef.current()
      }
    })

    tourRef.current.on('hide', (e: any) => {
      if (e.step?.id === 'filtros-luminarias' && onCloseLayerPanelRef.current) {
        setTimeout(() => {
          onCloseLayerPanelRef.current?.()
        }, 100)
      }
    })
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