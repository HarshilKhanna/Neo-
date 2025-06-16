import type React from "react"
import { createPortal } from "react-dom"
import type { ReactNode } from "react"

interface DraggablePortalProps {
  children: ReactNode
}

export const DraggablePortal: React.FC<DraggablePortalProps> = ({ children }) => {
  if (typeof window === "undefined") return null

  return createPortal(children, document.body)
}
