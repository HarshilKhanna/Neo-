import type { TaskData, TaskRow } from "../types/task"
import type { FilterState } from "../components/FilterPanel"
import type { SortState } from "../components/SortPanel"

export function groupTasksByAttributes(tasks: TaskData[]): TaskRow[] {
  const groupedRows: TaskRow[] = []
  const groupMap: Record<string, TaskRow> = {}

  tasks.forEach((task) => {
    // Create a unique key for this combination of attributes
    const rowKey = `${task.contractId}-${task.category}-${task.domain}-${task.subdomain}-${task.owner}`

    if (!groupMap[rowKey]) {
      const newRow: TaskRow = {
        id: rowKey,
        contractId: task.contractId,
        category: task.category,
        domain: task.domain,
        subdomain: task.subdomain,
        owner: task.owner,
        tasks: [],
        isExpanded: false,
      }
      groupMap[rowKey] = newRow
      groupedRows.push(newRow)
    }

    groupMap[rowKey].tasks.push(task)
  })

  return groupedRows
}

export function toggleRowExpansion(rows: TaskRow[], rowId: string): TaskRow[] {
  return rows.map((row) => {
    if (row.id === rowId) {
      return { ...row, isExpanded: !row.isExpanded }
    }
    return row
  })
}

export function expandAllRows(rows: TaskRow[]): TaskRow[] {
  return rows.map((row) => ({ ...row, isExpanded: true }))
}

export function collapseAllRows(rows: TaskRow[]): TaskRow[] {
  return rows.map((row) => ({ ...row, isExpanded: false }))
}

export function applyTaskFilters(tasks: TaskData[], filterState: FilterState): TaskData[] {
  if (!filterState.filters || Object.keys(filterState.filters).length === 0) {
    return tasks
  }

  return tasks.filter((task) => {
    const filterResults = Object.entries(filterState.filters).map(([field, filter]) => {
      const value = task[field as keyof TaskData]
      const filterValue = filter.value

      if (value === undefined || value === null) {
        // Handle empty checks
        if (filter.operator === "isEmpty") return true
        if (filter.operator === "isNotEmpty") return false
        return false
      }

      const stringValue = String(value).toLowerCase()
      const stringFilterValue = String(filterValue).toLowerCase()

      switch (filter.operator) {
        case "is":
          return stringValue === stringFilterValue
        case "isNot":
          return stringValue !== stringFilterValue
        case "contains":
          return stringValue.includes(stringFilterValue)
        case "isEmpty":
          return stringValue === "" || stringValue === "null" || stringValue === "undefined"
        case "isNotEmpty":
          return stringValue !== "" && stringValue !== "null" && stringValue !== "undefined"
        case "greaterThan":
          return Number(value) > Number(filterValue)
        case "lessThan":
          return Number(value) < Number(filterValue)
        case "greaterThanOrEqual":
          return Number(value) >= Number(filterValue)
        case "lessThanOrEqual":
          return Number(value) <= Number(filterValue)
        default:
          return false
      }
    })

    return filterState.condition === "AND"
      ? filterResults.every((result) => result)
      : filterResults.some((result) => result)
  })
}

export function applySorting(rows: TaskRow[], sortStates: SortState[]): TaskRow[] {
  if (!sortStates || sortStates.length === 0) {
    return rows
  }

  return [...rows].sort((a, b) => {
    for (const sortState of sortStates) {
      const { field, order } = sortState
      const aValue = a[field as keyof TaskRow]
      const bValue = b[field as keyof TaskRow]

      if (aValue === bValue) continue

      let comparison = 0

      // Handle numeric fields
      if (field === "triggeredTasks" || field === "openTasks") {
        comparison = Number(aValue) - Number(bValue)
      } else {
        // Handle string fields
        comparison = String(aValue).localeCompare(String(bValue))
      }

      return order === "asc" ? comparison : -comparison
    }
    return 0
  })
}
