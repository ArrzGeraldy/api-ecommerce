import supertest from "supertest";
import { app } from "../src/app/app";
import { createAdminUser, createTestUser, deleteTestUser } from "./utils/user";
import {
  countAddressById,
  createTestAddress,
  deleteTestAddress,
  deleteTestAddressByUser,
  getTestAddress,
} from "./utils/address";
import { createTestOrder, deleteTestOrder } from "./utils/order";

describe("GET api/v1/users/:userId/address", () => {
  let userId;
  let addressId;
  let tokenAdmin;
  let tokenUser;
  beforeAll(async () => {
    userId = await createTestUser(
      "address@example.com",
      "address",
      "addressexample"
    );
    addressId = await createTestAddress(userId);
    await createAdminUser();
    const resAdmin = await supertest(app).post("/api/v1/auth/login").send({
      email: "test.admin@gmail.com",
      password: "admin123",
    });
    const resUser = await supertest(app).post("/api/v1/auth/login").send({
      email: "address@example.com",
      password: "addressexample",
    });

    tokenUser = resUser.body.data.access_token;
    tokenAdmin = resAdmin.body.data.access_token;
  });

  afterAll(async () => {
    await deleteTestAddress(addressId);
    await deleteTestUser("address@example.com");
    await deleteTestUser("test.admin@gmail.com");
  });

  it("should get list of addres user by id", async () => {
    const res = await supertest(app)
      .get(`/api/v1/users/${userId}/address`)
      .set("Authorization", `Bearer ${tokenUser}`);

    expect(res.body.data).toBeDefined();
    expect(res.status).toBe(200);
  });

  it("should get list of address req admin", async () => {
    const res = await supertest(app)
      .get(`/api/v1/users/${userId}/address`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.body.data).toBeDefined();
    expect(res.status).toBe(200);
  });

  it("should get reject if user not owner address or admin", async () => {
    const otherUserId = await createTestUser(
      "other@gmail.com",
      "address123",
      "address123"
    );

    const resUser = await supertest(app).post("/api/v1/auth/login").send({
      email: "other@gmail.com",
      password: "address123",
    });

    const otherToken = resUser.body.data.access_token;
    const res = await supertest(app)
      .get(`/api/v1/users/${userId}/address`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
    expect(res.body.errors).toBeDefined();
    await deleteTestUser("other@gmail.com");
  });

  it("should get reject if not send token", async () => {
    const res = await supertest(app).get(`/api/v1/users/${userId}/address`);

    expect(res.status).toBe(401);
    expect(res.body.errors).toBeDefined();
  });
});

describe("POST /api/v1/users/:userId/address", () => {
  let userId;
  let token;

  beforeAll(async () => {
    userId = await createTestUser(
      "post.address@example.com",
      "test123123",
      "test123123"
    );
    const res = await supertest(app).post("/api/v1/auth/login").send({
      email: "post.address@example.com",
      password: "test123123",
    });
    token = res.body.data.access_token;
  });

  afterAll(async () => {
    await deleteTestAddressByUser(userId);
    await deleteTestUser("post.address@example.com");
  });

  it("should create address successfully", async () => {
    const res = await supertest(app)
      .post(`/api/v1/users/${userId}/address`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        recipient_name: "John Doe",
        phone: "08123456789",
        province: "Jawa Barat",
        city: "Bandung",
        postal_code: "40123",
        is_primary: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.recipient_name).toBe("John Doe");
  });

  it("should reject invalid input", async () => {
    const res = await supertest(app)
      .post(`/api/v1/users/${userId}/address`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        recipient_name: "",
        phone: "",
        province: "",
        city: "",
        postal_code: "",
        is_primary: null,
      });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject if no token", async () => {
    const res = await supertest(app)
      .post(`/api/v1/users/${userId}/address`)
      .send({
        recipient_name: "Unauthorized User",
        phone: "08987654321",
        province: "DKI Jakarta",
        city: "Jakarta",
        postal_code: "12120",
        is_primary: false,
      });

    expect(res.status).toBe(401);
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
      .post(`/api/v1/users/${userId}/address`)
      .set("Authorization", `Bearer ${tokenOther}`)
      .send({
        recipient_name: "Illegal Insert",
        phone: "0822334455",
        province: "Aceh",
        city: "Banda Aceh",
        postal_code: "23234",
        is_primary: true,
      });

    expect(res.status).toBe(403);
    expect(res.body.errors).toBeDefined();

    await deleteTestUser("other@example.com");
  });
});

describe("PATCH /api/v1/users/:userId/address/:id", () => {
  let userId;
  let token;
  let addressId;

  beforeAll(async () => {
    userId = await createTestUser(
      "post.address@example.com",
      "test123123",
      "test123123"
    );
    const res = await supertest(app).post("/api/v1/auth/login").send({
      email: "post.address@example.com",
      password: "test123123",
    });
    token = res.body.data.access_token;
    addressId = await createTestAddress(userId);
  });

  afterAll(async () => {
    await deleteTestAddressByUser(userId);
    await deleteTestUser("post.address@example.com");
  });

  it("should update address successfully", async () => {
    const res = await supertest(app)
      .patch(`/api/v1/users/${userId}/address/${addressId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        recipient_name: "John Doe Patch",
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.recipient_name).toBe("John Doe Patch");
  });

  it("should reject invalid input", async () => {
    const res = await supertest(app)
      .patch(`/api/v1/users/${userId}/address/${addressId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        recipient_name: "",
        phone: "",
        province: "",
        city: "",
        postal_code: "",
        is_primary: null,
      });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject if no token", async () => {
    const res = await supertest(app)
      .patch(`/api/v1/users/${userId}/address/${addressId}`)
      .send({
        recipient_name: "Unauthorized User",
        phone: "08987654321",
        province: "DKI Jakarta",
        city: "Jakarta",
        postal_code: "12120",
        is_primary: false,
      });

    expect(res.status).toBe(401);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject if other user tries to update", async () => {
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
      .patch(`/api/v1/users/${userId}/address/${addressId}`)
      .set("Authorization", `Bearer ${tokenOther}`)
      .send({
        recipient_name: "Illegal Insert",
        phone: "0822334455",
        province: "Aceh",
        city: "Banda Aceh",
        postal_code: "23234",
        is_primary: true,
      });

    expect(res.status).toBe(403);
    expect(res.body.errors).toBeDefined();

    await deleteTestUser("other@example.com");
  });
});

describe("DELETE api/v1/users/:userId/address/:id", () => {
  let userId;
  let addressId;
  let tokenAdmin;
  let tokenUser;
  let orderId;

  beforeAll(async () => {
    userId = await createTestUser(
      "address@example.com",
      "address132",
      "address132"
    );
    addressId = await createTestAddress(userId);
    await createAdminUser();
    const resAdmin = await supertest(app).post("/api/v1/auth/login").send({
      email: "test.admin@gmail.com",
      password: "admin123",
    });
    const resUser = await supertest(app).post("/api/v1/auth/login").send({
      email: "address@example.com",
      password: "address132",
    });

    tokenUser = resUser.body.data.access_token;
    tokenAdmin = resAdmin.body.data.access_token;
    orderId = await createTestOrder(userId, addressId);
  });

  afterAll(async () => {
    await deleteTestOrder(orderId);
    await deleteTestAddress(addressId);
    await deleteTestUser("address@example.com");
    await deleteTestUser("test.admin@gmail.com");
  });

  it("should hard delete successfully if address don't have order req by admin", async () => {
    const delAddressId = await createTestAddress(userId);

    const res = await supertest(app)
      .delete(`/api/v1/users/${userId}/address/${delAddressId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
    const count = await countAddressById(delAddressId);

    expect(count).toBe(0);
  });

  it("should hard delete successfully if address don't have order", async () => {
    const delAddressId = await createTestAddress(userId);

    const res = await supertest(app)
      .delete(`/api/v1/users/${userId}/address/${delAddressId}`)
      .set("Authorization", `Bearer ${tokenUser}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
    const count = await countAddressById(delAddressId);

    expect(count).toBe(0);
  });

  it("should reject if address not found", async () => {
    const res = await supertest(app)
      .delete(`/api/v1/users/${userId}/address/${9999}`)
      .set("Authorization", `Bearer ${tokenUser}`);

    expect(res.status).toBe(404);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject if other user tries to delete", async () => {
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
      .delete(`/api/v1/users/${userId}/address/${addressId}`)
      .set("Authorization", `Bearer ${tokenOther}`);

    expect(res.status).toBe(403);
    expect(res.body.errors).toBeDefined();

    await deleteTestUser("other@example.com");
  });
});
