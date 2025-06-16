export interface TaskData {
  taskId: string
  contractId: string
  obligationTitle: string
  category: string
  domain: string
  subdomain: string
  criticality: "High" | "Medium" | "Low"
  owner: string
  triggeredTasks: number
  openTasks: number
  compliance: "Compliant" | "Non-Compliant" | "Pending" | "At Risk"
}

export interface TaskRow {
  id: string
  contractId: string
  category: string
  domain: string
  subdomain: string
  owner: string
  tasks: TaskData[]
  isExpanded: boolean
}
