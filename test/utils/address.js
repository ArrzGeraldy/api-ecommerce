import { prismaClient } from "../../src/app/database.js";

export const createTestAddress = async (user_id) => {
  const address = await prismaClient.address.create({
    data: {
      user_id,
      recipient_name: "John Doe",
      phone: "08123456789",
      province: "Jawa Barat",
      city: "Bandung",
      postal_code: "40132",
      is_primary: true,
    },
  });
  return address.id;
};

export const deleteTestAddress = async (id) => {
  await prismaClient.address.delete({
    where: { id },
  });
};

export const deleteTestAddressByUser = async (userId) => {
  await prismaClient.address.deleteMany({
    where: {
      user_id: userId,
    },
  });
};

export const countAddressById = async (id) => {
  return await prismaClient.address.count({ where: { id } });
};

export const getTestAddress = async (id) => {
  return await prismaClient.address.findUnique({
    where: { id },
  });
};
