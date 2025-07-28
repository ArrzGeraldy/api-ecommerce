import { cleanUpTestCartItem, setupTestCartItem } from "./utils/util-test";
import supertest from "supertest";
import { app } from "../src/app/app";
import { createTestUser, deleteTestUser } from "./utils/user";
import { createTestProduct, deleteTestProduct } from "./utils/product";
import { createTestProductVariant, deleteTestVariant } from "./utils/variant";
import {
  countCartItemById,
  createTestCartItem,
  deleteTestCartItem,
} from "./utils/cart";

/**
 * @typedef {Object} TestCartItemState
 * @property {number} [userId]
 * @property {number} [parentId]
 * @property {number} [childrenId]
 * @property {string} [productId]
 * @property {number} [variantId]
 * @property {number} [cartItemId]
 * @property {string} [tokenUser]
 * @property {string} [tokenAdmin]
 */

describe("GET /api/v1/users/:userId/cart", () => {
  /** @type {TestCartItemState} */
  const state = {};
  beforeAll(async () => {
    await setupTestCartItem(state, supertest, app);
  });
  afterAll(async () => {
    await cleanUpTestCartItem(state);
  });

  it("should get list of cart item user by id", async () => {
    const res = await supertest(app)
      .get(`/api/v1/users/${state.userId}/cart`)
      .set("Authorization", `Bearer ${state.tokenUser}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data[0]).toBeDefined();
    expect(res.body.data[0].product_variant.id).toBeDefined();
    expect(res.body.data[0].product_variant.product).toBeDefined();
    expect(res.body.data[0].amount).toBeDefined();
  });

  it("should return empty cart if user has no cart items", async () => {
    const otherUserId = await createTestUser(
      "other@gmail.com",
      "cart other",
      "cart other"
    );

    const resUser = await supertest(app).post("/api/v1/auth/login").send({
      email: "other@gmail.com",
      password: "cart other",
    });

    const otherToken = resUser.body.data.access_token;
    const res = await supertest(app)
      .get(`/api/v1/users/${otherUserId}/cart`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(0);

    await deleteTestUser("other@gmail.com");
  });

  it("should get list of cart req admin", async () => {
    const res = await supertest(app)
      .get(`/api/v1/users/${state.userId}/cart`)
      .set("Authorization", `Bearer ${state.tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
  });

  it("should get reject if user not owner cart or admin", async () => {
    const otherUserId = await createTestUser(
      "other@gmail.com",
      "cart other",
      "cart other"
    );

    const resUser = await supertest(app).post("/api/v1/auth/login").send({
      email: "other@gmail.com",
      password: "cart other",
    });

    const otherToken = resUser.body.data.access_token;
    const res = await supertest(app)
      .get(`/api/v1/users/${state.userId}/cart`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
    expect(res.body.errors).toBeDefined();
    await deleteTestUser("other@gmail.com");
  });

  it("should get reject if not send token", async () => {
    const res = await supertest(app).get(`/api/v1/users/${state.userId}/cart`);

    expect(res.status).toBe(401);
    expect(res.body.errors).toBeDefined();
  });
});

describe("POST /api/v1/users/:userId/cart", () => {
  /** @type {TestCartItemState} */
  const state = {};
  beforeAll(async () => {
    await setupTestCartItem(state, supertest, app);
  });
  afterAll(async () => {
    await cleanUpTestCartItem(state);
  });

  it("should insert cart item successfully", async () => {
    const newProductId = await createTestProduct(state.childrenId, {
      price: 20000,
    });

    const newVariantId = await createTestProductVariant(newProductId);
    const res = await supertest(app)
      .post(`/api/v1/users/${state.userId}/cart`)
      .set("Authorization", `Bearer ${state.tokenUser}`)
      .send({
        product_variant_id: newVariantId,
        quantity: 10,
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBeDefined();

    await deleteTestCartItem(res.body.data.id);
    await deleteTestProduct(newProductId);
  });

  it("should update cart item if user already have product in cart", async () => {
    const newProductId = await createTestProduct(state.childrenId, {
      price: 20000,
    });

    const newVariantId = await createTestProductVariant(newProductId, {
      stock: 100,
    });

    const newCartId = await createTestCartItem(state.userId, newVariantId, 5);

    const res = await supertest(app)
      .post(`/api/v1/users/${state.userId}/cart`)
      .set("Authorization", `Bearer ${state.tokenUser}`)
      .send({
        product_variant_id: newVariantId,
        quantity: 10,
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.quantity).toBe(15);

    await deleteTestCartItem(res.body.data.id);
    await deleteTestProduct(newProductId);
  });

  it("should rejcet if product variant not found", async () => {
    const newProductId = await createTestProduct(state.childrenId, {
      price: 20000,
    });

    const res = await supertest(app)
      .post(`/api/v1/users/${state.userId}/cart`)
      .set("Authorization", `Bearer ${state.tokenUser}`)
      .send({
        product_variant_id: 99999,
        quantity: 10,
      });

    expect(res.status).toBe(404);
    expect(res.body.errors).toBeDefined();

    await deleteTestProduct(newProductId);
  });

  it("should reject if quantity req > stock", async () => {
    const newProductId = await createTestProduct(state.childrenId, {
      price: 20000,
    });

    const newVariantId = await createTestProductVariant(newProductId, {
      stock: 10,
    });

    const res = await supertest(app)
      .post(`/api/v1/users/${state.userId}/cart`)
      .set("Authorization", `Bearer ${state.tokenUser}`)
      .send({
        product_variant_id: newVariantId,
        quantity: 11,
      });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();

    await deleteTestProduct(newProductId);
  });

  it("should reject when already have item in cart and old quantity + new qty req > stock", async () => {
    const newProductId = await createTestProduct(state.childrenId, {
      price: 20000,
    });

    const newVariantId = await createTestProductVariant(newProductId, {
      stock: 10,
    });

    const newCartId = await createTestCartItem(state.userId, newVariantId, 5);

    const res = await supertest(app)
      .post(`/api/v1/users/${state.userId}/cart`)
      .set("Authorization", `Bearer ${state.tokenUser}`)
      .send({
        product_variant_id: newVariantId,
        quantity: 6,
      });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();

    await deleteTestCartItem(newCartId);
    await deleteTestProduct(newProductId);
  });

  it("should reject if other user tries to insert", async () => {
    const otherId = await createTestUser(
      "otherCart@example.com",
      "pass123123",
      "pass123123"
    );
    const loginRes = await supertest(app).post("/api/v1/auth/login").send({
      email: "otherCart@example.com",
      password: "pass123123",
    });

    const tokenOther = loginRes.body.data.access_token;

    const res = await supertest(app)
      .post(`/api/v1/users/${state.userId}/cart`)
      .set("Authorization", `Bearer ${tokenOther}`)
      .send({
        product_variant_id: state.variantId,
        quantity: 6,
      });

    expect(res.status).toBe(403);
    expect(res.body.errors).toBeDefined();
    await deleteTestUser("otherCart@example.com");
  });

  it("should reject if other user not send token", async () => {
    const res = await supertest(app)
      .post(`/api/v1/users/${state.userId}/cart`)
      .send({
        product_variant_id: state.variantId,
        quantity: 6,
      });

    expect(res.status).toBe(401);
    expect(res.body.errors).toBeDefined();
  });
});

describe("PATCH /api/v1/users/:userId/cart/:id", () => {
  /** @type {TestCartItemState} */
  const state = {};
  beforeAll(async () => {
    await setupTestCartItem(state, supertest, app);
  });
  afterAll(async () => {
    await cleanUpTestCartItem(state);
  });

  it("should update cart item successfully", async () => {
    const newProductId = await createTestProduct(state.childrenId, {
      price: 20000,
    });
    const newVariantId = await createTestProductVariant(newProductId, {
      stock: 100,
    });
    const newCartId = await createTestCartItem(state.userId, newVariantId, 5);

    const res = await supertest(app)
      .patch(`/api/v1/users/${state.userId}/cart/${newCartId}`)
      .set("Authorization", `Bearer ${state.tokenUser}`)
      .send({
        quantity: 10,
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.quantity).toBe(10);

    await deleteTestCartItem(res.body.data.id);
    await deleteTestProduct(newProductId);
  });

  it("should reject if send field not allowed", async () => {
    const res = await supertest(app)
      .patch(`/api/v1/users/${state.userId}/cart/${state.cartItemId}`)
      .set("Authorization", `Bearer ${state.tokenUser}`)
      .send({
        product_variant_id: state.variantId,
        quantity: 10,
      });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject if quantity req > stock", async () => {
    const res = await supertest(app)
      .patch(`/api/v1/users/${state.userId}/cart/${state.cartItemId}`)
      .set("Authorization", `Bearer ${state.tokenUser}`)
      .send({
        quantity: 9999,
      });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject if cart item not found", async () => {
    const res = await supertest(app)
      .patch(`/api/v1/users/${state.userId}/cart/${9999}`)
      .set("Authorization", `Bearer ${state.tokenUser}`)
      .send({
        quantity: 10,
      });

    expect(res.status).toBe(404);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject when already have item in cart and old quantity + new qty req > stock", async () => {
    const res = await supertest(app)
      .patch(`/api/v1/users/${state.userId}/cart/${state.cartItemId}`)
      .set("Authorization", `Bearer ${state.tokenUser}`)
      .send({
        quantity: 9999,
      });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject if other user tries to insert", async () => {
    const otherId = await createTestUser(
      "other@example.com",
      "pass132123",
      "pass132123"
    );
    const loginRes = await supertest(app).post("/api/v1/auth/login").send({
      email: "other@example.com",
      password: "pass132123",
    });

    const tokenOther = loginRes.body.data.access_token;

    const res = await supertest(app)
      .patch(`/api/v1/users/${state.userId}/cart/${state.cartItemId}`)
      .set("Authorization", `Bearer ${tokenOther}`)
      .send({
        product_variant_id: state.variantId,
        quantity: 1,
      });

    expect(res.status).toBe(403);
    expect(res.body.errors).toBeDefined();
    await deleteTestUser("other@example.com");
  });

  it("should reject if other user not send token", async () => {
    const res = await supertest(app)
      .patch(`/api/v1/users/${state.userId}/cart/${state.cartItemId}`)
      .send({
        quantity: 6,
      });

    expect(res.status).toBe(401);
    expect(res.body.errors).toBeDefined();
  });
});

describe("DELETE /api/v1/users/:userId/cart/:id", () => {
  /** @type {TestCartItemState} */
  const state = {};
  beforeAll(async () => {
    await setupTestCartItem(state, supertest, app);
  });
  afterAll(async () => {
    await cleanUpTestCartItem(state);
  });

  it("should delete cart item successfully", async () => {
    const newProductId = await createTestProduct(state.childrenId, {
      price: 20000,
    });
    const newVariantId = await createTestProductVariant(newProductId, {
      stock: 100,
    });
    const newCartId = await createTestCartItem(state.userId, newVariantId, 5);

    const res = await supertest(app)
      .delete(`/api/v1/users/${state.userId}/cart/${newCartId}`)
      .set("Authorization", `Bearer ${state.tokenUser}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();

    const count = await countCartItemById(newCartId);

    expect(count).toBe(0);

    await deleteTestProduct(newProductId);
  });

  it("should delete cart item successfully req admin", async () => {
    const newProductId = await createTestProduct(state.childrenId, {
      price: 20000,
    });
    const newVariantId = await createTestProductVariant(newProductId, {
      stock: 100,
    });
    const newCartId = await createTestCartItem(state.userId, newVariantId, 5);

    const res = await supertest(app)
      .delete(`/api/v1/users/${state.userId}/cart/${newCartId}`)
      .set("Authorization", `Bearer ${state.tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();

    const count = await countCartItemById(newCartId);

    expect(count).toBe(0);

    await deleteTestProduct(newProductId);
  });

  it("should reject delete if cart item not found", async () => {
    const res = await supertest(app)
      .delete(`/api/v1/users/${state.userId}/cart/${9999}`)
      .set("Authorization", `Bearer ${state.tokenUser}`);

    expect(res.status).toBe(404);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject if other user tries to insert", async () => {
    const otherId = await createTestUser(
      "other@example.com",
      "pass123123",
      "pass123123"
    );
    const loginRes = await supertest(app).post("/api/v1/auth/login").send({
      email: "other@example.com",
      password: "pass123123",
    });

    const tokenOther = loginRes.body.data.access_token;

    const res = await supertest(app)
      .delete(`/api/v1/users/${state.userId}/cart/${state.cartItemId}`)
      .set("Authorization", `Bearer ${tokenOther}`)
      .send({
        product_variant_id: state.variantId,
        quantity: 1,
      });

    expect(res.status).toBe(403);
    expect(res.body.errors).toBeDefined();
    await deleteTestUser("other@example.com");
  });

  it("should reject if other user not send token", async () => {
    const res = await supertest(app)
      .delete(`/api/v1/users/${state.userId}/cart/${state.cartItemId}`)
      .send({
        quantity: 6,
      });

    expect(res.status).toBe(401);
    expect(res.body.errors).toBeDefined();
  });
});
