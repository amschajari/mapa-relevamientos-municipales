export const tourSteps = [
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
        type: 'cancel'
      },
      {
        classes: 'shepherd-button-primary',
        text: 'Siguiente',
        type: 'next'
      }
    ]
  },
  {
    id: 'sidebar',
    title: 'Navegación Principal',
    text: 'Aquí encontraras todas las secciones: Dashboard, Mapa de relevamiento, Lista de barrios y más. Usa este menu para navegar entre modulos.',
    attachTo: {
      element: '#sidebar-main',
      on: 'right'
    },
    buttons: [
      {
        classes: 'shepherd-button-secondary',
        text: 'Atrás',
        type: 'back'
      },
      {
        classes: 'shepherd-button-primary',
        text: 'Siguiente',
        type: 'next'
      }
    ]
  },
  {
    id: 'layers',
    title: 'Control de Capas',
    text: 'Desde aqui podes activar o desactivar las capas del mapa: luminarias, espacios verdes, calles pavimentadas y polígonos de barrios.',
    attachTo: {
      element: '#layers-panel',
      on: 'right'
    },
    buttons: [
      {
        classes: 'shepherd-button-secondary',
        text: 'Atrás',
        type: 'back'
      },
      {
        classes: 'shepherd-button-primary',
        text: 'Siguiente',
        type: 'next'
      }
    ]
  },
  {
    id: 'leyenda',
    title: 'Leyenda del Mapa',
    text: 'Esta panel te muestra el significado de los colores: barrios (pendiente, en progreso, completado, pausado) y luminarias (base buena, mala, sin base, sin luz).',
    attachTo: {
      element: '#leyenda-mapa',
      on: 'left'
    },
    buttons: [
      {
        classes: 'shepherd-button-secondary',
        text: 'Atrás',
        type: 'back'
      },
      {
        classes: 'shepherd-button-primary',
        text: 'Siguiente',
        type: 'next'
      }
    ]
  },
  {
    id: 'mapa-barrios',
    title: 'Barrios en el Mapa',
    text: 'Los polígonos de colores representan los barrios. Haz click en cualquier barrio para ver un tooltip con su nombre, cantidad de luminarias y estado de avance.',
    attachTo: {
      element: '.leaflet-container',
      on: 'center'
    },
    buttons: [
      {
        classes: 'shepherd-button-secondary',
        text: 'Atrás',
        type: 'back'
      },
      {
        classes: 'shepherd-button-primary',
        text: 'Finalizar',
        type: 'next'
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