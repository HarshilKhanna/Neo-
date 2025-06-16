"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"

interface FilterPanelProps {
  data: any[]
  onApplyFilters: (filters: FilterState) => void
  onClose: () => void
  isOpen: boolean
}

interface FilterState {
  condition: "AND" | "OR"
  filters: {
    [key: string]: {
      operator: string
      value: string | string[]
    }
  }
}

interface FilterRow {
  field: string
  operator: string
  value: string | string[]
}

interface AutocompleteInputProps {
  value: string
  onChange: (value: string) => void
  suggestions: string[]
  placeholder?: string
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({ value, onChange, suggestions, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (value.length > 0) {
      const filtered = suggestions
        .filter((suggestion) => suggestion.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 10)
      setFilteredSuggestions(filtered)
    } else {
      setFilteredSuggestions([])
    }
    setActiveIndex(-1)
  }, [value, suggestions])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    setIsOpen(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredSuggestions.length === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setActiveIndex((prev) => (prev < filteredSuggestions.length - 1 ? prev + 1 : prev))
        break
      case "ArrowUp":
        e.preventDefault()
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case "Enter":
        e.preventDefault()
        if (activeIndex >= 0) {
          handleSuggestionClick(filteredSuggestions[activeIndex])
        }
        break
      case "Escape":
        setIsOpen(false)
        setActiveIndex(-1)
        break
      default:
        break
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion)
    setIsOpen(false)
    setActiveIndex(-1)
    inputRef.current?.focus()
  }

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => value.length > 0 && setIsOpen(true)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "8px 12px",
          border: "1px solid #d1d5db",
          borderRadius: "6px",
          fontSize: "14px",
          outline: "none",
          transition: "border-color 0.2s ease",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "#3b82f6"
          if (value.length > 0) setIsOpen(true)
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#d1d5db"
        }}
      />
      {isOpen && filteredSuggestions.length > 0 && (
        <ul
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            backgroundColor: "white",
            border: "1px solid #d1d5db",
            borderTop: "none",
            borderRadius: "0 0 6px 6px",
            maxHeight: "200px",
            overflowY: "auto",
            zIndex: 1000,
            margin: 0,
            padding: 0,
            listStyle: "none",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          }}
        >
          {filteredSuggestions.map((suggestion, index) => (
            <li
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                backgroundColor: index === activeIndex ? "#f3f4f6" : "white",
                borderBottom: index < filteredSuggestions.length - 1 ? "1px solid #f3f4f6" : "none",
                fontSize: "14px",
              }}
              onMouseEnter={() => setActiveIndex(index)}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const FilterPanel: React.FC<FilterPanelProps> = ({ data, onApplyFilters, onClose, isOpen }) => {
  const [filters, setFilters] = useState<FilterRow[]>([{ field: "", operator: "is", value: "" }])
  const [condition, setCondition] = useState<"AND" | "OR">("AND")

  const getUniqueValues = (field: string) => {
    return [...new Set(data.map((item) => item[field]))].filter(Boolean).map(String)
  }

  const FIELD_OPTIONS = [
    { label: "Task ID", value: "taskId" },
    { label: "Contract ID", value: "contractId" },
    { label: "Obligation Title", value: "obligationTitle" },
    { label: "Category", value: "category" },
    { label: "Domain", value: "domain" },
    { label: "Subdomain", value: "subdomain" },
    { label: "Criticality", value: "criticality" },
    { label: "Owner", value: "owner" },
    { label: "Triggered Tasks", value: "triggeredTasks" },
    { label: "Open Tasks", value: "openTasks" },
    { label: "Compliance", value: "compliance" },
  ]

  const isNumericField = (field: string) => {
    return field === "triggeredTasks" || field === "openTasks"
  }

  const getOperatorOptions = (field: string) => {
    if (isNumericField(field)) {
      return [
        { label: "equals", value: "is" },
        { label: "greater than", value: "greaterThan" },
        { label: "less than", value: "lessThan" },
        { label: "greater than or equal", value: "greaterThanOrEqual" },
        { label: "less than or equal", value: "lessThanOrEqual" },
      ]
    } else {
      return [
        { label: "is", value: "is" },
        { label: "is not", value: "isNot" },
        { label: "contains", value: "contains" },
        { label: "is empty", value: "isEmpty" },
        { label: "is not empty", value: "isNotEmpty" },
      ]
    }
  }

  const handleAddFilter = () => {
    setFilters([...filters, { field: "", operator: "is", value: "" }])
  }

  const handleRemoveFilter = (index: number) => {
    if (filters.length > 1) {
      const newFilters = filters.filter((_, i) => i !== index)
      setFilters(newFilters)
    }
  }

  const handleFilterChange = (index: number, field: string, value: any) => {
    const newFilters = [...filters]
    newFilters[index] = { ...newFilters[index], [field]: value }

    if (field === "field") {
      newFilters[index].operator = isNumericField(value) ? "is" : "is"
      newFilters[index].value = ""
    }

    setFilters(newFilters)
  }

  const handleClearFilters = () => {
    setFilters([{ field: "", operator: "is", value: "" }])
    setCondition("AND")
  }

  const handleApplyFilters = () => {
    const filterState: FilterState = {
      condition,
      filters: {},
    }

    filters.forEach((filter) => {
      if (filter.field && (filter.value || filter.operator === "isEmpty" || filter.operator === "isNotEmpty")) {
        filterState.filters[filter.field] = {
          operator: filter.operator,
          value: filter.value,
        }
      }
    })

    onApplyFilters(filterState)
  }

  if (!isOpen) return null

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
          maxWidth: "700px",
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
          <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "600", color: "#111827" }}>Filter Tasks</h3>
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

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
          {filters.map((filter, index) => (
            <div
              key={index}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "20px",
                backgroundColor: "#f9fafb",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                {index === 0 ? (
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#374151",
                      minWidth: "60px",
                      padding: "6px 12px",
                      backgroundColor: "#e5e7eb",
                      borderRadius: "4px",
                    }}
                  >
                    Where
                  </span>
                ) : (
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as "AND" | "OR")}
                    style={{
                      padding: "6px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      minWidth: "80px",
                      backgroundColor: "white",
                      outline: "none",
                    }}
                  >
                    <option value="AND">And</option>
                    <option value="OR">Or</option>
                  </select>
                )}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr auto",
                  gap: "12px",
                  alignItems: "end",
                }}
              >
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
                    value={filter.field}
                    onChange={(e) => handleFilterChange(index, "field", e.target.value)}
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
                    Operator
                  </label>
                  <select
                    value={filter.operator}
                    onChange={(e) => handleFilterChange(index, "operator", e.target.value)}
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
                    {getOperatorOptions(filter.field).map((option) => (
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
                    Value
                  </label>
                  {filter.operator === "isEmpty" || filter.operator === "isNotEmpty" ? (
                    <div
                      style={{
                        padding: "8px 12px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                        fontSize: "14px",
                        color: "#6b7280",
                        backgroundColor: "#f9fafb",
                        fontStyle: "italic",
                      }}
                    >
                      No value needed
                    </div>
                  ) : isNumericField(filter.field) ? (
                    <input
                      type="number"
                      value={filter.value as string}
                      onChange={(e) => handleFilterChange(index, "value", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "14px",
                        outline: "none",
                      }}
                      min="0"
                      placeholder="Enter number"
                    />
                  ) : (
                    <AutocompleteInput
                      value={filter.value as string}
                      onChange={(value) => handleFilterChange(index, "value", value)}
                      suggestions={getUniqueValues(filter.field)}
                      placeholder="Type a value"
                    />
                  )}
                </div>

                <button
                  onClick={() => handleRemoveFilter(index)}
                  disabled={filters.length === 1}
                  style={{
                    padding: "8px",
                    border: "none",
                    borderRadius: "6px",
                    backgroundColor: filters.length === 1 ? "#f3f4f6" : "#fee2e2",
                    color: filters.length === 1 ? "#9ca3af" : "#dc2626",
                    cursor: filters.length === 1 ? "not-allowed" : "pointer",
                    fontSize: "16px",
                    width: "36px",
                    height: "36px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title="Remove filter"
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
              onClick={handleAddFilter}
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
              + Add Filter
            </button>
            <button
              onClick={handleClearFilters}
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
            onClick={handleApplyFilters}
            style={{
              padding: "10px 24px",
              border: "none",
              borderRadius: "6px",
              background: "#3b82f6",
              color: "white",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              transition: "background-color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#2563eb"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#3b82f6"
            }}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  )
}

export default FilterPanel
export type { FilterState }
