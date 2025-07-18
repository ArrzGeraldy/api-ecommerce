import { ResponseError } from "../error/response-error.js";

export const authorizeUserOrAdmin = (targetUserId, requester) => {
  if (targetUserId !== requester.id && requester.role !== "admin") {
    throw new ResponseError(403, "access denied");
  }
};
