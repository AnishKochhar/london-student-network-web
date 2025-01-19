# API log

This API log follows the same [Semantic Versioning](https://semver.org/spec/v2.0.0.html) as the `changelog.md`.

For each public API route, it lists **inputs**, **outputs**, **errors thrown**, and **places invocated**

# [4.0.0] # New non backward compatible routes introduced to workflow, and some previous routes deleted

## 'events/update'
- deleted

## 'protected/events/update'

### Inputs
- eventId: UUID of event of type `string`
- formData: event form data of type `FormData`

### Outputs
- status: number status code (200 = success)
- message: string message that describes the response

### Errors:
- important fields are missing (400) [unique]
- non authenticated request (401) [unique]
- authenticated user doesn't have permission (403) [unique]
- internal server error (500) [non-unique]

### Where
- `app/component/events-page/edit-event/EditEventComponent`

## 'protected/events/verify-owner-of-event'

### Inputs
- eventId: UUID of event of type `string`

### Outputs
- status: number status code (200 = success)
- message: string message that describes the response

### Errors:
- non authenticated request (401) [unique]
- authenticated user doesn't have permission (403) [unique]
- internal server error (500) [non-unique]

### Where
- `app/component/events-page/edit-event/EditEventComponent`

# [3.1.0] 

## `events/get-information`

### Inputs
- id: Last 20 digits of UUID of event

### Ouputs
- event: _SQLEvent_

### Errors:
- event not found in `events` table

### Where
- `events/[id]/event-info.tsx`


# [2.0.0] # An API route is no longer backword compatible (/api/validate-token)

## `validate-token`

### Inputs
- token: _string_

### Outputs
- message: _string_, error: _string_

### Errors
- No token given
- Token is expired

### Where
- `reset-password/page.tsx/ResetPasswordPage`

## `email/send-verification-email`

### Inputs
- email: _string_

### Outputs:
- success: _boolean_, error: _string_, message: _string_

### Errors
- No email given
- Failure to insert into redis
- Failure to send email

### Where
- `register/company/page.tsx`, in useEffect
- `register/society/page.tsx`, in useEffect
- `register/student/page.tsx`, in useEffect

## `email/verify-email`

### Inputs
- token: _string_

### Outputs:
- success: _boolean_, error: _string_

### Errors
- No token given
- Invalid/Expired token
- Failure to get matching email from redis
- Failure to update emailverified field in table

### Where
- `verify-email/page.tsx`, in useEffect

# [1.1.7]

## `organisation/check-name`

- Checks company's name inside users table

## `organisation/create`

- Inserts a company into the users table, then inserts into company_information table

### Inputs
- data: _CompanyRegisterFormData_

### Where
- `register/company/OrganisationRegistrationForm`

# [1.1.6]

## `statistics` - GET

### Inputs
- _nil_

### Outputs
- `WebsiteStats`: { total_events: _string_, total_universities: _string_, total_societies: _string_ }

### Errors
- _nil_ (returns defaultFallback in case of database error)

### Where
- `Statistics` (on Homepage)

# [1.1.4]

## `forgotten-password`:

### Inputs
- email: _string_

### Outputs
- message: _string_, error: _string_

### Errors
- No email is passed
- Token cannot be inserted into `reset_password` table
- Reset password email cannot be sent

### Where
- `login-form.tsx/ForgottenPasswordModal`


## `reset-password`:

### Inputs
- token: _string_
- password: _string_

### Outputs
- success: _boolean_, error: _string_

### Errors
- No token given
- No email associated with token
- No password given

### Where
- `reset-password/page.tsx/ResetPasswordPage`

## `validate-token`:

### Inputs
- token: _string_

### Outputs
- status: _string_, error: _string_

### Errors
- No token given
- Token is expired

### Where
- `reset-password/page.tsx/ResetPasswordPage`


---