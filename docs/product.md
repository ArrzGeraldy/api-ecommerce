# Product API Spec

# Get All Product

🟢 `GET` /api/v1/products
**🔎 Query Parameter:**
| Name | type | Required | Default | Description |
| -------- | ------ | -------- | ------- | ------------------------ |
| limit | Number | ❌ | 10 | Number of users per page |
| page | Number | ❌ | 1 | Page number to retrieve |
| parent | String | ❌ | - | Get product by parent category (`VALUES=:slug`) |
| child | Number | ❌ | - | Get product by child category id |
| search | String | ❌ | - | Get product by name |
| sort | String | ❌ | - | Supported values: `best_seller` `lowest_price` `highest_price` |

---

Response Success (200):

```json
{
  "data": [
    {
      "id": "UUID",
      "name": "product-1",
      "total_sale": 10,
      "price": 100000,
      "discount": null,
      "img_url": "http://example.com/public/uploads/image.jpg",
      "description": "description about product",
      "is_active": true,
      "category": {
        "id": 2,
        "name": "Dress",
        "slug": "dress",
        "parent": {
          "id": 1,
          "name": "Women",
          "slug": "women"
        },
      },
      "variants": [
        {
          "name": "S",
          "price_diff": 0,
          "stock": 100,
          "is_active": true
        },
        {
          "name": "XXL",
          "price_diff": 10000,
          "stock": 100,
          "is_active": true
        }
      ]
    }
    ... (9 rows)
  ],
  "total_page": 10,
  "current_page": 1
}
```

# Create Product

🔵 `POST` /api/v1/products

**Headers:**

| Name          | Type   | Required | Description  |
| ------------- | ------ | -------- | ------------ |
| Authorization | string | ✅       | Bearer token |

**🔒 Access Control: `admin`**

**Content-Type**:
`multipart/form-data`

Request Field:

| Field         | Type    | Required | Description                       |
| ------------- | ------- | -------- | --------------------------------- |
| `name`        | string  | ✅       | Product name                      |
| `cost_price`  | integer | ✅       | Cost price in IDR                 |
| `price`       | integer | ✅       | Base price in IDR                 |
| `discount`    | integer | ❌       | Optional discount                 |
| `category_id` | integer | ✅       | ID of category (must be child)    |
| `description` | string  | ✅       | Product description               |
| `image`       | file    | ✅       | Product image (JPG, PNG, etc.)    |
| `variants`    | string  | ✅       | JSON string array of variant list |

### `variants` Example (JSON string):

```json
[
  { "name": "Size 40", "price_diff": 0, "stock": 8 },
  { "name": "Size 43", "price_diff": 30000, "stock": 4 }
]
```

Request Success (200):

```json
{
  "data": {
    "id": "uuid",
    "name": "Product Name",
    "price": 1500000,
    "discount": 100000,
    "img_url": "http://abc.com/uploads/filename.jpg",
    "variants": [
      {
        "name": "Size 40",
        "price_diff": 0,
        "stock": 5
      },
      {
        "name": "Size 41",
        "price_diff": 25000,
        "stock": 10
      }
    ]
  }
}
```

Response Error (400):

```json
{
  "errors": "Field name is required"
}
```

## Update Product

🟡 `PUT` /api/v1/products/:id

**Headers:**

| Name          | Type   | Required | Description  |
| ------------- | ------ | -------- | ------------ |
| Authorization | string | ✅       | Bearer token |

**🔒 Access Control:** `admin`

---

### 📦 Content-Type

`multipart/form-data`

---

### 🧾 Request Fields

| Field         | Type    | Required | Description                           |
| ------------- | ------- | -------- | ------------------------------------- |
| `name`        | string  | ❌       | Product name                          |
| `price`       | integer | ❌       | Base price in IDR                     |
| `discount`    | integer | ❌       | Discount in IDR                       |
| `category_id` | integer | ❌       | ID of category (must be a child)      |
| `description` | string  | ❌       | Product description                   |
| `image`       | file    | ❌       | Product image (JPG, PNG, etc.)        |
| `variants`    | string  | ❌       | JSON string array of updated variants |

📌 You only need to send the fields you want to update.

---

### `variants` Example (JSON string):

```json
[
  { "name": "Size 40", "price_diff": 0, "stock": 8 },
  { "name": "Size 43", "price_diff": 30000, "stock": 4 }
]
```

Request Success (200):

```json
{
  "data": {
    "id": "uuid",
    "name": "Product Name",
    "price": 1500000,
    "discount": 100000,
    "img_url": "http://abc.com/uploads/updated_image.jpg",
    "variants": [
      {
        "id": 1,
        "name": "Size 40",
        "price_diff": 0,
        "stock": 8
      },
      {
        "id": 3,
        "name": "Size 43",
        "price_diff": 30000,
        "stock": 4
      }
    ]
  }
}
```

Response Error (400):

```json
{
  "errors": "max length name 100"
}
```
