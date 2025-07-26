import supertest from "supertest";
import { app } from "../src/app/app.js";
import {
  createTestChildrenCategory,
  createTestParentCategory,
  deleteTestCategory,
} from "./utils/category.js";
import {
  createAdminUser,
  createTestUser,
  deleteTestUser,
} from "./utils/user.js";
import { logger } from "../src/app/logger.js";
import { createTestProduct, deleteTestProduct } from "./utils/product.js";
const url = "/api/v1/categories";

describe(`GET ${url}`, () => {
  it("should can get category tree", async () => {
    const res = await supertest(app).get(url).query({ type: "tree" });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data[0].children).toBeDefined();
  });
});

describe(`POST ${url}`, () => {
  let token;
  beforeAll(async () => {
    await createAdminUser();
    const res = await supertest(app).post("/api/v1/auth/login").send({
      email: "test.admin@gmail.com",
      password: "admin123",
    });

    token = res.body.data.access_token;
  });

  afterAll(async () => {
    await deleteTestUser("test.admin@gmail.com");
  });

  it("should can create parent category", async () => {
    const res = await supertest(app)
      .post(url)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "test",
        parent_id: null,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("test");
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.parent_id).toBe(null);

    await deleteTestCategory(res.body.data.id);
  });

  it("should can create children category", async () => {
    const parentId = await createTestParentCategory();
    const res = await supertest(app)
      .post(url)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "test-2",
        parent_id: parentId,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("test-2");
    expect(res.body.data.parent_id).toBe(parentId);
    expect(res.body.data.id).toBeDefined();
    await deleteTestCategory(res.body.data.id);
    await deleteTestCategory(parentId);
  });

  it("should reject if request is invalid", async () => {
    const res = await supertest(app)
      .post(url)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "",
        parent_id: 1,
      });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject if not send token", async () => {
    const res = await supertest(app).post(url).send({
      name: "test-4",
      parent_id: 1,
    });

    expect(res.status).toBe(401);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject if not admin", async () => {
    await createTestUser();
    let res = await supertest(app).post("/api/v1/auth/login").send({
      email: "test@example.com",
      password: "test1234",
    });

    expect(res.status).toBe(200);

    const tokenUser = res.body.data.access_token;
    res = await supertest(app)
      .post(url)
      .set("Authorization", `Bearer ${tokenUser}`)
      .send({
        name: "test-5",
        parent_id: 1,
      });

    expect(res.status).toBe(403);
    expect(res.body.errors).toBeDefined();
    await deleteTestUser("test@example.com");
    logger.info("user test deleted in post");
  });
});

describe(`PUT ${url}/:id`, () => {
  let token;
  let id;
  beforeAll(async () => {
    await createAdminUser();
    let res = await supertest(app).post("/api/v1/auth/login").send({
      email: "test.admin@gmail.com",
      password: "admin123",
    });

    token = res.body.data.access_token;

    id = await createTestParentCategory();
  });

  afterAll(async () => {
    await deleteTestUser("test.admin@gmail.com");
    await deleteTestCategory(id);
  });

  it("should can update category", async () => {
    const res = await supertest(app)
      .put(`${url}/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "update-1",
        parent_id: null,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("update-1");
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.parent_id).toBe(null);
  });

  it("should reject if request is invalid", async () => {
    const res = await supertest(app)
      .put(`${url}/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "",
        parent_id: 1,
      });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject if not send token", async () => {
    const res = await supertest(app).put(`${url}/${id}`).send({
      name: "test-4",
      parent_id: 1,
    });

    expect(res.status).toBe(401);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject if not admin", async () => {
    await createTestUser();
    let res = await supertest(app).post("/api/v1/auth/login").send({
      email: "test@example.com",
      password: "test1234",
    });

    expect(res.status).toBe(200);

    const tokenUser = res.body.data.access_token;
    res = await supertest(app)
      .put(`${url}/${id}`)
      .set("Authorization", `Bearer ${tokenUser}`)
      .send({
        name: "update-5",
        parent_id: 1,
      });

    expect(res.status).toBe(403);
    expect(res.body.errors).toBeDefined();
    await deleteTestUser("test@example.com");
    logger.info("user test deleted in post");
  });
});

describe(`DELETE ${url}/:id`, () => {
  let token;
  let parentId;
  let childrenId;
  beforeAll(async () => {
    await createAdminUser();
    let res = await supertest(app).post("/api/v1/auth/login").send({
      email: "test.admin@gmail.com",
      password: "admin123",
    });

    token = res.body.data.access_token;
    // create parent
    parentId = await createTestParentCategory();
    // create children
    childrenId = await createTestChildrenCategory(parentId);
  });

  afterAll(async () => {
    await deleteTestUser("test.admin@gmail.com");
    await deleteTestCategory(childrenId);
    await deleteTestCategory(parentId);
  });

  // // should reject if category not found
  it("should reject if category not found", async () => {
    const res = await supertest(app)
      .delete(`${url}/9999`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.errors).toBeDefined();
  });

  // // should reject if not send token
  it("should reject if not send token", async () => {
    const res = await supertest(app).delete(`${url}/${parentId}`);

    expect(res.status).toBe(401);
    expect(res.body.errors).toBeDefined();
  });

  // // should reject if not admin
  it("should reject if not admin", async () => {
    await createTestUser();
    let res = await supertest(app).post("/api/v1/auth/login").send({
      email: "test@example.com",
      password: "test1234",
    });

    expect(res.status).toBe(200);

    const tokenUser = res.body.data.access_token;
    res = await supertest(app)
      .delete(`${url}/${parentId}`)
      .set("Authorization", `Bearer ${tokenUser}`);

    expect(res.status).toBe(403);
    expect(res.body.errors).toBeDefined();
    await deleteTestUser("test@example.com");
    logger.info("user test deleted in post");
  });

  // // success hard delete parent category without any relation
  it("should success hard delete parent category with no relation", async () => {
    // create parent with no relation
    const categoryId = await createTestParentCategory();

    const del = await supertest(app)
      .delete(`${url}/${categoryId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(del.status).toBe(200);
    expect(del.body.data).toBeNull();
  });

  // // failed delete parent category if has children
  it("should failed delete parent category if has children", async () => {
    const del = await supertest(app)
      .delete(`${url}/${parentId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(del.status).toBe(400);
    expect(del.body.errors).toBeDefined();
  });

  // // success hard delete child category without any product
  it("should success hard delete child category without any product", async () => {
    // create children with no relation product
    const categoryId = await createTestChildrenCategory(parentId);

    const del = await supertest(app)
      .delete(`${url}/${categoryId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(del.status).toBe(200);
    expect(del.body.data).toBeNull();
  });

  // success soft delete child category with products
  it("should success soft delete child category with products", async () => {
    // create children category
    const childWithCategoryId = await createTestChildrenCategory(parentId);

    // create product
    const product = await createTestProduct(childWithCategoryId);

    const del = await supertest(app)
      .delete(`${url}/${childWithCategoryId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(del.status).toBe(200);
    expect(del.body.data.deleted_at).toBeDefined();

    await deleteTestProduct(product.id);
    await deleteTestCategory(childWithCategoryId);
  });
});
