// Canvas polyfill for lottie-web in headless test environment
// This file must be loaded BEFORE any component imports that use lottie-web
if (typeof window !== 'undefined') {
  const originalCanvas = window.HTMLCanvasElement
  if (!originalCanvas || originalCanvas.name !== 'HTMLCanvasElement') {
    window.HTMLCanvasElement = class {
      constructor() {
        this.width = 0
        this.height = 0
      }
      getContext() {
        return {
          fillStyle: null,
          strokeStyle: null,
          lineWidth: 1,
          fillRect: () => {},
          strokeRect: () => {},
          clearRect: () => {},
          beginPath: () => {},
          closePath: () => {},
          moveTo: () => {},
          lineTo: () => {},
          arc: () => {},
          save: () => {},
          restore: () => {},
          drawImage: () => {},
          scale: () => {},
          translate: () => {},
          rotate: () => {},
          transform: () => {},
          setTransform: () => {},
          createLinearGradient: () => ({ addColorStop: () => {} }),
          createRadialGradient: () => ({ addColorStop: () => {} }),
        }
      }
      toDataURL() {
        return ''
      }
    }
  }
}
