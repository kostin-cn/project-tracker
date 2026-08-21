import { ref, reactive, onUnmounted } from 'vue'

export function useColumnResize<T extends string>(
  initialWidths: Record<T, number>,
  minWidths?: Partial<Record<T, number>>,
  defaultMinWidth = 110
) {
  const colWidths = reactive<Record<T, number>>({ ...initialWidths }) as Record<T, number>
  const activeCol = ref<T | null>(null) as { value: T | null }

  let startX = 0
  let startWidth = 0

  function startResize(col: T, event: MouseEvent) {
    activeCol.value = col
    startX = event.clientX
    startWidth = colWidths[col]

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', stopResize)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  function handleMouseMove(event: MouseEvent) {
    if (!activeCol.value) return
    const deltaX = event.clientX - startX
    const minWidth = minWidths?.[activeCol.value] ?? defaultMinWidth
    colWidths[activeCol.value] = Math.max(minWidth, startWidth + deltaX)
  }

  function stopResize() {
    if (!activeCol.value) return
    activeCol.value = null
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', stopResize)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  onUnmounted(() => {
    stopResize()
  })

  return {
    colWidths,
    activeCol,
    startResize
  }
}
