# Drills Management Panel - Design Wireframe & Documentation

## 📋 Overview
The Drills Management Panel provides comprehensive drill management capabilities with inline controls for importing, exporting, editing, and deleting drills. The design follows the existing Barnes Rugby platform's visual language while adding powerful new functionality.

## 🎨 Visual Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│ Barnes Rugby - Coaching Platform                           │
│ Professional drill management and practice calendar system │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ [Drills] [Practice Calendar] [System Overview] [Design Drill] │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 📋 Drills Management                           [+ Add New Drill] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🔧 Drill Management                                         │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐             │
│ │📥 Download  │ │📤 Upload    │ │🗑️ Delete    │             │
│ │All Drills   │ │Drills       │ │All Drills   │             │
│ └─────────────┘ └─────────────┘ └─────────────┘             │
│                                                             │
│ [Success/Status Messages]                                   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ 📊 Drill Repository                                         │
│                                                             │
│ [🔍 Search drills...]                                       │
│                                                             │
│ [All Skills] [Passing] [Awareness] [Defense]                │
│ [All Durations] [15 min] [30 min] [45 min] [60 min]        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ | Drill Name & Description | Skill | Duration | Actions |    │
├─────────────────────────────────────────────────────────────┤
│ | Advanced Passing Drill   |Passing| 30 min   |[Edit][Del]| │
│ | Improve accuracy...      |       |          |           | │
├─────────────────────────────────────────────────────────────┤
│ | Defensive Line Drill     |Defense| 45 min   |[Edit][Del]| │
│ | Work on structure...     |       |          |           | │
├─────────────────────────────────────────────────────────────┤
│ | ... more drills ...      |       |          |           | │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Component Breakdown

### 1. Management Controls Section
**Location**: Above drill repository
**Background**: Light gray container with rounded corners
**Components**:
- **Download Button**: Blue background, download icon
- **Upload Button**: Green background, upload icon  
- **Delete All Button**: Red background, trash icon

### 2. Status Messages
**Location**: Below management controls
**Types**:
- Success: Green background, checkmark
- Error: Red background, warning icon
- Info: Blue background, info icon

### 3. Enhanced Drill Table
**New Column**: "Actions" column added
**Action Buttons**: 
- Edit: Gray background, hover to green
- Delete: Gray background, hover to red

### 4. Modal Components

#### Edit Drill Modal
```
┌─────────────────────────────────────┐
│ ✏️ Edit Drill                  [×] │
├─────────────────────────────────────┤
│ Drill Name: [________________]      │
│ Skill: [Dropdown ▼]                │
│ Duration: [Dropdown ▼]             │
│ Description:                        │
│ [________________________]         │
│ [________________________]         │
├─────────────────────────────────────┤
│                  [Cancel] [Save]    │
└─────────────────────────────────────┘
```

#### Confirmation Modal
```
┌─────────────────────────────────────┐
│ ⚠️ Delete Drill                    │
├─────────────────────────────────────┤
│ Are you sure you want to delete:    │
│ "Advanced Passing Drill"            │
│                                     │
│ This action cannot be undone.       │
├─────────────────────────────────────┤
│                  [Cancel] [Delete]  │
└─────────────────────────────────────┘
```

#### Import Options Modal
```
┌─────────────────────────────────────┐
│ 📤 Import Drills                   │
├─────────────────────────────────────┤
│ Found 2 drills to import.           │
│ Current repository contains 7 drills│
│                                     │
│ Choose import mode:                 │
│ ○ Append: Add new drills            │
│ ○ Update: Replace matching names    │
│ ○ Replace All: Delete & import      │
├─────────────────────────────────────┤
│                  [Cancel] [Import]  │
└─────────────────────────────────────┘
```

## 🎨 Design Principles

### Color Scheme
- **Primary Blue**: `#1e3a8a` (main actions, headers)
- **Success Green**: `#059669` (upload, success messages)
- **Danger Red**: `#dc2626` (delete actions, errors)
- **Neutral Gray**: `#6b7280` (secondary actions)
- **Light Gray**: `#f8fafc` (container backgrounds)

### Typography
- **Headers**: Bold, dark blue (`#1e3a8a`)
- **Body Text**: Standard weight, dark gray (`#374151`)
- **Buttons**: Medium weight, appropriate contrast colors

### Spacing & Layout
- **Container Padding**: 24px for main sections
- **Button Spacing**: 12px gaps between controls
- **Modal Padding**: 32px for comfortable reading
- **Table Padding**: 12px for cell content

## 🔄 User Flow Diagrams

### Import Flow
```
[Click Upload] → [File Selection] → [JSON Validation] → [Import Options Modal] → [Mode Selection] → [Confirm Import] → [Success Message] → [Table Update]
```

### Export Flow
```
[Click Download] → [JSON Generation] → [File Download] → [Success Message]
```

### Edit Flow
```
[Click Edit] → [Modal Opens] → [Form Pre-filled] → [User Edits] → [Save Changes] → [Table Update] → [Success Message]
```

### Delete Flow
```
[Click Delete] → [Confirmation Modal] → [User Confirms] → [Drill Removed] → [Table Update] → [Success Message]
```

## 🛡️ Security & Authorization

### Admin-Only Operations
- Delete individual drills
- Delete all drills
- Controlled by `currentUserRole` variable

### User Feedback
- Clear error messages for unauthorized actions
- Visual indicators for admin-only buttons
- Confirmation dialogs for destructive actions

## 📱 Responsive Considerations

### Mobile Adaptations
- Control buttons stack vertically on smaller screens
- Modal dialogs adjust width for mobile viewports
- Table scrolls horizontally if needed
- Touch-friendly button sizes (minimum 44px)

### Tablet Adaptations  
- Controls remain in horizontal layout
- Modal dialogs use appropriate width
- Table maintains full functionality

## 🎯 Accessibility Features

### Keyboard Navigation
- All controls accessible via Tab key
- Modal dialogs trap focus appropriately
- Clear focus indicators on all interactive elements

### Screen Reader Support
- Descriptive button labels with icons
- Proper heading hierarchy
- Status messages announced to assistive technology

### Visual Accessibility
- High contrast ratios for all text
- Clear visual hierarchy
- Consistent button styling and states

## 🔧 Technical Implementation Notes

### State Management
- Single `drills` array maintains all drill data
- Modal states controlled by CSS classes
- File operations use modern browser APIs

### Data Validation
- JSON structure validation on import
- Required field validation on edit
- User-friendly error messages

### Performance Considerations
- Efficient DOM manipulation for table updates
- Minimal re-renders when data changes
- Optimized file operations for large drill sets