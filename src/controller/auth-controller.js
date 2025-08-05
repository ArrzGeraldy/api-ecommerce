import { ResponseError } from "../error/response-error.js";
import authService from "../service/auth-service.js";
import { config } from "../app/config.js";

const register = async (req, res, next) => {
  try {
    const data = await authService.register(req.body);
    res.status(200).json({ data });
  } catch (e) {
    next(e);
  }
};

const login = async (req, res, next) => {
  try {
    const data = await authService.login(req.body);

    res.cookie("token", data.refreshToken, {
      httpOnly: true,
      secure: config.appEnv === "production" ? true : false,
      sameSite: config.appEnv === "production" ? "None" : "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ data: { access_token: data.accessToken } });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const cookies = req.cookies;
    if (!cookies.token) throw new ResponseError(401, "Unauthorized");
    await authService.logout(cookies.token);

    res.clearCookie("token");

    res.status(200).json({ data: null });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) throw new ResponseError(401, "Unauthorized");

    const newAccessToken = await authService.refresh(token);
    res.status(200).json({ data: { access_token: newAccessToken } });
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
  logout,
  refresh,
};
