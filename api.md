# API log

This API log follows the same [Semantic Versioning](https://semver.org/spec/v2.0.0.html) as the `changelog.md`.

For each public API route, it lists **inputs**, **outputs**, **errors thrown**, and **places invocated**

# [5.0.1] 

### `Removed` ###

### api/statistics
- Replaced with internal `fetchWebsiteStats()` function load

# [5.0.0] # Stripe integration

### `Added` ###

## 'events/register/check-capacity'

### Inputs
- event_id: event identifier of type `string`

### Outputs
- success: `boolean` representing response type
- message: `string` describing succesfull response
- error: `string` describing failure response

## 'payments/checkout-sessions'

### Inputs
- priceId: identifier for a product and it's price, of type `string`

### Outputs
- id: id for a stripe account, of type `string`
- client_secret: a token that grants specified permissions, of type `string`
- message: a message that describes the response type, of type `string`
- status: a status code for the response of type `number`

## 'api/payments/connected-onboarding/create-connect-account'

### Inputs
- userId: id for an LSN user, of type `string`

### Outputs
- message: `string` describing response type
- status: `number` status code describing response type
- client_secret: `string` token granting specified onboarding permissions

## 'api/payments/connected-onboarding/resume-connected-onboarding'

### Inputs
- userId: id for an LSN user, of type `string`

### Outputs
- message: `string` describing response type
- status: `number` status code describing response type
- client_secret: `string` token granting specified onboarding permissions

## 'api/payments/connected-onboarding/store-connected-account-id'

### Inputs
- userId: id for an LSN user, of type `string`
- accountId: id for a stripe connect account of type `string`

### Outputs
- success: `boolean` representing response type
- message: `string` describing response type
- status: `number` status code describing response type

## 'api/payments/create-priceId'

### Inputs
- subcurrencyAmount: monetary value in subcurrency, of type `number`
- productName: product name, of type `string`
- description: `string`

### Outputs
- message: `string` describing response type
- status: `number` status code describing response type
- productId: `string` id for product
- priceId: `string` id for price of product

## 'api/payments/directed-checkout-sessions'

### Inputs
- priceId: `string` id for price of a product
- eventId: `string` id for LSN event

### Outputs
- success: `boolean` representing response type
- message: `string` describing response type
- status: `number` status code describing response type
- id: id for a stripe account, of type `string`
- client_secret: a token that grants specified permissions, of type `string`

## 'api/payments/fetch-price-id'

### Inputs
- event_uuid: `string` id for an LSN event

### Outputs
- message: `string` describing response type
- status: `number` status code describing response type
- priceId: `string` id for price of a product

## 'api/protected/events/update'

### Inputs
- event_id: `string` id for an LSN event
- formData: form data of type `FormData`

### Outputs
- message: `string` describing response type
- status: `number` status code describing response type
- error: `string` describing an error

## 'api/society/create'

### Inputs
- data: form data of type `SocietyRegisterFormData`

### Outputs
- success: `boolean` describing response type
- id: user id for LSN users of type `string`
- error: `string` describing error

### `Changed` ###

## 'events/create'

### Inputs
- data: type `FormData`

### Outputs
- status: number status code (200 = success)
- message: string message that describes the response

## 'events/register'

### Inputs
- event_id: event identifier of type `string`
- user_information: user object containing id, name, email, all of type `string`

### Outputs
- success: `boolean` representing response type
- registered: `boolean` that is true if user already registered
- error: `string` describing error
- emailError: `boolean` that is true if there is an error with email sending

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