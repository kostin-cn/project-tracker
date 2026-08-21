import { ref, onMounted } from 'vue'

export function useTheme() {
  const isDark = ref<boolean>(false)

  const getInitialTheme = (): boolean => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      return savedTheme === 'dark'
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  const applyTheme = (dark: boolean) => {
    isDark.value = dark
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const initTheme = () => {
    const initial = getInitialTheme()
    applyTheme(initial)
  }

  const toggleTheme = () => {
    const newDark = !isDark.value
    applyTheme(newDark)
    localStorage.setItem('theme', newDark ? 'dark' : 'light')
  }

  onMounted(() => {
    initTheme()
  })

  return {
    isDark,
    toggleTheme
  }
}
