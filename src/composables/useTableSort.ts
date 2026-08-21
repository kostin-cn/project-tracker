import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export interface TableParamsOptions<TSort extends string> {
  defaultSort: TSort
  defaultOrder?: 'asc' | 'desc'
  defaultStatus?: string
  defaultAssignee?: string
}

export function useTableSort<TSort extends string>(options: TableParamsOptions<TSort>) {
  const route = useRoute()
  const router = useRouter()

  const {
    defaultSort,
    defaultOrder = 'asc',
    defaultStatus = 'all',
    defaultAssignee = 'all'
  } = options

  // Ініціалізація з URL з фолбеком на дефолти
  const searchQuery = ref((route.query.search as string) || '')
  const statusFilter = ref((route.query.status as string) || defaultStatus)
  const assigneeFilter = ref((route.query.assignee as string) || defaultAssignee)
  const sortBy = ref<TSort>((route.query.sort as TSort) || defaultSort)
  const sortOrder = ref<'asc' | 'desc'>((route.query.order as 'asc' | 'desc') || defaultOrder)

  // Перемикач напрямку / поля сортування
  function handleSort(field: TSort) {
    if (sortBy.value === field) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortBy.value = field
      sortOrder.value = 'asc'
    }
  }

  // Синхронізація з URL query (очищаємо дефолтні значення з посилання)
  watch(
    () => [searchQuery.value, statusFilter.value, assigneeFilter.value, sortBy.value, sortOrder.value] as const,
    ([search, status, assignee, sort, order]) => {
      const query: Record<string, string> = {}

      if (search.trim()) query.search = search.trim()
      if (status !== defaultStatus) query.status = status
      if (assignee !== defaultAssignee) query.assignee = assignee
      if (sort !== defaultSort) query.sort = sort
      if (order !== defaultOrder) query.order = order

      router.replace({ query })
    }
  )

  return {
    searchQuery,
    statusFilter,
    assigneeFilter,
    sortBy,
    sortOrder,
    handleSort
  }
}
