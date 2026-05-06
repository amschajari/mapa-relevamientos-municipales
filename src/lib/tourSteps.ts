import type { StepOptions } from 'shepherd.js'

export const tourSteps: StepOptions[] = [
  {
    id: 'intro',
    title: '¡Bienvenido!',
    text: 'Esta herramienta te permite gestionar el relevamiento de luminarias municipales. Haz clic en "Siguiente" para un recorrido rápido.',
    attachTo: {
      element: '#sidebar-main',
      on: 'right'
    },
    buttons: [
      {
        classes: 'shepherd-button-secondary',
        text: 'Omitir',
        action() {
          return this.cancel()
        }
      },
      {
        classes: 'shepherd-button-primary',
        text: 'Siguiente',
        action() {
          return this.next()
        }
      }
    ]
  },
  {
    id: 'sidebar',
    title: 'Navegación Principal',
    text: 'Aquí encontrarás todas las secciones: Dashboard, Mapa de relevamiento, Lista de barrios y más. Usa este menú para navegar entre módulos.',
    attachTo: {
      element: '#sidebar-main',
      on: 'right'
    },
    buttons: [
      {
        classes: 'shepherd-button-secondary',
        text: 'Atrás',
        action() {
          return this.back()
        }
      },
      {
        classes: 'shepherd-button-primary',
        text: 'Siguiente',
        action() {
          return this.next()
        }
      }
    ]
  },
  {
    id: 'layers',
    title: 'Control de Capas',
    text: 'Desde aquí podés activar o desactivar las capas del mapa: luminarias, espacios verdes, calles pavimentadas y polígonos de barrios.',
    attachTo: {
      element: '#layers-panel',
      on: 'right'
    },
    beforeShowPromise: function() {
      return new Promise((resolve) => {
        setTimeout(resolve, 300)
      })
    },
    buttons: [
      {
        classes: 'shepherd-button-secondary',
        text: 'Atrás',
        action() {
          return this.back()
        }
      },
      {
        classes: 'shepherd-button-primary',
        text: 'Siguiente',
        action() {
          return this.next()
        }
      }
    ]
  },
  {
    id: 'filtros-luminarias',
    title: 'Filtros de Luminarias',
    text: 'Desde aquí podés filtrar las luminarias por barrio específico y por estado de la base (buena, mala, sin base). Seleccioná una capa de luminarias en el panel de capas para ver estos filtros.',
    attachTo: {
      element: '#luminarias-filters',
      on: 'right'
    },
    beforeShowPromise: function() {
      return new Promise((resolve) => {
        setTimeout(resolve, 500)
      })
    },
    buttons: [
      {
        classes: 'shepherd-button-secondary',
        text: 'Atrás',
        action() {
          return this.back()
        }
      },
      {
        classes: 'shepherd-button-primary',
        text: 'Siguiente',
        action() {
          return this.next()
        }
      }
    ]
  },
  {
    id: 'leyenda',
    title: 'Leyenda del Mapa',
    text: 'Este panel te muestra el significado de los colores: barrios (pendiente, en progreso, completado, pausado) y luminarias (base buena, mala, sin base, sin luz).',
    attachTo: {
      element: '#leyenda-mapa',
      on: 'left'
    },
    beforeShowPromise: function() {
      return new Promise((resolve) => {
        setTimeout(resolve, 300)
      })
    },
    buttons: [
      {
        classes: 'shepherd-button-secondary',
        text: 'Atrás',
        action() {
          return this.back()
        }
      },
      {
        classes: 'shepherd-button-primary',
        text: 'Siguiente',
        action() {
          return this.next()
        }
      }
    ]
  },
  {
    id: 'mapa-barrios',
    title: 'Barrios en el Mapa',
    text: 'Los polígonos de colores representan los barrios. Haz clic en cualquier barrio para ver un tooltip con su nombre, cantidad de luminarias y estado de avance.',
    attachTo: {
      element: '.leaflet-container',
      on: 'bottom'
    },
    buttons: [
      {
        classes: 'shepherd-button-secondary',
        text: 'Atrás',
        action() {
          return this.back()
        }
      },
      {
        classes: 'shepherd-button-primary',
        text: 'Finalizar',
        action() {
          return this.complete()
        }
      }
    ]
  }
]

export const tourOptions = {
  defaultStepOptions: {
    cancelIcon: {
      enabled: true
    },
    scrollTo: true
  },
  useModalOverlay: true
}