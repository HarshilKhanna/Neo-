# Task Management Table Component

A modern, hierarchical task management table built with React and TypeScript. This component displays tasks organized in a 5-level hierarchy with expandable/collapsible sections and detailed task cards.

## Features

### Hierarchical Organization
- **5-Level Hierarchy**: Contract ID → Category → Domain → Subdomain → Owner
- **Expandable/Collapsible**: Each level can be expanded or collapsed independently
- **Visual Indicators**: Subtle arrow icons show expansion state
- **Task Counts**: Display number of tasks in each group

### Modern UI/UX
- **Clean Design**: Neutral color palette with consistent spacing
- **Responsive Layout**: Adapts to different screen sizes with horizontal scroll
- **Hover Effects**: Subtle interactions on expandable elements
- **Card Layout**: Task details displayed in clean, card-based format
- **Visual Hierarchy**: Clear typography and color coding

### Task Management
- **Comprehensive Data**: Each task includes ID, title, criticality, compliance status, and metrics
- **Status Indicators**: Color-coded compliance and criticality levels
- **Detailed Cards**: Rich task information in an organized layout
- **Performance Optimized**: Efficient grouping and rendering

## Installation

1. **Clone or download** the project files
2. **Install dependencies**:
   \`\`\`bash
   npm install
   \`\`\`
3. **Run the development server**:
   \`\`\`bash
   npm run dev
   \`\`\`
4. **Open** [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Basic Implementation
\`\`\`tsx
import TaskTable from './components/TaskTable';
import { sampleTasks } from './data/sampleTasks';

function App() {
  return <TaskTable tasks={sampleTasks} />;
}
\`\`\`

### Custom Data
\`\`\`tsx
const customTasks: TaskData[] = [
  {
    taskId: 'T001',
    contractId: 'CNT-2024-001',
    obligationTitle: 'Security Assessment',
    category: 'Security',
    domain: 'Information Security',
    subdomain: 'Risk Assessment',
    criticality: 'High',
    owner: 'John Smith',
    triggeredTasks: 5,
    openTasks: 2,
    compliance: 'Compliant'
  },
  // ... more tasks
];

<TaskTable tasks={customTasks} />
\`\`\`

## Data Structure

### TaskData Interface
\`\`\`typescript
interface TaskData {
  taskId: string;
  contractId: string;
  obligationTitle: string;
  category: string;
  domain: string;
  subdomain: string;
  criticality: 'High' | 'Medium' | 'Low';
  owner: string;
  triggeredTasks: number;
  openTasks: number;
  compliance: 'Compliant' | 'Non-Compliant' | 'Pending' | 'At Risk';
}
\`\`\`

## Component Architecture

### File Structure
\`\`\`
src/
├── components/
│   ├── TaskTable/
│   │   └── index.tsx          # Main table component
│   └── TaskCard/
│       └── index.tsx          # Individual task card
├── types/
│   └── task.ts               # TypeScript interfaces
├── utils/
│   └── grouping.ts           # Grouping and tree operations
├── data/
│   └── sampleTasks.ts        # Sample data (30+ tasks)
└── app/
    └── page.tsx              # Main page component
\`\`\`

### Key Components

#### TaskTable
- Main component managing the hierarchical display
- Handles expand/collapse state
- Provides expand/collapse all functionality
- Responsive design with scroll handling

#### TaskCard
- Displays individual task information
- Color-coded status indicators
- Hover effects and clean layout
- Responsive grid layout for task details

#### Grouping Utilities
- `groupTasks()`: Organizes flat task array into hierarchy
- `toggleNodeExpansion()`: Manages expand/collapse state
- `expandAllNodes()` / `collapseAllNodes()`: Bulk operations

## Customization

### Styling
The component uses inline styles for maximum compatibility. Key style variables:

\`\`\`typescript
// Colors
const colors = {
  primary: '#1a73e8',
  background: '#f8f9fa',
  border: '#dee2e6',
  text: '#495057',
  muted: '#6c757d'
};

// Spacing
const spacing = {
  small: '8px',
  medium: '16px',
  large: '24px'
};
\`\`\`

### Adding New Hierarchy Levels
To modify the hierarchy, update the `GROUP_LEVELS` array in `utils/grouping.ts`:

\`\`\`typescript
const GROUP_LEVELS: GroupLevel[] = [
  'contractId', 
  'category', 
  'domain', 
  'subdomain', 
  'owner'
  // Add new levels here
];
\`\`\`

### Custom Task Fields
Extend the `TaskData` interface in `types/task.ts` and update the `TaskCard` component accordingly.

## Performance Considerations

- **Efficient Grouping**: O(n) grouping algorithm
- **Memoized Calculations**: React.useMemo for expensive operations
- **Optimized Rendering**: Only renders visible nodes
- **Smooth Interactions**: CSS transitions for expand/collapse

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive design for mobile and desktop
- Horizontal scroll for wide tables on small screens

## Sample Data

The component includes 30+ sample tasks across:
- 10 different contracts
- 8 categories (Security, Finance, HR, etc.)
- Multiple domains and subdomains
- Various owners and compliance statuses
- Mixed criticality levels

## Contributing

1. Follow the existing code structure
2. Maintain TypeScript strict mode compliance
3. Add appropriate type definitions
4. Test with various data sets
5. Ensure responsive design principles

## License

This component is provided as-is for educational and commercial use.
