import supertest from "supertest";
import { cleanupOrderTest, setupOrderTest } from "./utils/util-test";
import { app } from "../src/app/app";
import { createTestUser, deleteTestUser } from "./utils/user";
import { createTestProduct, deleteTestProduct } from "./utils/product";
import { createTestProductVariant, deleteTestVariant } from "./utils/variant";
import { countTotalOrder, deleteTestOrder } from "./utils/order";

describe("GET /api/v1/orders", () => {
  /**@type {import('./utils/util-test').OrderTestEnv} */
  let state;
  const limit = 10;
  const page = 1;
  beforeAll(async () => {
    state = await setupOrderTest(supertest, app);
  });

  afterAll(async () => {
    await cleanupOrderTest(state);
  });

  it("should get all order", async () => {
    const res = await supertest(app)
      .get(`/api/v1/orders?page=${page}&limit=${limit}`)
      .set("Authorization", `Bearer ${state.tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.total_page).toBeDefined();
    expect(res.body.total_data).toBeDefined();
    expect(res.body.current_page).toBe(page);
    expect(res.body.per_page).toBe(limit);
    expect(Array.isArray(res.body.data)).toBe(true);

    if (res.body.data.length > 0) {
      expect(res.body.data[0].user_id).toBe(state.userId);
      expect(res.body.data[0].order_items).toBeDefined();
      expect(res.body.data[0].payment).toBeDefined();
      expect(res.body.data[0].payment.va_number).toBeDefined();
    }
  });

  it("should return empty data when page > total pages", async () => {
    const total = await countTotalOrder();
    const totalPage = Math.ceil(total / limit);
    const res = await supertest(app)
      .get(`/api/v1/orders?page=${totalPage + 1}&limit=${limit}`)
      .set("Authorization", `Bearer ${state.tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.total_page).toBeDefined();
    expect(res.body.total_data).toBeDefined();
    expect(res.body.current_page).toBe(totalPage + 1);
    expect(res.body.per_page).toBe(limit);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(0);
  });

  it("should filter orders by status", async () => {
    const res = await supertest(app)
      .get(`/api/v1/orders?status=pending&page=${page}&limit=${limit}`)
      .set("Authorization", `Bearer ${state.tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.total_page).toBeDefined();
    expect(res.body.total_data).toBeDefined();
    expect(res.body.current_page).toBe(page);
    expect(res.body.per_page).toBe(limit);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length > 0).toBe(true);
  });

  it("should reject invalid status filter", async () => {
    const res = await supertest(app)
      .get(`/api/v1/orders?status=INVALID&page=${page}&limit=${limit}`)
      .set("Authorization", `Bearer ${state.tokenAdmin}`);

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject if not admin", async () => {
    const res = await supertest(app)
      .get(`/api/v1/orders`)
      .set("Authorization", `Bearer ${state.tokenUser}`);

    expect(res.status).toBe(403);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject if unauthorized", async () => {
    const res = await supertest(app).get(`/api/v1/orders`);

    expect(res.status).toBe(401);
    expect(res.body.errors).toBeDefined();
  });
});

describe("GET /api/v1/users/:userId/orders", () => {
  /**@type {import('./utils/util-test').OrderTestEnv} */
  let state;
  const limit = 10;
  const page = 1;
  beforeAll(async () => {
    state = await setupOrderTest(supertest, app);
  });

  afterAll(async () => {
    await cleanupOrderTest(state);
  });

  it("should get user orders", async () => {
    const res = await supertest(app)
      .get(`/api/v1/users/${state.userId}/orders?page=${page}&limit=${limit}`)
      .set("Authorization", `Bearer ${state.tokenUser}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.total_page).toBeDefined();
    expect(res.body.total_data).toBeDefined();
    expect(res.body.current_page).toBe(page);
    expect(res.body.per_page).toBe(limit);
    expect(Array.isArray(res.body.data)).toBe(true);

    if (res.body.data.length > 0) {
      expect(res.body.data[0].user_id).toBe(state.userId);
      expect(res.body.data[0].order_items).toBeDefined();
      expect(res.body.data[0].order_items[0].product_variant).toBeDefined();
      expect(
        res.body.data[0].order_items[0].product_variant.product
      ).toBeDefined();
      expect(res.body.data[0].payment).toBeDefined();
      expect(res.body.data[0].payment.va_number).toBeDefined();
    }
  });

  it("should return empty data when page > total pages", async () => {
    const total = await countTotalOrder({ user_id: state.userId });
    const totalPage = Math.ceil(total / limit);
    const res = await supertest(app)
      .get(
        `/api/v1/users/${state.userId}/orders?page=${
          totalPage + 1
        }&limit=${limit}`
      )
      .set("Authorization", `Bearer ${state.tokenUser}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.total_page).toBeDefined();
    expect(res.body.total_data).toBeDefined();
    expect(res.body.current_page).toBe(totalPage + 1);
    expect(res.body.per_page).toBe(limit);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(0);
  });

  it("should filter orders by status", async () => {
    const res = await supertest(app)
      .get(
        `/api/v1/users/${state.userId}/orders?status=pending&page=${page}&limit=${limit}`
      )
      .set("Authorization", `Bearer ${state.tokenUser}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.total_page).toBeDefined();
    expect(res.body.total_data).toBeDefined();
    expect(res.body.current_page).toBe(page);
    expect(res.body.per_page).toBe(limit);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length > 0).toBe(true);
  });

  it("should reject invalid status filter", async () => {
    const res = await supertest(app)
      .get(
        `/api/v1/users/${state.userId}/orders?status=INVALID&page=${page}&limit=${limit}`
      )
      .set("Authorization", `Bearer ${state.tokenUser}`);

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject req.user.id !== :userId", async () => {
    const otherUserId = await createTestUser(
      "other@gmail.com",
      "order other",
      "order other"
    );

    const resUser = await supertest(app).post("/api/v1/auth/login").send({
      email: "other@gmail.com",
      password: "order other",
    });

    const otherToken = resUser.body.data.access_token;
    const res = await supertest(app)
      .get(
        `/api/v1/users/${state.userId}/orders?status=INVALID&page=${page}&limit=${limit}`
      )
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
    expect(res.body.errors).toBeDefined();

    await deleteTestUser("other@gmail.com");
  });

  it("should reject if unauthorized", async () => {
    const res = await supertest(app).get(
      `/api/v1/users/${state.userId}/orders?status=INVALID&page=${page}&limit=${limit}`
    );

    expect(res.status).toBe(401);
    expect(res.body.errors).toBeDefined();
  });
});

describe("GET /api/v1/orders/:id", () => {
  /**@type {import('./utils/util-test').OrderTestEnv} */
  let state;
  beforeAll(async () => {
    state = await setupOrderTest(supertest, app);
  });

  afterAll(async () => {
    await cleanupOrderTest(state);
  });

  it("should get order by id", async () => {
    const res = await supertest(app)
      .get(`/api/v1/orders/${state.orderId}`)
      .set("Authorization", `Bearer ${state.tokenUser}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.user_id).toBe(state.userId);
    expect(res.body.data.order_items).toBeDefined();
    expect(res.body.data.payment).toBeDefined();
    expect(res.body.data.payment.va_number).toBeDefined();
  });

  it("should get order by id req admin", async () => {
    const res = await supertest(app)
      .get(`/api/v1/orders/${state.orderId}`)
      .set("Authorization", `Bearer ${state.tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.user_id).toBe(state.userId);
    expect(res.body.data.order_items).toBeDefined();
    expect(res.body.data.payment).toBeDefined();
    expect(res.body.data.payment.va_number).toBeDefined();
  });

  it("should reject if another user req", async () => {
    await createTestUser("other@gmail.com", "otheruser", "other user");

    // Login as other user
    const resUser = await supertest(app).post("/api/v1/auth/login").send({
      email: "other@gmail.com",
      password: "other user",
    });
    const otherToken = resUser.body.data.access_token;
    const res = await supertest(app)
      .get(`/api/v1/orders/${state.orderId}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
    expect(res.body.errors).toBeDefined();

    await deleteTestUser("other@gmail.com");
  });

  it("should reject if unauthorized", async () => {
    const res = await supertest(app).get(`/api/v1/orders/${state.orderId}`);

    expect(res.status).toBe(401);
    expect(res.body.errors).toBeDefined();
  });
});

describe("POST /api/v1/orders", () => {
  /**@type {import('./utils/util-test').OrderTestEnv} */
  let state;
  beforeAll(async () => {
    state = await setupOrderTest(supertest, app);
  });

  afterAll(async () => {
    await cleanupOrderTest(state);
  });

  it("should create order successfully", async () => {
    const newProductId = await createTestProduct(state.childrenId, {
      price: 100000,
    });
    const newVariantId = await createTestProductVariant(newProductId, {
      price_diff: 40000,
    });

    const item = { product_variant_id: newVariantId, quantity: 10 };

    const res = await supertest(app)
      .post(`/api/v1/orders`)
      .set("Authorization", `Bearer ${state.tokenUser}`)
      .send({
        items: [item],
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.user_id).toBe(state.userId);
    expect(res.body.data.base_price).toBe(140000 * 10);

    await deleteTestOrder(res.body.data.id);
    await deleteTestVariant(newVariantId);
    await deleteTestProduct(newProductId);
  });

  it("should reject if req quantity > stock variant", async () => {
    const newProductId = await createTestProduct(state.childrenId, {
      price: 100000,
    });
    const newVariantId = await createTestProductVariant(newProductId, {
      price_diff: 40000,
      stock: 10,
    });

    const item = { product_variant_id: newVariantId, quantity: 20 };

    const res = await supertest(app)
      .post(`/api/v1/orders`)
      .set("Authorization", `Bearer ${state.tokenUser}`)
      .send({
        items: [item],
      });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();

    await deleteTestVariant(newVariantId);
    await deleteTestProduct(newProductId);
  });

  it("should reject if invalid req", async () => {
    const newProductId = await createTestProduct(state.childrenId, {
      price: 100000,
    });
    const newVariantId = await createTestProductVariant(newProductId, {
      price_diff: 40000,
      stock: 10,
    });

    const item = { product_variant_id: newVariantId, quantity: 20 };

    const res = await supertest(app)
      .post(`/api/v1/orders`)
      .set("Authorization", `Bearer ${state.tokenUser}`)
      .send({
        items: item,
      });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();

    await deleteTestVariant(newVariantId);
    await deleteTestProduct(newProductId);
  });

  it("should reject if variant not found", async () => {
    const newProductId = await createTestProduct(state.childrenId, {
      price: 100000,
    });
    const newVariantId = await createTestProductVariant(newProductId, {
      price_diff: 40000,
      stock: 10,
    });

    const item = { product_variant_id: 9999, quantity: 5 };

    const res = await supertest(app)
      .post(`/api/v1/orders`)
      .set("Authorization", `Bearer ${state.tokenUser}`)
      .send({
        items: [item],
      });

    expect(res.status).toBe(404);
    expect(res.body.errors).toBeDefined();

    await deleteTestVariant(newVariantId);
    await deleteTestProduct(newProductId);
  });

  it("should reject if unauthorized", async () => {
    const newProductId = await createTestProduct(state.childrenId, {
      price: 100000,
    });
    const newVariantId = await createTestProductVariant(newProductId, {
      price_diff: 40000,
    });

    const item = { product_variant_id: newVariantId, quantity: 10 };

    const res = await supertest(app)
      .post(`/api/v1/orders`)
      .send({
        items: [item],
      });

    expect(res.status).toBe(401);
    expect(res.body.errors).toBeDefined();

    await deleteTestVariant(newVariantId);
    await deleteTestProduct(newProductId);
  });
});

describe("POST /api/v1/orders/:id/payment", () => {
  /**@type {import('./utils/util-test').OrderTestEnv} */
  let state;
  beforeAll(async () => {
    state = await setupOrderTest(supertest, app);
  });

  afterAll(async () => {
    await cleanupOrderTest(state);
  });

  it("should create order payment successfully", async () => {
    const item = { product_variant_id: state.variantId, quantity: 10 };

    const res = await supertest(app)
      .post(`/api/v1/orders`)
      .set("Authorization", `Bearer ${state.tokenUser}`)
      .send({
        items: [item],
      });

    expect(res.status).toBe(201);

    const resPayment = await supertest(app)
      .post(`/api/v1/orders/${res.body.data.id}/payment`)
      .set("Authorization", `Bearer ${state.tokenUser}`)
      .send({
        shipping_courier: "JNE",
        bank: "bca",
        address: {
          city: "city",
          phone: "0888889999",
          postal_code: "4312",
          province: "province",
          recipient_name: "test-name",
        },
      });

    expect(resPayment.status).toBe(200);
    expect(resPayment.body.data).toBeDefined();
    expect(resPayment.body.data.bank).toBe("bca");
    expect(resPayment.body.data.va_number).toBeDefined();
    expect(resPayment.body.data.order_id === res.body.data.id).toBe(true);

    await deleteTestOrder(res.body.data.id);
  });

  it("should reject if invalid address", async () => {
    const item = { product_variant_id: state.variantId, quantity: 10 };

    const res = await supertest(app)
      .post(`/api/v1/orders`)
      .set("Authorization", `Bearer ${state.tokenUser}`)
      .send({
        items: [item],
      });

    expect(res.status).toBe(201);

    const resPayment = await supertest(app)
      .post(`/api/v1/orders/${res.body.data.id}/payment`)
      .set("Authorization", `Bearer ${state.tokenUser}`)
      .send({
        shipping_courier: "JNE",
        bank: "bca",
        address: {
          city: "city",
          postal_code: "4312",
          province: "province",
          recipient_name: "test-name",
        },
      });

    expect(resPayment.status).toBe(400);
    expect(resPayment.body.errors).toBeDefined();

    await deleteTestOrder(res.body.data.id);
  });

  it("should reject if invalid bank not allowed", async () => {
    const item = { product_variant_id: state.variantId, quantity: 10 };

    const res = await supertest(app)
      .post(`/api/v1/orders`)
      .set("Authorization", `Bearer ${state.tokenUser}`)
      .send({
        items: [item],
      });

    expect(res.status).toBe(201);

    const resPayment = await supertest(app)
      .post(`/api/v1/orders/${res.body.data.id}/payment`)
      .set("Authorization", `Bearer ${state.tokenUser}`)
      .send({
        shipping_courier: "JNE",
        bank: "not allowed bank",
        address: {
          city: "city",
          phone: "0888889999",
          postal_code: "4312",
          province: "province",
          recipient_name: "test-name",
        },
      });

    expect(resPayment.status).toBe(400);
    expect(resPayment.body.errors).toBeDefined();

    await deleteTestOrder(res.body.data.id);
  });

  it("should reject if shipping courier not include", async () => {
    const item = { product_variant_id: state.variantId, quantity: 10 };

    const res = await supertest(app)
      .post(`/api/v1/orders`)
      .set("Authorization", `Bearer ${state.tokenUser}`)
      .send({
        items: [item],
      });

    expect(res.status).toBe(201);

    const resPayment = await supertest(app)
      .post(`/api/v1/orders/${res.body.data.id}/payment`)
      .set("Authorization", `Bearer ${state.tokenUser}`)
      .send({
        bank: "bca",
        address: {
          city: "city",
          phone: "0888889999",
          postal_code: "4312",
          province: "province",
          recipient_name: "test-name",
        },
      });

    expect(resPayment.status).toBe(400);
    expect(resPayment.body.errors).toBeDefined();

    await deleteTestOrder(res.body.data.id);
  });

  it("should reject if order not found", async () => {
    const resPayment = await supertest(app)
      .post(`/api/v1/orders/invalid.order.id/payment`)
      .set("Authorization", `Bearer ${state.tokenUser}`)
      .send({
        shipping_courier: "JNE",
        bank: "bca",
        address: {
          city: "city",
          phone: "0888889999",
          postal_code: "4312",
          province: "province",
          recipient_name: "test-name",
        },
      });

    expect(resPayment.status).toBe(404);
    expect(resPayment.body.errors).toBeDefined();
  });

  it("should reject if unauthorized", async () => {
    const item = { product_variant_id: state.variantId, quantity: 10 };

    const res = await supertest(app)
      .post(`/api/v1/orders`)
      .set("Authorization", `Bearer ${state.tokenUser}`)
      .send({
        items: [item],
      });

    expect(res.status).toBe(201);

    const resPayment = await supertest(app)
      .post(`/api/v1/orders/${res.body.data.id}/payment`)
      .set("Authorization", `Bearer invalid.token`)
      .send({
        shipping_courier: "JNE",
        bank: "bca",
        address: {
          city: "city",
          phone: "0888889999",
          postal_code: "4312",
          province: "province",
          recipient_name: "test-name",
        },
      });

    expect(resPayment.status).toBe(401);
    expect(resPayment.body.errors).toBeDefined();

    await deleteTestOrder(res.body.data.id);
  });
});
