// Note: This project requires @hello-pangea/dnd for drag-and-drop functionality
// Install with: npm install @hello-pangea/dnd

import TaskTable from "../components/TaskTable"
import { sampleTasks } from "../data/sampleTasks"

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#f5f6fa",
        padding: "24px",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        <TaskTable tasks={sampleTasks} />
      </div>
    </main>
  )
}
