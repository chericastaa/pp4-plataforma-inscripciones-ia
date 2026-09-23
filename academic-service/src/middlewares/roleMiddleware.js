const verificarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({
        message: "No tenés permisos"
      });
    }

    next();
  };
};

module.exports = verificarRol;