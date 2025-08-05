import { prismaClient } from "../../src/app/database";
import bcrypt from "bcrypt";

export const deleteTestUser = async (email = "test@example.com") => {
  await prismaClient.user.delete({
    where: {
      email: email,
    },
  });
};

export const deleteTestUserByID = async (id) => {
  await prismaClient.user.delete({ where: { id } });
};

export const createTestUser = async (
  email = "test@example.com",
  username = "test",
  pass = "test1234"
) => {
  try {
    const user = await prismaClient.user.create({
      data: {
        email,
        username,
        password: await bcrypt.hash(pass, 10),
      },
    });

    return user.id;
  } catch (error) {
    console.error(error);
    console.log(`email ${email} already exists`);
  }
};

export async function createAdminUser() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  await prismaClient.user.create({
    data: {
      email: "test.admin@gmail.com",
      username: "admin",
      password: hashedPassword,
      role: "admin",
    },
  });
}

export const createTestUserWithOverrides = async (overrides = {}) => {
  const pass = overrides.password || "overrides password";
  const user = await prismaClient.user.create({
    data: {
      email: overrides.email || "overrides@gmail.com",
      username: overrides.username || "overrides user",
      password: await bcrypt.hash(pass, 10),
      deleted_at: overrides.deleted_at || null,
      is_blocked: overrides.is_blocked || false,
      role: overrides.role || "user",
    },
  });

  return user;
};
