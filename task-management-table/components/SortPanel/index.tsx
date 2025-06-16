"use client"

import type React from "react"
import { useState, useRef } from "react"

interface SortPanelProps {
  isOpen: boolean
  onClose: () => void
  onApplySort: (sortState: SortState[]) => void
}

export interface SortState {
  field: string
  order: "asc" | "desc"
}

interface DragState {
  isDragging: boolean
  dragIndex: number | null
  dragOverIndex: number | null
}

const FIELD_OPTIONS = [
  { label: "Task ID", value: "taskId", isNumeric: true },
  { label: "Contract ID", value: "contractId", isNumeric: false },
  { label: "Obligation Title", value: "obligationTitle", isNumeric: false },
  { label: "Category", value: "category", isNumeric: false },
  { label: "Domain", value: "domain", isNumeric: false },
  { label: "Subdomain", value: "subdomain", isNumeric: false },
  { label: "Criticality", value: "criticality", isNumeric: false },
  { label: "Owner", value: "owner", isNumeric: false },
  { label: "Triggered Tasks", value: "triggeredTasks", isNumeric: true },
  { label: "Open Tasks", value: "openTasks", isNumeric: true },
  { label: "Compliance", value: "compliance", isNumeric: false },
]

const SortPanel: React.FC<SortPanelProps> = ({ isOpen, onClose, onApplySort }) => {
  const [sortRules, setSortRules] = useState<SortState[]>([{ field: "", order: "asc" }])
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragIndex: null,
    dragOverIndex: null,
  })

  const dragItemRef = useRef<HTMLDivElement>(null)

  const handleAddSort = () => {
    setSortRules([...sortRules, { field: "", order: "asc" }])
  }

  const handleRemoveSort = (index: number) => {
    if (sortRules.length === 1) {
      setSortRules([{ field: "", order: "asc" }])
    } else {
      const newRules = sortRules.filter((_, i) => i !== index)
      setSortRules(newRules)
    }
  }

  const handleSortChange = (index: number, field: string, value: any) => {
    const newRules = [...sortRules]
    newRules[index] = { ...newRules[index], [field]: value }
    setSortRules(newRules)
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragState({
      isDragging: true,
      dragIndex: index,
      dragOverIndex: null,
    })
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/html", "")
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragState((prev) => ({
      ...prev,
      dragOverIndex: index,
    }))
  }

  const handleDragLeave = () => {
    setDragState((prev) => ({
      ...prev,
      dragOverIndex: null,
    }))
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    const { dragIndex } = dragState

    if (dragIndex !== null && dragIndex !== dropIndex) {
      const newRules = [...sortRules]
      const draggedItem = newRules[dragIndex]
      newRules.splice(dragIndex, 1)
      newRules.splice(dropIndex, 0, draggedItem)
      setSortRules(newRules)
    }

    setDragState({
      isDragging: false,
      dragIndex: null,
      dragOverIndex: null,
    })
  }

  const handleDragEnd = () => {
    setDragState({
      isDragging: false,
      dragIndex: null,
      dragOverIndex: null,
    })
  }

  const handleApplySort = () => {
    const validRules = sortRules.filter((rule) => rule.field)
    onApplySort(validRules)
    onClose()
  }

  const isNumericField = (fieldValue: string) => {
    const field = FIELD_OPTIONS.find((option) => option.value === fieldValue)
    return field?.isNumeric || false
  }

  const handleClearAll = () => {
    setSortRules([{ field: "", order: "asc" }])
  }

  if (!isOpen) return null

  const hasValidRules = sortRules.some((rule) => rule.field)

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 999,
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          padding: "24px",
          width: "90%",
          maxWidth: "600px",
          maxHeight: "80vh",
          overflow: "auto",
          zIndex: 1000,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            borderBottom: "1px solid #e5e7eb",
            paddingBottom: "16px",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "600", color: "#111827" }}>Sort Tasks</h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              padding: "4px",
              color: "#6b7280",
              borderRadius: "4px",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f3f4f6"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent"
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginBottom: "24px",
            minHeight: "100px",
          }}
        >
          {sortRules.map((rule, index) => (
            <div
              key={index}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              style={{
                background:
                  dragState.dragIndex === index ? "#f3f4f6" : dragState.dragOverIndex === index ? "#e5e7eb" : "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "16px",
                transition: "all 0.2s ease",
                boxShadow: dragState.dragIndex === index ? "0 4px 8px rgba(0,0,0,0.1)" : "none",
                cursor: "move",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr 1fr auto",
                  gap: "12px",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    cursor: "grab",
                    color: "#9ca3af",
                    padding: "8px",
                    borderRadius: "4px",
                    background: "#f3f4f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: "bold",
                    minWidth: "32px",
                    height: "32px",
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.cursor = "grabbing"
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.cursor = "grab"
                  }}
                >
                  ≡
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#6b7280",
                      marginBottom: "4px",
                    }}
                  >
                    Field
                  </label>
                  <select
                    value={rule.field}
                    onChange={(e) => handleSortChange(index, "field", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      backgroundColor: "white",
                      outline: "none",
                    }}
                  >
                    <option value="">Select field</option>
                    {FIELD_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#6b7280",
                      marginBottom: "4px",
                    }}
                  >
                    Order
                  </label>
                  <select
                    value={rule.order}
                    onChange={(e) => handleSortChange(index, "order", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      backgroundColor: "white",
                      outline: "none",
                    }}
                  >
                    {isNumericField(rule.field) ? (
                      <>
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                      </>
                    ) : (
                      <>
                        <option value="asc">A to Z</option>
                        <option value="desc">Z to A</option>
                      </>
                    )}
                  </select>
                </div>

                <button
                  onClick={() => handleRemoveSort(index)}
                  disabled={sortRules.length === 1}
                  style={{
                    padding: "8px",
                    border: "none",
                    borderRadius: "6px",
                    backgroundColor: sortRules.length === 1 ? "#f3f4f6" : "#fee2e2",
                    color: sortRules.length === 1 ? "#9ca3af" : "#dc2626",
                    cursor: sortRules.length === 1 ? "not-allowed" : "pointer",
                    fontSize: "16px",
                    width: "36px",
                    height: "36px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title="Remove sort"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            borderTop: "1px solid #e5e7eb",
            paddingTop: "20px",
          }}
        >
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleAddSort}
              style={{
                padding: "10px 16px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                background: "white",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
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
              + Add Sort
            </button>
            <button
              onClick={handleClearAll}
              style={{
                padding: "10px 16px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                background: "white",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
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
              Clear All
            </button>
          </div>
          <button
            onClick={handleApplySort}
            disabled={!hasValidRules}
            style={{
              padding: "10px 24px",
              border: "none",
              borderRadius: "6px",
              background: hasValidRules ? "#10b981" : "#e5e7eb",
              color: hasValidRules ? "white" : "#9ca3af",
              cursor: hasValidRules ? "pointer" : "not-allowed",
              fontSize: "14px",
              fontWeight: "600",
              transition: "background-color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (hasValidRules) {
                e.currentTarget.style.backgroundColor = "#059669"
              }
            }}
            onMouseLeave={(e) => {
              if (hasValidRules) {
                e.currentTarget.style.backgroundColor = "#10b981"
              }
            }}
          >
            Apply Sort
          </button>
        </div>
      </div>
    </>
  )
}

export default SortPanel
