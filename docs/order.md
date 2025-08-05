# Order API Spec

# Create Order

🔵 `POST` /api/v1/orders

**Authorization:** `Bearer <token>`

Request Body:

```json
{
  "items": [
    {
      "product_variant_id": 1,
      "quantity": 10
    },
    ...
  ],
  "address_id": 1,
  "shipping_courier": "JNE",
  "bank": "bca"
}
```

Request Success (200):

```json
{
  "data": {
    "id": "uuid",
    "address_id": 1,
    "shipping_courier": "JNE",
    "shipping_cost": 10000,
    "tracking_number": null,
    "base_price": 20000,
    "final_price": 30000,
    "status": "pending",
    "payment": {
      "id": 1,
      "method": "bank-transfer",
      "bank": "bca",
      "va_number": "123456",
      "status": "pending"
    },
    "order_items": [
      {
        "product_variant_id": 1,
        "quantity": 10,
        "amount": 10000
      },
      ...
    ]
  }
}
```

Response Error (400):

```json
{
  "errors": "Field bank is required"
}
```

# Get All Order

🟢 `GET` /api/v1/orders

**Authorization:** `Bearer <token>`

**🔒 Access Control: `admin`**

**🔎 Query Parameter:**
| Name | type | Required | Default | Description |
| -------- | ------ | -------- | ------- | ------------------------ |
| limit | Number | ❌ | 10 | Number of orders per page |
| page | Number | ❌ | 1 | Page number to retrieve |
| status | String | ❌ | - | Get order by status `VALUE(pending, progress, shipping, completed, canceled)` |

---
