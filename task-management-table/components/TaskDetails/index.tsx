"use client"

import type React from "react"
import type { TaskData } from "../../types/task"

interface TaskDetailsProps {
  task: TaskData
}

const TaskDetails: React.FC<TaskDetailsProps> = ({ task }) => {
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
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ fontSize: "12px", color: "#6c757d", fontWeight: "500" }}>Task ID</div>
          <div style={{ fontSize: "14px", fontWeight: "600", color: "#212529" }}>{task.taskId}</div>
        </div>
        <div>
          <div style={{ fontSize: "12px", color: "#6c757d", fontWeight: "500" }}>Obligation Title</div>
          <div style={{ fontSize: "14px", fontWeight: "600", color: "#212529" }}>{task.obligationTitle}</div>
        </div>
        <div>
          <div style={{ fontSize: "12px", color: "#6c757d", fontWeight: "500" }}>Criticality</div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: getCriticalityColor(task.criticality),
            }}
          >
            {task.criticality}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "12px", color: "#6c757d", fontWeight: "500" }}>Triggered Tasks</div>
          <div style={{ fontSize: "14px", fontWeight: "600", color: "#212529" }}>{task.triggeredTasks}</div>
        </div>
        <div>
          <div style={{ fontSize: "12px", color: "#6c757d", fontWeight: "500" }}>Open Tasks</div>
          <div style={{ fontSize: "14px", fontWeight: "600", color: "#212529" }}>{task.openTasks}</div>
        </div>
        <div>
          <div style={{ fontSize: "12px", color: "#6c757d", fontWeight: "500" }}>Compliance</div>
          <div
            style={{
              display: "inline-block",
              backgroundColor: getComplianceColor(task.compliance),
              color: "white",
              padding: "4px 12px",
              borderRadius: "16px",
              fontSize: "12px",
              fontWeight: "600",
            }}
          >
            {task.compliance}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskDetails
