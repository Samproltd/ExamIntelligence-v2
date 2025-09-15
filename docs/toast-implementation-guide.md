# Toast Notification Implementation Guide

This guide provides instructions for implementing toast/snackbar notifications consistently throughout the application.

## Overview

Toast notifications provide immediate feedback to users about the success or failure of their actions. They enhance user experience by confirming actions and communicating errors in a non-intrusive way.

## Components and Hooks

The application uses:

1. **Snackbar Component** (`components/Snackbar.tsx`): Displays the toast message with appropriate styling based on the message type.
2. **useToast Hook** (`hooks/useToast.ts`): Manages the toast state and provides methods to show different types of notifications.

## Implementation Steps

Follow these steps to add toast notifications to any page or component:

### 1. Import the necessary components

```tsx
import Snackbar from "../../../components/Snackbar";
import useToast from "../../../hooks/useToast";
```

### 2. Add the toast state to your component

```tsx
const { toast, showSuccess, showError, showInfo, hideToast } = useToast();
```

### 3. Use the toast functions in your API calls

```tsx
// Example: Handling API call success
try {
  const response = await axios.post("/api/endpoint", data);
  showSuccess("Operation completed successfully");
} catch (error) {
  const errorMessage = error.response?.data?.message || "An error occurred";
  showError(errorMessage);
}
```

### 4. Add the Snackbar component to your JSX

```tsx
<Snackbar
  open={toast.open}
  message={toast.message}
  type={toast.type}
  onClose={hideToast}
/>
```

## When to Use Toast Notifications

### Success Toasts

Use `showSuccess()` when:

- A user has successfully created, updated, or deleted data
- A form has been submitted successfully
- An operation that takes time has completed successfully

Example: `showSuccess('Student added successfully')`

### Error Toasts

Use `showError()` when:

- An API request fails
- Form validation fails (server-side validation)
- Any operation couldn't be completed due to an error

Example: `showError('Failed to update record. Please try again.')`

### Info Toasts

Use `showInfo()` when:

- Providing neutral information to the user
- Notifying about state changes
- Giving hints or tips

Example: `showInfo('Your session will expire in 5 minutes')`

## Pages to Update

The following pages need toast notifications implemented:

- [x] Admin Batch Detail Page (`pages/admin/batches/[id].tsx`)
- [x] Admin Students Page (`pages/admin/students/index.tsx`)
- [ ] Admin Student Detail Page (`pages/admin/students/[id].tsx`)
- [ ] Admin Courses Page (`pages/admin/courses/index.tsx`)
- [ ] Admin Exams Page (`pages/admin/exams/index.tsx`)
- [ ] Admin Exam Detail Page (`pages/admin/exams/[id].tsx`)
- [ ] Student Dashboard (`pages/student/index.tsx`)
- [ ] Student Exam Detail Page (`pages/student/exams/[id].tsx`)
- [ ] Student Results Page (`pages/student/results/index.tsx`)
- [ ] Login and Registration Pages (`pages/login.tsx`, `pages/register.tsx`)

## Best Practices

1. **Keep messages short and clear**: Toast messages should be concise and to the point.
2. **Be specific**: Clearly describe what happened (e.g., "Student [name] added successfully" instead of "Success").
3. **Consistent timing**: All toasts should appear for the same duration (default is 3 seconds).
4. **Error details**: Include specific error information when showing error messages.
5. **Don't overuse**: Only show toasts for important actions, not for every minor interaction.

## Testing

Always test toast notifications in the following scenarios:

- Successful operations
- Failed operations due to server errors
- Failed operations due to validation errors
- Network errors

## Example Implementation

```tsx
// Importing
import Snackbar from "../../../components/Snackbar";
import useToast from "../../../hooks/useToast";

// Component definition
const MyComponent = () => {
  // State
  const { toast, showSuccess, showError, showInfo, hideToast } = useToast();

  // API call function
  const handleSaveData = async () => {
    try {
      setLoading(true);
      const response = await axios.post("/api/data", formData);
      showSuccess("Data saved successfully");
      // Additional success handling
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to save data";
      showError(errorMessage);
      // Additional error handling
    } finally {
      setLoading(false);
    }
  };

  // Component JSX
  return (
    <>
      {/* Component content */}

      {/* Snackbar */}
      <Snackbar
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    </>
  );
};
```
