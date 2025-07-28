import supertest from "supertest";
import {
  deleteTestProduct,
  getTestProduct,
  getVariantJsonTest,
} from "./utils/product.js";
import { app } from "../src/app/app.js";
import { getTestCategoryById } from "./utils/category.js";
import {
  deleteFromCloudinary,
  getPublicIdCloudinary,
} from "../src/utils/clodinary-util.js";
import { countVariantByProductIdTest } from "./utils/variant.js";
import {
  cleanupProductTest,
  getFileTest,
  setupProductTest,
} from "./utils/util-test.js";
import {
  createTestOrder,
  createTestOrderItem,
  deleteTestOrder,
  deleteTestOrderItem,
} from "./utils/order.js";
import { createTestAddress, deleteTestAddress } from "./utils/address.js";
import {
  countCartItemByProductTest,
  createTestCartItem,
} from "./utils/cart.js";

const { imagePath, largeImage, pdfFile } = getFileTest();
const variantsJson = getVariantJsonTest();

describe("GET /api/v1/products", () => {
  /** @type {import("./utils/util-test.js").TestEnvState} */
  let state;

  beforeAll(async () => {
    state = await setupProductTest(supertest, app);
  });

  afterAll(async () => {
    await cleanupProductTest(state);
  });

  it("should return all products without filter", async () => {
    const res = await supertest(app)
      .get("/api/v1/products")
      .query({ page: 1, limit: 10 });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
    if (res.body.data.length > 0) {
      expect(res.body.data[0].cost_price).toBeUndefined();
    }
    expect(res.body.total_data).toBeGreaterThan(0);
    expect(res.body.total_page).toBeGreaterThan(0);
  });

  it("should return all products with cost_price if req admin", async () => {
    const res = await supertest(app)
      .get("/api/v1/products")
      .set("Authorization", `Bearer ${state.tokenAdmin}`)
      .query({ page: 1, limit: 10 });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
    if (res.body.data.length > 0) {
      expect(res.body.data[0].cost_price).toBeDefined();
    }
    expect(res.body.total_data).toBeGreaterThan(0);
    expect(res.body.total_page).toBeGreaterThan(0);
  });

  it("should return filtered products by search", async () => {
    const res = await supertest(app)
      .get("/api/v1/products")
      .query({ page: 1, limit: 10, search: "test" });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    if (res.body.data.length > 0) {
      expect(res.body.data[0].cost_price).toBeUndefined();
    }
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("should return filtered products by category id", async () => {
    const res = await supertest(app)
      .get("/api/v1/products")
      .query({ page: 1, limit: 10, category: state.childrenId });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.every((p) => p.category.id === state.childrenId)).toBe(
      true
    );
  });

  it("should return filtered products by parent category slug", async () => {
    const category = await getTestCategoryById(state.parentId);
    const res = await supertest(app)
      .get("/api/v1/products")
      .query({ page: 1, limit: 10, parent: category.slug });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(
      res.body.data.every((p) => p.category.parent?.slug === category.slug)
    ).toBe(true);
  });
});

describe("GET /api/v1/products/:id", () => {
  /** @type {import("./utils/util-test.js").TestEnvState} */
  let state;

  beforeAll(async () => {
    state = await setupProductTest(supertest, app);
  });

  afterAll(async () => {
    await cleanupProductTest(state);
  });

  it("should get product by id", async () => {
    const res = await supertest(app).get(`/api/v1/products/${state.productId}`);

    expect(res.status).toBe(200);

    const product = res.body.data;

    expect(product).toBeDefined();
    expect(product.id).toBe(state.productId); // opsional, jika ingin lebih akurat
    expect(Array.isArray(product.product_variants)).toBe(true);
    expect(product.category).toBeDefined();
    expect(product.category.id).toBeDefined();
    expect(product.cost_price).toBeUndefined();

    if (product.category.parent !== null) {
      expect(product.category.parent.id).toBeDefined();
    }
  });

  it("should get product by id with cost_price req admin", async () => {
    const res = await supertest(app)
      .get(`/api/v1/products/${state.productId}`)
      .set("Authorization", `Bearer ${state.tokenAdmin}`);

    expect(res.status).toBe(200);

    const product = res.body.data;

    expect(product).toBeDefined();
    expect(product.id).toBe(state.productId); // opsional, jika ingin lebih akurat
    expect(Array.isArray(product.product_variants)).toBe(true);
    expect(product.category).toBeDefined();
    expect(product.category.id).toBeDefined();
    expect(product.cost_price).toBeDefined();

    if (product.category.parent !== null) {
      expect(product.category.parent.id).toBeDefined();
    }
  });

  it("should cost_price toBeUndefined if user login", async () => {
    const res = await supertest(app)
      .get(`/api/v1/products/${state.productId}`)
      .set("Authorization", `Bearer ${state.tokenUser}`);

    expect(res.status).toBe(200);

    const product = res.body.data;

    expect(product).toBeDefined();
    expect(product.id).toBe(state.productId); // opsional, jika ingin lebih akurat
    expect(Array.isArray(product.product_variants)).toBe(true);
    expect(product.category).toBeDefined();
    expect(product.category.id).toBeDefined();
    expect(product.cost_price).toBeUndefined();

    if (product.category.parent !== null) {
      expect(product.category.parent.id).toBeDefined();
    }
  });

  it("should reject product not found", async () => {
    const res = await supertest(app).get(`/api/v1/products/${9999}`);

    expect(res.status).toBe(404);
    expect(res.body.errors).toBeDefined();
  });
});

describe("POST /api/v1/products", () => {
  /** @type {import("./utils/util-test.js").TestEnvState} */
  let state;

  beforeAll(async () => {
    state = await setupProductTest(supertest, app);
  });

  afterAll(async () => {
    await cleanupProductTest(state);
  });

  it("should create a product successfully", async () => {
    const res = await supertest(app)
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${state.tokenAdmin}`)
      .field("name", "Test Product")
      .field("cost_price", 90000)
      .field("price", 100000)
      .field("category_id", state.childrenId)
      .field("description", "Test description")
      .field("variants", variantsJson)
      .attach("image", imagePath);

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("Test Product");
    expect(res.body.data.product_variants).toBeDefined();
    expect(res.body.data.img_url).toBeDefined();
    expect(res.body.data.id).toBeDefined();

    const publicId = getPublicIdCloudinary(res.body.data.img_url);
    await deleteFromCloudinary(publicId);

    await deleteTestProduct(res.body.data.id);
  });

  it("should reject if required fields are missing", async () => {
    const res = await supertest(app)
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${state.tokenAdmin}`)
      .field("name", "")
      .field("cost_price", 90000)
      .field("price", 100000)
      .field("category_id", state.childrenId)
      .field("description", "...")
      .field("variants", variantsJson)
      .attach("image", imagePath);

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject if variants is not json string", async () => {
    const res = await supertest(app)
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${state.tokenAdmin}`)
      .field("cost_price", 90000)
      .field("name", "Test Product")
      .field("price", 100000)
      .field("category_id", state.childrenId)
      .field("description", "Test description")
      .field("variants", "test variants")
      .attach("image", imagePath);

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject if variants not json array string", async () => {
    const res = await supertest(app)
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${state.tokenAdmin}`)
      .field("cost_price", 90000)
      .field("name", "Test Product")
      .field("price", 100000)
      .field("category_id", state.childrenId)
      .field("description", "Test description")
      .field("variants", JSON.stringify({ name: "S", price_diff: 0, stock: 8 }))
      .attach("image", imagePath);

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject if price not a number", async () => {
    const res = await supertest(app)
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${state.tokenAdmin}`)
      .field("cost_price", 90000)
      .field("name", "Test Product")
      .field("price", "price")
      .field("category_id", state.childrenId)
      .field("description", "Test description")
      .field("variants", variantsJson)
      .attach("image", imagePath);

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject if category_id not a number", async () => {
    const res = await supertest(app)
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${state.tokenAdmin}`)
      .field("cost_price", 90000)
      .field("name", "Test Product")
      .field("price", 100000)
      .field("category_id", "category id")
      .field("description", "Test description")
      .field("variants", variantsJson)
      .attach("image", imagePath);

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject if category not found", async () => {
    const res = await supertest(app)
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${state.tokenAdmin}`)
      .field("cost_price", 90000)
      .field("name", "Test Product")
      .field("price", 100000)
      .field("category_id", 99999)
      .field("description", "Test description")
      .field("variants", variantsJson)
      .attach("image", imagePath);

    expect(res.status).toBe(404);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject if category is parent", async () => {
    const res = await supertest(app)
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${state.tokenAdmin}`)
      .field("cost_price", 90000)
      .field("name", "Test Product")
      .field("price", 100000)
      .field("category_id", state.parentId)
      .field("description", "Test description")
      .field("variants", variantsJson)
      .attach("image", imagePath);

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  // should reject if key file not 'image'
  it("should reject if key file not 'image'", async () => {
    const res = await supertest(app)
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${state.tokenAdmin}`)
      .field("name", "Test Product")
      .field("cost_price", 90000)
      .field("price", 100000)
      .field("category_id", state.childrenId)
      .field("description", "Test description")
      .field("variants", variantsJson)
      .attach("picture", imagePath);

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  // should reject if file not (jpg, jpeg, png, webp)
  it("should reject if file not (jpg, jpeg, png, webp)", async () => {
    const res = await supertest(app)
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${state.tokenAdmin}`)
      .field("name", "Test Product")
      .field("cost_price", 90000)
      .field("price", 100000)
      .field("category_id", state.childrenId)
      .field("description", "Test description")
      .field("variants", variantsJson)
      .attach("image", pdfFile);

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  // should reject oversized image (>2MB)
  it("should reject oversized image (>2MB)", async () => {
    const res = await supertest(app)
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${state.tokenAdmin}`)
      .field("name", "Test Product")
      .field("cost_price", 90000)
      .field("price", 100000)
      .field("category_id", state.childrenId)
      .field("description", "Test description")
      .field("variants", variantsJson)
      .attach("image", largeImage);

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject if not admin", async () => {
    const res = await supertest(app)
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${state.tokenUser}`)
      .field("name", "Test Product Forbidden")
      .field("cost_price", 90000)
      .field("price", 100000)
      .field("category_id", state.childrenId)
      .field("description", "Test description")
      .field("variants", variantsJson);

    expect(res.status).toBe(403);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject if not send token", async () => {
    const res = await supertest(app)
      .post("/api/v1/products")
      .field("name", "Test Product Unauthorized")
      .field("cost_price", 90000)
      .field("price", 100000)
      .field("category_id", state.childrenId)
      .field("description", "Test description")
      .field("variants", variantsJson);

    expect(res.status).toBe(401);
    expect(res.body.errors).toBeDefined();
  });
});

describe("PATCH /api/v1/products/:id", () => {
  /** @type {import("./utils/util-test.js").TestEnvState} */
  let state;

  beforeAll(async () => {
    state = await setupProductTest(supertest, app);
  });

  afterAll(async () => {
    await cleanupProductTest(state);
  });

  it("should successfully update product without variants & image", async () => {
    const res = await supertest(app)
      .patch(`/api/v1/products/${state.productId}`)
      .set("Authorization", `Bearer ${state.tokenAdmin}`)
      .field("name", "Test Product Update")
      .field("price", 56789);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Test Product Update");
    expect(res.body.data.price).toBe(56789);
    expect(res.body.data.id).toBeDefined;
  });

  it("should successfully update product with image", async () => {
    const res = await supertest(app)
      .patch(`/api/v1/products/${state.productId}`)
      .set("Authorization", `Bearer ${state.tokenAdmin}`)
      .field("name", "Test Product Update")
      .field("price", 56789)
      .attach("image", imagePath);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Test Product Update");
    expect(res.body.data.price).toBe(56789);
    expect(res.body.data.img_url).toBeDefined();
    expect(res.body.data.id).toBeDefined();

    const publicId = getPublicIdCloudinary(res.body.data.img_url);
    await deleteFromCloudinary(publicId);
  });

  it("should successfully update product with image and variants", async () => {
    const variantPayload = [
      {
        id: state.variantId,
        name: "variant update",
        stock: 5,
        price_diff: 20000,
      },
    ];

    const res = await supertest(app)
      .patch(`/api/v1/products/${state.productId}`)
      .set("Authorization", `Bearer ${state.tokenAdmin}`)
      .field("name", "Test Product Update")
      .field("price", 56789)
      .field("variants", JSON.stringify(variantPayload))
      .attach("image", imagePath);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Test Product Update");
    expect(res.body.data.price).toBe(56789);
    expect(res.body.data.img_url).toBeDefined();
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.product_variants).toBeDefined();

    const publicId = getPublicIdCloudinary(res.body.data.img_url);
    await deleteFromCloudinary(publicId);
  });

  it("should reject if key file not 'image'", async () => {
    const res = await supertest(app)
      .patch(`/api/v1/products/${state.productId}`)
      .set("Authorization", `Bearer ${state.tokenAdmin}`)
      .field("name", "Test Product Update")
      .field("price", 56789)
      .attach("picture", imagePath);

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject if file not image (jpg,jpeg,png,webp)", async () => {
    const res = await supertest(app)
      .patch(`/api/v1/products/${state.productId}`)
      .set("Authorization", `Bearer ${state.tokenAdmin}`)
      .field("name", "Test Product Update")
      .field("price", 56789)
      .attach("image", pdfFile);

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject if image size > 2mb", async () => {
    const res = await supertest(app)
      .patch(`/api/v1/products/${state.productId}`)
      .set("Authorization", `Bearer ${state.tokenAdmin}`)
      .field("name", "Test Product Update")
      .field("price", 56789)
      .attach("image", largeImage);

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject if variant invalid json array", async () => {
    const res = await supertest(app)
      .patch(`/api/v1/products/${state.productId}`)
      .set("Authorization", `Bearer ${state.tokenAdmin}`)
      .field("name", "Test Product Update")
      .field("price", 56789)
      .field("variants", "variantPayload");

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject if variant without id", async () => {
    const variantPayload = [
      {
        name: "variant update",
        stock: 5,
        price_diff: 20000,
      },
    ];

    const res = await supertest(app)
      .patch(`/api/v1/products/${state.productId}`)
      .set("Authorization", `Bearer ${state.tokenAdmin}`)
      .field("name", "Test Product Update")
      .field("price", 56789)
      .field("variants", JSON.stringify(variantPayload));

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject if variant not belong to product", async () => {
    const variantPayload = [
      {
        id: 9999,
        name: "variant update",
        stock: 5,
        price_diff: 20000,
      },
    ];

    const res = await supertest(app)
      .patch(`/api/v1/products/${state.productId}`)
      .set("Authorization", `Bearer ${state.tokenAdmin}`)
      .field("name", "Test Product Update")
      .field("price", 56789)
      .field("variants", JSON.stringify(variantPayload));

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject if product not found", async () => {
    const res = await supertest(app)
      .patch(`/api/v1/products/invalid.product.id`)
      .set("Authorization", `Bearer ${state.tokenAdmin}`)
      .field("name", "Test Product Update")
      .field("price", 56789);

    expect(res.status).toBe(404);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject if category_id is parent", async () => {
    const res = await supertest(app)
      .patch(`/api/v1/products/${state.productId}`)
      .set("Authorization", `Bearer ${state.tokenAdmin}`)
      .field("name", "Test Product Update")
      .field("category_id", state.parentId);

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject if category not found", async () => {
    const res = await supertest(app)
      .patch(`/api/v1/products/${state.productId}`)
      .set("Authorization", `Bearer ${state.tokenAdmin}`)
      .field("name", "Test Product Update")
      .field("category_id", 9999);

    expect(res.status).toBe(404);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject if not admin", async () => {
    const res = await supertest(app)
      .patch(`/api/v1/products/${state.productId}`)
      .set("Authorization", `Bearer ${state.tokenUser}`)
      .field("name", "Test Product Update");

    expect(res.status).toBe(403);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject if not send token", async () => {
    const res = await supertest(app)
      .patch(`/api/v1/products/${state.productId}`)
      .field("name", "Test Product Update");

    expect(res.status).toBe(401);
    expect(res.body.errors).toBeDefined();
  });
});

describe("DELETE /api/v1/products/:id", () => {
  /** @type {import("./utils/util-test.js").TestEnvState} */
  let state;

  beforeAll(async () => {
    state = await setupProductTest(supertest, app);
  });

  afterAll(async () => {
    await cleanupProductTest(state);
  });

  it("should reject if product not found", async () => {
    const res = await supertest(app)
      .delete(`/api/v1/products/${9999}`)
      .set("Authorization", `Bearer ${state.tokenAdmin}`);

    expect(res.status).toBe(404);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject if not admin", async () => {
    const res = await supertest(app)
      .delete(`/api/v1/products/${state.productId}`)
      .set("Authorization", `Bearer ${state.tokenUser}`);

    expect(res.status).toBe(403);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject if not send token", async () => {
    const res = await supertest(app).delete(
      `/api/v1/products/${state.productId}`
    );

    expect(res.status).toBe(401);
    expect(res.body.errors).toBeDefined();
  });

  it("should successfully soft delete product & variants if have order", async () => {
    const orderId = await createTestOrder(state.userId);
    const orderItemId = await createTestOrderItem(orderId, state.variantId);
    const res = await supertest(app)
      .delete(`/api/v1/products/${state.productId}`)
      .set("Authorization", `Bearer ${state.tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();

    const softDelProduct = await getTestProduct(state.productId);

    expect(softDelProduct.deleted_at).not.toBeNull();
    expect(softDelProduct.is_active).toBe(false);

    await deleteTestOrderItem(orderItemId);
    await deleteTestOrder(orderId);
  });

  it("should successfully hard delete product & variants with no relation order and clean cart item", async () => {
    const cartId = await createTestCartItem(state.userId, state.variantId);
    const res = await supertest(app)
      .delete(`/api/v1/products/${state.productId}`)
      .set("Authorization", `Bearer ${state.tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();

    const countVariant = await countVariantByProductIdTest(state.productId);
    const countCart = await countCartItemByProductTest(state.productId);
    expect(countVariant).toBe(0);
    expect(countCart).toBe(0);
  });
});
