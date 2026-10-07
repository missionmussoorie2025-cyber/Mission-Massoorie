# Security Specification for Mission Mussoorie 2027

## Data Invariants
1. User profile data at `/users/{userId}` is strictly private and can only be accessed or modified by the document owner (`request.auth.uid == userId`).
2. User progress data at `/users/{userId}/data/progress` is strictly private and accessible only by `request.auth.uid == userId`.
3. Anonymous or unauthenticated access to user records is explicitly rejected.

## Security Rules Strategy
- Identity verification: `request.auth != null && request.auth.uid == userId`
- Validation logic: `isValidId(userId)` ensures path parameters are sanitized strings.
- All-or-nothing catch-all safety net: default deny for unspecified paths.
