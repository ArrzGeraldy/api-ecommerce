import path from "path";
import { createAdminUser, createTestUser, deleteTestUser } from "./user.js";
import {
  createTestChildrenCategory,
  createTestParentCategory,
  deleteTestCategory,
} from "./category.js";

import { createTestProduct, deleteTestProduct } from "./product.js";
import { createTestProductVariant } from "./variant.js";
import { createTestCartItem, deleteTestCartItem } from "./cart.js";
import { createTestAddress, deleteTestAddress } from "./address.js";
import {
  createTestOrder,
  createTestOrderItem,
  deleteTestOrder,
  deleteTestOrderItem,
} from "./order.js";
import { createTestPayment } from "./payment.js";
import { createTestShipping, deleteTestShippingByOrderId } from "./shipping.js";

export const getFileTest = () => {
  const imagePath = path.join(process.cwd(), "test/file-test/image-test.jpg");
  const largeImage = path.join(process.cwd(), "test/file-test/large-image.jpg"); // 2.6MB
  const pdfFile = path.join(process.cwd(), "test/file-test/test-pdf-file.pdf");

  return { imagePath, largeImage, pdfFile };
};

/**
 * @typedef {Object} TestEnvState
 * @property {number} userId
 * @property {number} parentId
 * @property {number} childrenId
 * @property {string} productId
 * @property {number} variantId
 * @property {string} tokenAdmin
 * @property {string} tokenUser
 */

/**
 * @param {import('supertest').SuperTest<import('supertest').Test>} supertest
 * @param {import('express').Application} app
 * @returns {Promise<TestEnvState>}
 */
export const prepareTestEnvironment = async (supertest, app) => {
  const state = {};

  // Create regular user
  const emailUser = "test.test@gmail.com";
  const passwordUser = "test test";
  state.userId = await createTestUser(emailUser, "Test User", passwordUser);

  // Create category and product
  state.parentId = await createTestParentCategory();
  state.childrenId = await createTestChildrenCategory(state.parentId);
  state.productId = await createTestProduct(state.childrenId);
  state.variantId = await createTestProductVariant(state.productId);

  // Create admin user
  await createAdminUser();

  // Login as admin
  const resAdmin = await supertest(app).post("/api/v1/auth/login").send({
    email: "test.admin@gmail.com",
    password: "admin123",
  });
  state.tokenAdmin = resAdmin.body.data.access_token;

  // Login as user
  const resUser = await supertest(app).post("/api/v1/auth/login").send({
    email: emailUser,
    password: passwordUser,
  });
  state.tokenUser = resUser.body.data.access_token;

  return state;
};

/**
 * @param {TestEnvState} state
 */
export const cleanupTestEnv = async (state) => {
  await deleteTestProduct(state.productId);
  await deleteTestCategory(state.childrenId);
  await deleteTestCategory(state.parentId);
  await deleteTestUser("test.test@gmail.com");
  await deleteTestUser("test.admin@gmail.com");
};

export const setupTestCartItem = async (state, supertest, app) => {
  // create user
  state.userId = await createTestUser(
    "cart.test@gmail.com",
    "cart test",
    "cart test"
  );

  // create category
  state.parentId = await createTestParentCategory();
  state.childrenId = await createTestChildrenCategory(state.parentId);

  // create product
  state.productId = await createTestProduct(state.childrenId);
  state.variantId = await createTestProductVariant(state.productId);

  // create cart item
  state.cartItemId = await createTestCartItem(state.userId, state.variantId);

  // get token admin
  await createAdminUser();
  const res = await supertest(app).post("/api/v1/auth/login").send({
    email: "test.admin@gmail.com",
    password: "admin123",
  });

  state.tokenAdmin = res.body.data.access_token;

  // get token user
  const res2 = await supertest(app).post("/api/v1/auth/login").send({
    email: "cart.test@gmail.com",
    password: "cart test",
  });

  state.tokenUser = res2.body.data.access_token;
};

export const cleanUpTestCartItem = async (state) => {
  // delete cart item
  await deleteTestCartItem(state.cartItemId);
  await deleteTestProduct(state.productId);
  await deleteTestUser("cart.test@gmail.com");
  await deleteTestUser("test.admin@gmail.com");
};

// ========================= setup test =========================

export const setupProductTest = async (supertest, app) => {
  return await prepareTestEnvironment(supertest, app);
};

/**
 * @param {TestEnvState} state
 */
export const cleanupProductTest = async (state) => {
  await cleanupTestEnv(state);
};

/**
 * @typedef {TestEnvState & {
 *   orderId: string,
 *   orderItemId: number
 *   paymentId: number
 * }} OrderTestEnv
 */

export const setupOrderTest = async (supertest, app) => {
  const state = await prepareTestEnvironment(supertest, app);

  const orderId = await createTestOrder(state.userId);
  const orderItemId = await createTestOrderItem(orderId, state.variantId);
  const paymentId = await createTestPayment(orderId);
  await createTestShipping(orderId);

  return {
    ...state,
    orderId,
    orderItemId,
    paymentId,
  };
};

/**
 * @param {OrderTestEnv} state
 */
export const cleanupOrderTest = async (state) => {
  await deleteTestOrderItem(state.orderItemId);
  await deleteTestOrder(state.orderId);
  await cleanupTestEnv(state);
};
