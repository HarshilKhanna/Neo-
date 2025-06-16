"use client"

import React from "react"
import { useState, useMemo } from "react"
import type { TaskData, TaskRow } from "../../types/task"
import {
  groupTasksByAttributes,
  toggleRowExpansion,
  expandAllRows,
  collapseAllRows,
  applyTaskFilters,
  applySorting,
} from "../../utils/grouping"
import TaskDetails from "../TaskDetails"
import FilterPanel, { type FilterState } from "../FilterPanel"
import SortPanel, { type SortState } from "../SortPanel"

interface TaskTableProps {
  tasks: TaskData[]
}

const TaskTable: React.FC<TaskTableProps> = ({ tasks }) => {
  const [groupedRows, setGroupedRows] = useState<TaskRow[]>(() => groupTasksByAttributes(tasks))
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const [sortPanelOpen, setSortPanelOpen] = useState(false)
  const [filterState, setFilterState] = useState<FilterState>({ condition: "AND", filters: {} })
  const [sortStates, setSortStates] = useState<SortState[]>([])
  const [filteredTasks, setFilteredTasks] = useState<TaskData[]>(tasks)

  const totalTasks = useMemo(() => filteredTasks.length, [filteredTasks])
  const totalRows = useMemo(() => groupedRows.length, [groupedRows])
  const activeFiltersCount = useMemo(() => Object.keys(filterState.filters).length, [filterState.filters])
  const activeSortsCount = useMemo(() => sortStates.length, [sortStates])

  const handleToggleRow = (rowId: string) => {
    setGroupedRows((prev) => toggleRowExpansion(prev, rowId))
  }

  const handleExpandAll = () => {
    setGroupedRows((prev) => expandAllRows(prev))
  }

  const handleCollapseAll = () => {
    setGroupedRows((prev) => collapseAllRows(prev))
  }

  const handleApplyFilters = (newFilterState: FilterState) => {
    setFilterState(newFilterState)

    // Apply filters to original tasks
    const filtered = applyTaskFilters(tasks, newFilterState)
    setFilteredTasks(filtered)

    // Regroup and apply sorting
    let newRows = groupTasksByAttributes(filtered)
    if (sortStates.length > 0) {
      newRows = applySorting(newRows, sortStates)
    }

    setGroupedRows(newRows)
    setFilterPanelOpen(false)
  }

  const handleApplySort = (newSortStates: SortState[]) => {
    setSortStates(newSortStates)

    // Apply sorting to current grouped rows
    const sortedRows = applySorting(groupedRows, newSortStates)
    setGroupedRows(sortedRows)
    setSortPanelOpen(false)
  }

  return (
    <div
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: "#f9fafb",
          padding: "24px",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "#111827",
                margin: "0 0 8px 0",
              }}
            >
              Task Management Dashboard
            </h1>
            <p
              style={{
                fontSize: "14px",
                color: "#6b7280",
                margin: 0,
              }}
            >
              {totalTasks} tasks across {totalRows} unique combinations
              {activeFiltersCount > 0 && (
                <span style={{ color: "#3b82f6", fontWeight: "500" }}>
                  {" "}
                  • {activeFiltersCount} filter{activeFiltersCount !== 1 ? "s" : ""} active
                </span>
              )}
              {activeSortsCount > 0 && (
                <span style={{ color: "#10b981", fontWeight: "500" }}>
                  {" "}
                  • {activeSortsCount} sort{activeSortsCount !== 1 ? "s" : ""} active
                </span>
              )}
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              onClick={() => setFilterPanelOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                backgroundColor: "white",
                color: "#374151",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                position: "relative",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f9fafb"
                e.currentTarget.style.borderColor = "#9ca3af"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "white"
                e.currentTarget.style.borderColor = "#d1d5db"
              }}
            >
              <span>⚙</span>
              Filter
              {activeFiltersCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-6px",
                    right: "-6px",
                    backgroundColor: "#dc2626",
                    color: "white",
                    borderRadius: "50%",
                    width: "20px",
                    height: "20px",
                    fontSize: "11px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                  }}
                >
                  {activeFiltersCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setSortPanelOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                backgroundColor: "white",
                color: "#374151",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                position: "relative",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f9fafb"
                e.currentTarget.style.borderColor = "#9ca3af"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "white"
                e.currentTarget.style.borderColor = "#d1d5db"
              }}
            >
              <span>↕</span>
              Sort
              {activeSortsCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-6px",
                    right: "-6px",
                    backgroundColor: "#059669",
                    color: "white",
                    borderRadius: "50%",
                    width: "20px",
                    height: "20px",
                    fontSize: "11px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                  }}
                >
                  {activeSortsCount}
                </span>
              )}
            </button>
            <button
              onClick={handleExpandAll}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                backgroundColor: "white",
                color: "#374151",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f9fafb"
                e.currentTarget.style.borderColor = "#9ca3af"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "white"
                e.currentTarget.style.borderColor = "#d1d5db"
              }}
            >
              <span>⊞</span>
              Expand All
            </button>
            <button
              onClick={handleCollapseAll}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                backgroundColor: "white",
                color: "#374151",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f9fafb"
                e.currentTarget.style.borderColor = "#9ca3af"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "white"
                e.currentTarget.style.borderColor = "#d1d5db"
              }}
            >
              <span>⊟</span>
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div
        style={{
          maxHeight: "800px",
          overflowY: "auto",
          overflowX: "auto",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "1000px",
          }}
        >
          <thead
            style={{
              position: "sticky",
              top: 0,
              backgroundColor: "#f9fafb",
              zIndex: 10,
              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
            }}
          >
            <tr>
              <th
                style={{
                  padding: "16px",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "14px",
                  color: "#374151",
                  borderBottom: "1px solid #e5e7eb",
                  width: "40px",
                }}
              ></th>
              <th
                style={{
                  padding: "16px",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "14px",
                  color: "#374151",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                Contract ID
              </th>
              <th
                style={{
                  padding: "16px",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "14px",
                  color: "#374151",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                Category
              </th>
              <th
                style={{
                  padding: "16px",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "14px",
                  color: "#374151",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                Domain
              </th>
              <th
                style={{
                  padding: "16px",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "14px",
                  color: "#374151",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                Subdomain
              </th>
              <th
                style={{
                  padding: "16px",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "14px",
                  color: "#374151",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                Owner
              </th>
              <th
                style={{
                  padding: "16px",
                  textAlign: "center",
                  fontWeight: "600",
                  fontSize: "14px",
                  color: "#374151",
                  borderBottom: "1px solid #e5e7eb",
                  width: "100px",
                }}
              >
                Tasks
              </th>
            </tr>
          </thead>
          <tbody>
            {groupedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: "40px",
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  {activeFiltersCount > 0 ? "No tasks match the current filters" : "No tasks available"}
                </td>
              </tr>
            ) : (
              groupedRows.map((row) => (
                <React.Fragment key={row.id}>
                  <tr
                    style={{
                      backgroundColor: "#ffffff",
                      borderBottom: "1px solid #f3f4f6",
                      cursor: "pointer",
                      transition: "background-color 0.2s ease",
                    }}
                    onClick={() => handleToggleRow(row.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f9fafb"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#ffffff"
                    }}
                  >
                    <td
                      style={{
                        padding: "16px",
                        textAlign: "center",
                        verticalAlign: "middle",
                      }}
                    >
                      <span style={{ fontSize: "16px", color: "#6b7280" }}>{row.isExpanded ? "▼" : "▶"}</span>
                    </td>
                    <td
                      style={{
                        padding: "16px",
                        fontSize: "14px",
                        color: "#111827",
                        fontWeight: "500",
                      }}
                    >
                      {row.contractId}
                    </td>
                    <td
                      style={{
                        padding: "16px",
                        fontSize: "14px",
                        color: "#111827",
                      }}
                    >
                      {row.category}
                    </td>
                    <td
                      style={{
                        padding: "16px",
                        fontSize: "14px",
                        color: "#111827",
                      }}
                    >
                      {row.domain}
                    </td>
                    <td
                      style={{
                        padding: "16px",
                        fontSize: "14px",
                        color: "#111827",
                      }}
                    >
                      {row.subdomain}
                    </td>
                    <td
                      style={{
                        padding: "16px",
                        fontSize: "14px",
                        color: "#111827",
                      }}
                    >
                      {row.owner}
                    </td>
                    <td
                      style={{
                        padding: "16px",
                        textAlign: "center",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#3b82f6",
                      }}
                    >
                      <span
                        style={{
                          backgroundColor: "#dbeafe",
                          padding: "4px 12px",
                          borderRadius: "12px",
                        }}
                      >
                        {row.tasks.length}
                      </span>
                    </td>
                  </tr>
                  {row.isExpanded && (
                    <tr>
                      <td colSpan={7} style={{ backgroundColor: "#f9fafb", padding: "0" }}>
                        <div style={{ padding: "20px 24px" }}>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: "600",
                              color: "#374151",
                              marginBottom: "16px",
                              borderBottom: "1px solid #e5e7eb",
                              paddingBottom: "8px",
                            }}
                          >
                            Task Details ({row.tasks.length} task{row.tasks.length !== 1 ? "s" : ""})
                          </div>
                          {row.tasks.map((task) => (
                            <TaskDetails key={task.taskId} task={task} />
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        isOpen={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
        data={tasks}
        onApplyFilters={handleApplyFilters}
      />

      {/* Sort Panel */}
      <SortPanel isOpen={sortPanelOpen} onClose={() => setSortPanelOpen(false)} onApplySort={handleApplySort} />
    </div>
  )
}

export default TaskTable
