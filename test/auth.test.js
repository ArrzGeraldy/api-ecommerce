import request from "supertest";
import { app } from "../src/app/app.js";
import { logger } from "../src/app/logger.js";
import { createTestUser, deleteTestUser } from "./utils/user.js";

describe("POST api/v1/auth/register", () => {
  afterAll(async () => {
    await deleteTestUser("test@example.com");
  });

  it("should register a new user", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      username: "test",
      email: "test@example.com",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe("test");
    expect(res.body.data.email).toBe("test@example.com");
    expect(res.body.data.password).toBeUndefined();
  });

  it("should reject if request is invalid", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      username: "",
      email: "",
      password: "",
    });

    logger.info(res.body);
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("should be reject if email already exists", async () => {
    let res = await request(app).post("/api/v1/auth/register").send({
      username: "test",
      email: "test@example.com",
      password: "password123",
    });

    logger.info(res.body);
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });
});

describe("POST api/v1/auth/login", () => {
  beforeAll(async () => {
    await createTestUser();
  });

  afterAll(async () => {
    await deleteTestUser("test@example.com");
  });

  it("should get token user and set cookie", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      email: "test@example.com",
      password: "test1234",
    });

    expect(res.status).toBe(200);
    expect(res.body.data.access_token).toBeDefined();

    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    expect(cookies.some((cookie) => cookie.startsWith("token="))).toBe(true);
  });

  it("should reject if request is invalid", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      email: "",
      password: "",
    });

    logger.info(res.body);
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });
});

describe("DELETE api/v1/auth/logout", () => {
  let tokenCookie;
  beforeAll(async () => {
    await createTestUser();
    const res = await request(app).post("/api/v1/auth/login").send({
      email: "test@example.com",
      password: "test1234",
    });

    const cookies = res.headers["set-cookie"];
    tokenCookie = cookies.find((c) => c.startsWith("token="));
  });

  afterAll(async () => {
    await deleteTestUser("test@example.com");
  });

  it("should logout successfully and clear token", async () => {
    const res = await request(app)
      .delete("/api/v1/auth/logout")
      .set("Cookie", tokenCookie);

    expect(res.status).toBe(200);
    const logoutCookies = res.headers["set-cookie"] || [];
    expect(logoutCookies.some((c) => c.startsWith("token=;"))).toBe(true);
  });

  it("should return 401 if no token is sent", async () => {
    const res = await request(app).delete("/api/v1/auth/logout");

    expect(res.status).toBe(401);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject logout if token is invalid", async () => {
    let invalidToken = "invalid.token.jwt";

    const res = await request(app)
      .delete("/api/v1/auth/logout")
      .set("Cookie", [`token=${invalidToken}`]);

    expect(res.status).toBe(403);
    expect(res.body.errors).toBeDefined();
  });
});

describe("POST api/v1/auth/refresh", () => {
  let tokenCookie;
  beforeAll(async () => {
    await createTestUser();
    const res = await request(app).post("/api/v1/auth/login").send({
      email: "test@example.com",
      password: "test1234",
    });

    const cookies = res.headers["set-cookie"];
    tokenCookie = cookies.find((c) => c.startsWith("token="));
  });

  afterAll(async () => {
    await deleteTestUser("test@example.com");
  });

  it("should get new access token", async () => {
    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", tokenCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.access_token).toBeDefined();
  });

  it("should return 401 if no token is sent", async () => {
    const res = await request(app).post("/api/v1/auth/refresh");

    expect(res.status).toBe(401);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject refresh if token is invalid", async () => {
    let invalidToken = "invalid.token.jwt";

    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", [`token=${invalidToken}`]);

    expect(res.status).toBe(403);
    expect(res.body.errors).toBeDefined();
  });
});
