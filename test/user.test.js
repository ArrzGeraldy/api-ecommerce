import supertest from "supertest";
import { cleanupTestEnv, prepareTestEnvironment } from "./utils/util-test.js";
import { app } from "../src/app/app.js";
import { createTestUserWithOverrides, deleteTestUser } from "./utils/user";

describe("GET /api/v1/users", () => {
  /** @type {import("./utils/util-test.js").TestEnvState} */
  let state;

  beforeAll(async () => {
    state = await prepareTestEnvironment(supertest, app);
  });

  afterAll(async () => {
    await cleanupTestEnv(state);
  });

  it("should return 200 and list of users (admin only)", async () => {
    const res = await supertest(app)
      .get("/api/v1/users")
      .set("Authorization", `Bearer ${state.tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toBeDefined();
    expect(res.body.current_page).toBeDefined();
  });

  it("should apply search filter correctly", async () => {
    const newUser = await createTestUserWithOverrides({
      email: "john@gmail.com",
    });
    const res = await supertest(app)
      .get("/api/v1/users?search=jo")
      .set("Authorization", `Bearer ${state.tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    for (const user of res.body.data) {
      expect(
        user.email.toLowerCase().includes("jo") ||
          user.username.toLowerCase().includes("jo")
      ).toBe(true);
    }

    await deleteTestUser(newUser.email);
  });

  it("should apply deleted=true filter", async () => {
    const newUser = await createTestUserWithOverrides({
      deleted_at: new Date(),
    });
    const res = await supertest(app)
      .get("/api/v1/users?deleted=true")
      .set("Authorization", `Bearer ${state.tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    for (const user of res.body.data) {
      expect(user.deleted_at).not.toBeNull();
    }

    await deleteTestUser(newUser.email);
  });

  it("should apply blocked=true filter", async () => {
    const newUser = await createTestUserWithOverrides({
      is_blocked: true,
    });
    const res = await supertest(app)
      .get("/api/v1/users?blocked=true")
      .set("Authorization", `Bearer ${state.tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    for (const user of res.body.data) {
      expect(user.is_blocked).toBe(true);
    }

    await deleteTestUser(newUser.email);
  });

  it("should return paginated result with limit and page", async () => {
    const res = await supertest(app)
      .get("/api/v1/users?limit=2&page=1")
      .set("Authorization", `Bearer ${state.tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
    expect(res.body.current_page).toBe(1);
    expect(res.body.per_page).toBe(2);
  });

  it("should return 400 if search is empty string", async () => {
    const res = await supertest(app)
      .get("/api/v1/users")
      .query({ search: "  " })
      .set("Authorization", `Bearer ${state.tokenAdmin}`);

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("should return 401 if no state.tokenUser is provided", async () => {
    const res = await supertest(app).get("/api/v1/users");
    expect(res.status).toBe(401);
    expect(res.body.errors).toBeDefined();
  });

  it("should return 403 if regular user tries to access", async () => {
    const res = await supertest(app)
      .get("/api/v1/users")
      .set("Authorization", `Bearer ${state.tokenUser}`);

    expect(res.status).toBe(403);
    expect(res.body.errors).toBeDefined();
  });
});

describe("GET /api/v1/users/:id", () => {
  /** @type {import("./utils/util-test.js").TestEnvState} */
  let state;

  beforeAll(async () => {
    state = await prepareTestEnvironment(supertest, app);
  });

  afterAll(async () => {
    await cleanupTestEnv(state);
  });

  it("should return user data if authorized", async () => {
    const res = await supertest(app)
      .get(`/api/v1/users/${state.userId}`)
      .set("Authorization", `Bearer ${state.tokenUser}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBe(state.userId);
    expect(res.body).not.toHaveProperty("password");
  });

  it("should return 404 if user not found", async () => {
    const res = await supertest(app)
      .get(`/api/v1/users/9999`)
      .set("Authorization", `Bearer ${state.tokenAdmin}`);

    expect(res.status).toBe(404);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject if req.user.id !== :id", async () => {
    const newUser = await createTestUserWithOverrides({
      email: "john2@gmail.com",
    });
    const res = await supertest(app)
      .get(`/api/v1/users/${newUser.id}`)
      .set("Authorization", `Bearer ${state.tokenUser}`);

    expect(res.status).toBe(403);
    expect(res.body.errors).toBeDefined();

    await deleteTestUser(newUser.email);
  });

  it("should return 403 if unauthorized", async () => {
    const res = await supertest(app).get(`/api/v1/users/${state.userId}`);
    expect(res.status).toBe(401);
    expect(res.body.errors).toBeDefined();
  });
});

describe("PATCH /api/v1/users/:id", () => {
  /** @type {import("./utils/util-test.js").TestEnvState} */
  let state;

  beforeAll(async () => {
    state = await prepareTestEnvironment(supertest, app);
  });

  afterAll(async () => {
    await cleanupTestEnv(state);
  });

  it("should update username if authorized and valid", async () => {
    const res = await supertest(app)
      .patch(`/api/v1/users/${state.userId}`)
      .set("Authorization", `Bearer ${state.tokenUser}`)
      .send({ username: "new_username" });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.username).toBe("new_username");
  });

  it("should update username if req admin", async () => {
    const res = await supertest(app)
      .patch(`/api/v1/users/${state.userId}`)
      .set("Authorization", `Bearer ${state.tokenUser}`)
      .send({ username: "admin patch username" });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.username).toBe("admin patch username");
  });

  it("should update is_blocked if req admin", async () => {
    const newUser = await createTestUserWithOverrides({
      email: "john3@gmail.com",
    });
    const res = await supertest(app)
      .patch(`/api/v1/users/${newUser.id}`)
      .set("Authorization", `Bearer ${state.tokenAdmin}`)
      .send({ is_blocked: true });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.is_blocked).toBe(true);
    await deleteTestUser(newUser.email);
  });

  it("should reject update is_blocked if req user", async () => {
    const newUser = await createTestUserWithOverrides({
      email: "john34@gmail.com",
    });
    const res = await supertest(app)
      .patch(`/api/v1/users/${newUser.id}`)
      .set("Authorization", `Bearer ${state.tokenUser}`)
      .send({ is_blocked: true });

    expect(res.status).toBe(403);
    expect(res.body.errors).toBeDefined();
    await deleteTestUser(newUser.email);
  });

  it("should reject update if not send anything", async () => {
    const res = await supertest(app)
      .patch(`/api/v1/users/${state.userId}`)
      .set("Authorization", `Bearer ${state.tokenUser}`);

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject update if username is too short", async () => {
    const res = await supertest(app)
      .patch(`/api/v1/users/${state.userId}`)
      .set("Authorization", `Bearer ${state.tokenUser}`)
      .send({ username: "abc" });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject update if username is too long", async () => {
    const longUsername = "a".repeat(101);
    const res = await supertest(app)
      .patch(`/api/v1/users/${state.userId}`)
      .set("Authorization", `Bearer ${state.tokenUser}`)
      .send({ username: longUsername });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject if body has disallowed fields", async () => {
    const res = await supertest(app)
      .patch(`/api/v1/users/${state.userId}`)
      .set("Authorization", `Bearer ${state.tokenUser}`)
      .send({ email: "hacker@example.com" });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject update if unauthorized", async () => {
    const res = await supertest(app)
      .patch(`/api/v1/users/${state.userId}`)
      .send({ username: "unauthorized" });

    expect(res.status).toBe(401);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject update if trying to edit another user", async () => {
    const newUser = await createTestUserWithOverrides({
      email: "anotheruser@gmail.com",
    });

    const res = await supertest(app)
      .patch(`/api/v1/users/${newUser.id}`)
      .set("Authorization", `Bearer ${state.tokenUser}`)
      .send({ username: "not_allowed" });

    expect(res.status).toBe(403);
    expect(res.body.errors).toBeDefined();

    await deleteTestUser(newUser.email);
  });
});

describe("DELETE /api/v1/users/:id", () => {
  /** @type {import("./utils/util-test.js").TestEnvState} */
  let state;

  beforeAll(async () => {
    state = await prepareTestEnvironment(supertest, app);
  });

  afterAll(async () => {
    await cleanupTestEnv(state);
  });

  it("should delete a user if requester is admin", async () => {
    const newUser = await createTestUserWithOverrides({
      email: "to-delete@example.com",
    });

    const res = await supertest(app)
      .delete(`/api/v1/users/${newUser.id}`)
      .set("Authorization", `Bearer ${state.tokenAdmin}`);

    expect(res.status).toBe(200);

    const check = await supertest(app)
      .get(`/api/v1/users/${newUser.id}`)
      .set("Authorization", `Bearer ${state.tokenAdmin}`);
    expect(check.status).toBe(404);

    await deleteTestUser(newUser.email);
  });

  it("should return 403 if requester is not admin", async () => {
    const newUser = await createTestUserWithOverrides({
      email: "not-admin@example.com",
    });

    const res = await supertest(app)
      .delete(`/api/v1/users/${newUser.id}`)
      .set("Authorization", `Bearer ${state.tokenUser}`);

    expect(res.status).toBe(403);
    expect(res.body.errors).toBeDefined();

    await deleteTestUser(newUser.email);
  });

  it("should return 404 if user does not exist", async () => {
    const res = await supertest(app)
      .delete("/api/v1/users/9999")
      .set("Authorization", `Bearer ${state.tokenAdmin}`);

    expect(res.status).toBe(404);
    expect(res.body.errors).toBeDefined();
  });

  it("should return 401 if unauthorized", async () => {
    const res = await supertest(app).delete(`/api/v1/users/${state.userId}`);

    expect(res.status).toBe(401);
    expect(res.body.errors).toBeDefined();
  });
});
