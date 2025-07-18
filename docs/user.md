## Get All User

🟢 `GET` /api/v1/users

**Headers:**

| Name          | Type   | Required | Description  |
| ------------- | ------ | -------- | ------------ |
| Authorization | string | ✅       | Bearer token |

**🔒 Access Control: `admin`**

**🔎 Query Parameter:**

| Name  | type   | Required | Default | Description              |
| ----- | ------ | -------- | ------- | ------------------------ |
| limit | Number | ❌       | 10      | Number of users per page |
| page  | Number | ❌       | 1       | Page number to retrieve  |

Reseponse Success (200):

```json
{
    "data": [
        {
            "id": 1,
            "username": "John",
            "email": "John@gmail.com",
            "role": "user"
        },
        ...
    ],
    "total_page": 10,
    "current_page": 1
}
```

Reseponse Error (403):

```json
{
  "errors": "Access denied"
}
```

## Update User

🟡 `PUT` /api/v1/users/:id

**Headers:**

| Name          | Type   | Required | Description  |
| ------------- | ------ | -------- | ------------ |
| Authorization | string | ✅       | Bearer token |

**🔒Access Control:**

- The user updating their own data
- Admin

Request Body:

```json
{
  "username": "new username",
  "password": "new password"
}
```

Reseponse Success (200):

```json
{
  "data": {
    "username": "new username",
    "password": "new password"
  }
}
```

Reseponse Error (400):

```json
{
  "errors": "Username must not exceed 100 characters"
}
```

## Delete User

🔴 `DELETE` /api/v1/users/:id

**Headers:**

| Name          | Type   | Required | Description  |
| ------------- | ------ | -------- | ------------ |
| Authorization | string | ✅       | Bearer token |

**🔒 Access Control: `admin`**

Reseponse Success (200):

```json
{
  "data": null
}
```

Reseponse Error (404):

```json
{
  "errors": "User not found"
}
```

#### 🟢 Status Code:

- `200 OK` – Request successful
- `404 Not Found` – Not found
- `401 Unauthorized` – Missing or invalid token
- `403 Forbidden` – Access denied
