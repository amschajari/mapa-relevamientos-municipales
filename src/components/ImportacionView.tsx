import { useState } from 'react'
import { ImportadorDatos } from './ImportadorDatos'
import { ImportadorPoligonos } from './ImportadorPoligonos'
import { MapPin, Hexagon } from 'lucide-react'

export const ImportacionView = () => {
  const [activeTab, setActiveTab] = useState<'puntos' | 'poligonos'>('puntos')

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Tabs Header */}
      <div className="bg-white border-b border-gray-200 px-6 pt-4 shrink-0">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Módulo de Importación</h1>
        <div className="flex gap-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('puntos')}
            className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'puntos'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Luminarias (Puntos)
          </button>
          <button
            onClick={() => setActiveTab('poligonos')}
            className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'poligonos'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Hexagon className="w-4 h-4" />
            Barrios (Polígonos)
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'puntos' && <ImportadorDatos />}
        {activeTab === 'poligonos' && <ImportadorPoligonos />}
      </div>
    </div>
  )
}
