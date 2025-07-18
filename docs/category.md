# Category API Spec

## Get All Category

🟢 `GET` /api/v1/categories

**🔎 Query Parameter:**
| Name | type | Required | Default | Description |
| -------- | ------ | -------- | ------- | ------------------------ |
| limit | Number | ❌ | 10 | Number of users per page |
| page | Number | ❌ | 1 | Page number to retrieve |

---

Response Success (200):

```json
{
  "data": [
    {
      "id": 1,
      "name": "Women",
      "slug": "women",
      "children": [
        {
          "id": 14,
          "name": "Dress Top",
          "slug": "dress-top"
        },
      ]
    },
    {
      "id": 1,
      "name": "Men",
      "slug": "men",
      "children": [
        {
          "id": 24,
          "name": "Top",
          "slug": "top",
        },
      ]
    },
    ....
  ]
}
```

## Create Category

🔵 `POST` /api/v1/categories

**Headers:**

| Name          | Type   | Required | Description  |
| ------------- | ------ | -------- | ------------ |
| Authorization | string | ✅       | Bearer token |

**🔒 Access Control: `admin`**

Request Body:

```json
{
  "name": "name category",
  "parent_id": null
}
```

Response Success (200):

```json
{
  "data": {
    "id": 1,
    "name": "name category",
    "parent_id": null
  }
}
```

Response Error (400):

```json
{
  "errors": "name is required"
}
```

## Update Category

🟡 `PUT` /api/v1/categories/:id

**Headers:**

| Name          | Type   | Required | Description  |
| ------------- | ------ | -------- | ------------ |
| Authorization | string | ✅       | Bearer token |

**🔒 Access Control: `admin`**

Request Body:

```json
{
  "name": "name category",
  "parent_id": 1
}
```

Response Success (200):

```json
{
  "data": {
    "id": 2,
    "name": "name category",
    "parent_id": 1
  }
}
```

Response Error (400):

```json
{
  "errors": "name is required"
}
```

## Delete Category

🔴 `DELETE` /api/v1/categories/:id

**Headers:**

| Name          | Type   | Required | Description  |
| ------------- | ------ | -------- | ------------ |
| Authorization | string | ✅       | Bearer token |

**🔒 Access Control: `admin`**

Response Success (200):

```json
{
  "data": null
}
```

Response Error (403):

```json
{
  "errors": "access denied"
}
```

#### 🟢 Status Code:

- `200 OK` – Request successful
- `404 Not Found` – Not found
- `401 Unauthorized` – Missing or invalid token
- `403 Forbidden` – Access denied
