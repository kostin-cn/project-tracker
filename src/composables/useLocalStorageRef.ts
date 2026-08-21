import { ref, watch, type Ref } from 'vue'

export function useLocalStorageRef<T extends string>(key: string, defaultValue: T): Ref<T> {
  const storedValue = localStorage.getItem(key) as T | null
  const data = ref<T>(storedValue || defaultValue) as Ref<T>

  watch(data, (newValue) => {
    localStorage.setItem(key, newValue)
  })

  return data
}
