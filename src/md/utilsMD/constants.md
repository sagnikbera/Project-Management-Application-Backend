```js
// Define a set of user roles as an enumeration.
// These roles will help control permissions in the application.
export const UserRolesEnum = {
    ADMIN: "admin",               // Full access to all features and settings
    PROJECT_ADMIN: "project_admin", // Admin role limited to specific projects
    MEMBER: "member"              // Regular user with limited access
}

// Create an array of all available user roles.
// Object.values(UserRolesEnum) converts the values of the enum object into an array.
// This is useful for validating roles or populating dropdowns in UI.
export const AvailableUserRole = Object.values(UserRolesEnum);


// Define a set of possible task statuses as an enumeration.
// These statuses will be used to track the progress of tasks in a project.
export const TaskStatusEnum = {
    TODO: "todo",                 // Task has not been started
    IN_PROGRESS: "in_progress",   // Task is currently being worked on
    DONE: "done"                  // Task is completed
}

// Create an array of all available task statuses.
// Similar to roles, this can be used for validation or UI dropdowns.
export const AvailableTaskStatus = Object.values(TaskStatusEnum);
```

### Explanation of the functionality

1. **`UserRolesEnum` and `TaskStatusEnum`**

   - These are **enumerations** (enums) — a way to define a fixed set of named constants.
   - Using enums ensures consistency in your code. For example, instead of typing `"admin"` in multiple places (and risking typos), you can use `UserRolesEnum.ADMIN`.

2. **`AvailableUserRole` and `AvailableTaskStatus`**

   - `Object.values(UserRolesEnum)` takes all the values from the enum object and puts them into an array.  
     Example: `["admin", "project_admin", "member"]`
   - This array is very useful for:
     - Validating user input (making sure a role or task status is valid)
     - Populating selection options in forms (dropdowns, checkboxes, etc.)

- `Object.values()` is a built-in JavaScript method that takes an object and returns an array of all its values.     

---

### Why this code is useful

- **Consistency:** Prevents typos and enforces standard values for roles and statuses.
- **Validation:** Makes it easy to check if a value is valid (`AvailableUserRole.includes(someRole)`).
- **Scalability:** Adding a new role or task status only requires changing the enum, not every part of the code where it’s used.
- **Cleaner UI logic:** Dropdowns or filters can be dynamically generated from the arrays.
