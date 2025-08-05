# Auth API Spec

## Register User

🔵 `POST` /api/v1/auth/register

Request Body:

```json
{
  "username": "John",
  "email": "John@gmail.com",
  "password": "password"
}
```

Response Success (200):

```json
{
  "data": {
    "username": "John",
    "email": "John@gmail.com"
  }
}
```

Response Error (400):

```json
{
  "errors": "Email already registered"
}
```

## Login User

🔵 `POST`: /api/v1/auth/login

Request Body:

```json
{
  "email": "John@gmail.com",
  "password": "Password"
}
```

Response Success (200):

```json
{
  "data": {
    "access_token": "JWT token"
  }
}
```

Reseponse Error (400):

```json
{
  "errors": "Invalid email or password"
}
```

## Logout User

🔴 `DELETE` /api/v1/auth/logout

**🔐 Required:**  
Cookie: `token="eyJhbGciOi..."`

### Response Success (200):

```json
{
  "data": null
}
```

### Response Error (401):

```json
{
  "errors": "Unauthorized"
}
```

## Refresh Token User

🔵 `POST` /api/v1/auth/refresh

**🔐 Required:**  
Cookie: `token="eyJhbGciOi..."`

### Response Success (200):

```json
{
  "data": {
    "access_token": "JWT token"
  }
}
```

### Response Error (401):

```json
{
  "errors": "Unauthorized"
}
```

#### 🟢 Status Code:

- `200 OK` – Request successful
- `404 Not Found` – Not found
- `401 Unauthorized` – Missing or invalid token
- `403 Forbidden` – Access denied
