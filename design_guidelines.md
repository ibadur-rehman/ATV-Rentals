# API Testing Interface Design Guidelines

## Design Approach: Developer-Focused Design System
**Selected System**: Material Design + Stripe-inspired developer tools aesthetic
**Rationale**: API testing requires clarity, precision, and efficiency. Drawing from Postman, Insomnia, and Stripe's developer experience - prioritizing information density with clean visual hierarchy.

## Core Design Elements

### A. Color Palette
**Dark Mode Primary** (default for developer tools):
- Background: 220 15% 12%
- Surface: 220 15% 16%
- Surface Elevated: 220 15% 20%
- Primary Action: 210 100% 60%
- Success: 145 70% 55%
- Error: 0 80% 60%
- Warning: 40 90% 60%

**Light Mode**:
- Background: 220 15% 98%
- Surface: 0 0% 100%
- Primary: 210 100% 50%
- Borders: 220 15% 88%

**Text Hierarchy**:
- Primary text: 220 15% 95% (dark) / 220 15% 15% (light)
- Secondary: 220 10% 65%
- Muted: 220 10% 50%

### B. Typography
**Font Stack**: 
- Interface: 'Inter', system-ui, sans-serif (Google Fonts)
- Code/JSON: 'JetBrains Mono', 'Fira Code', monospace

**Scale**:
- Page title: text-2xl font-semibold
- Section headers: text-lg font-medium
- Labels: text-sm font-medium
- Input text: text-base
- Code blocks: text-sm

### C. Layout System
**Spacing Primitives**: Use 4, 6, 8, 12 spacing units consistently
- Section gaps: gap-8
- Form spacing: space-y-6
- Input internal: p-3
- Card padding: p-6

**Grid Structure**:
- Main container: max-w-7xl mx-auto px-6
- Two-column split: 60/40 (form/response)
- Form fields: Single column, full width
- Response area: Fixed to viewport right side

### D. Component Library

**Form Controls**:
- Input Fields: Rounded (rounded-lg), substantial padding (px-4 py-3), clear borders (2px), focus states with ring (ring-2 ring-primary/50)
- Dropdowns: Custom styled select with chevron icon, matching input aesthetic
- Date Pickers: Inline calendar widget, constrained width, clear selection states
- Tooltips: Positioned info icons (Heroicons), dark popover with white text, 8px arrow, max-width 240px

**Info Tooltips**:
- Icon: Information circle (sm size) next to labels
- Trigger: Hover/tap to reveal
- Content: Dark background (220 15% 10%), white text, concise explanations
- Position: Smart positioning (top/bottom based on viewport space)

**Request Section**:
- Sticky header with "Test API" title + "Send Request" primary button
- Parameter cards with subtle borders
- Clear visual grouping by parameter type
- Validation indicators inline with inputs

**Response Display**:
- Sticky at top when scrolling
- Tabbed interface: Response | Headers | Metadata
- JSON syntax highlighting (use highlight.js via CDN)
- Copy to clipboard button (top-right)
- Status badge (success/error) with status code
- Collapsible sections for large responses
- Line numbers for JSON (muted color)

**Buttons**:
- Primary: Solid fill, medium size (px-6 py-3), rounded-lg
- Secondary: Outlined (border-2), transparent background
- Icon buttons: Square (40px), centered icon, subtle hover background
- Loading states: Spinner replacement with disabled state

**Cards & Containers**:
- Subtle shadow: shadow-sm
- Border: 1px solid border color
- Rounded corners: rounded-xl
- Hover elevation on interactive cards: shadow-md transition

### E. Layout Specifications

**Page Structure** (No hero image - utility-focused):
1. **Header Bar** (sticky, h-16):
   - Breadcrumb: Dashboard > Check Availability API
   - Quick actions: Save, Reset, Documentation link

2. **Main Content** (two-column, gap-8):
   
   **Left Column (60%)** - Request Builder:
   - Section: Date Selection (from/to date pickers, side by side)
   - Section: Duration Parameters (number input with unit selector)
   - Section: Vehicle Configuration (type dropdown + quantity stepper)
   - Section: Additional Options (checkboxes with tooltips)
   - Bottom: Primary CTA "Test Availability" (full width, prominent)

   **Right Column (40%)** - Response Viewer (sticky top-24):
   - Status header with badge
   - Tabbed content area
   - JSON display with syntax highlighting
   - Performance metrics footer (response time, size)

3. **Parameter Field Pattern**:
   ```
   [Label with info tooltip icon]
   [Input field with validation state]
   [Helper text or error message]
   ```

**Responsive Behavior**:
- Desktop (lg+): Two-column layout maintained
- Tablet (md): Stack columns, response follows form
- Mobile: Full stack, collapsible response section

### F. Interactive States

**Focus Management**:
- Clear focus rings (ring-2 ring-offset-2)
- Tab order: Top to bottom, left to right
- Keyboard shortcuts: Ctrl+Enter to submit

**Loading States**:
- Form submission: Button shows spinner, form dims
- Response loading: Skeleton placeholder in JSON area
- Parameter validation: Real-time, debounced 300ms

**Error Handling**:
- Inline field errors: Red border + message below
- API errors: Alert banner above response with retry action
- Network errors: Retry modal with diagnostic info

### G. Micro-interactions
- Input focus: Subtle scale (1.01) + shadow increase
- Button hover: Background darken 5%, subtle lift
- Tooltip appearance: Fade in 150ms with 5px slide
- JSON collapse/expand: Smooth height transition 200ms
- Success submission: Brief green flash on response container

**Animation Budget**: Minimal, functional only
- No decorative animations
- Focus on state transitions and feedback
- All animations under 300ms

### H. Accessibility
- ARIA labels on all form controls
- Keyboard navigation fully supported
- Color contrast ratio 4.5:1 minimum
- Focus indicators always visible
- Screen reader announcements for response updates
- Error messages programmatically associated with fields

## Implementation Notes
- Use Heroicons for all interface icons via CDN
- Syntax highlighting via highlight.js (github-dark theme)
- Form validation using native HTML5 + custom JS
- No images needed - this is a pure utility interface
- Maintain consistency with existing dashboard design system