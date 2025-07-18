export const requireAdmin = (req, res, next) => {
  const user = req.user;

  if (!user) return res.status(401).json({ errors: "Unauthorized" });

  if (user.role !== "admin")
    return res.status(403).json({ errors: "access denied" });

  return next();
};
