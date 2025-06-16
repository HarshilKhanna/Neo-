"use client"

import type React from "react"
import type { TaskData } from "../../types/task"

interface TaskCardProps {
  task: TaskData
}

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const getComplianceColor = (compliance: string) => {
    switch (compliance) {
      case "Compliant":
        return "#10b981"
      case "Non-Compliant":
        return "#ef4444"
      case "At Risk":
        return "#f59e0b"
      case "Pending":
        return "#6b7280"
      default:
        return "#6b7280"
    }
  }

  const getCriticalityColor = (criticality: string) => {
    switch (criticality) {
      case "High":
        return "#ef4444"
      case "Medium":
        return "#f59e0b"
      case "Low":
        return "#10b981"
      default:
        return "#6b7280"
    }
  }

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #dee2e6",
        borderRadius: "8px",
        padding: "16px",
        margin: "8px 0",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        transition: "box-shadow 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)"
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: "16px",
          alignItems: "start",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "12px",
              color: "#6c757d",
              marginBottom: "4px",
              fontWeight: "500",
            }}
          >
            Task ID: {task.taskId}
          </div>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "600",
              color: "#212529",
              margin: "0 0 12px 0",
              lineHeight: "1.4",
            }}
          >
            {task.obligationTitle}
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: "12px",
              fontSize: "14px",
            }}
          >
            <div>
              <span style={{ color: "#6c757d", fontSize: "12px" }}>Criticality:</span>
              <div
                style={{
                  color: getCriticalityColor(task.criticality),
                  fontWeight: "600",
                }}
              >
                {task.criticality}
              </div>
            </div>
            <div>
              <span style={{ color: "#6c757d", fontSize: "12px" }}>Triggered:</span>
              <div style={{ color: "#495057", fontWeight: "600" }}>{task.triggeredTasks}</div>
            </div>
            <div>
              <span style={{ color: "#6c757d", fontSize: "12px" }}>Open:</span>
              <div style={{ color: "#495057", fontWeight: "600" }}>{task.openTasks}</div>
            </div>
          </div>
        </div>
        <div
          style={{
            textAlign: "right",
          }}
        >
          <div
            style={{
              backgroundColor: getComplianceColor(task.compliance),
              color: "white",
              padding: "4px 12px",
              borderRadius: "16px",
              fontSize: "12px",
              fontWeight: "600",
              display: "inline-block",
            }}
          >
            {task.compliance}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskCard
