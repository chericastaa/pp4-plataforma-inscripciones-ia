const db = require("../db/db");

const crearConfirmacion = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { tipo, recurso_id } = req.body;

    if (!["cursada", "final"].includes(tipo) || !Number.isInteger(Number(recurso_id)) || Number(recurso_id) <= 0) {
      return res.status(400).json({ message: "Datos de confirmación inválidos" });
    }

    await db.promise().query(
      `UPDATE confirmaciones_pendientes
       SET estado = 'cancelada'
      WHERE user_id = ?
AND tipo = ?
AND recurso_id = ?
AND estado = 'pendiente'`,
     [user_id, tipo, Number(recurso_id)]
    );

    await db.promise().query(
      `INSERT INTO confirmaciones_pendientes
       (user_id, tipo, recurso_id, estado, expira_en)
       VALUES (?, ?, ?, 'pendiente', DATE_ADD(NOW(), INTERVAL 5 MINUTE))`,
      [user_id, tipo, Number(recurso_id)]
    );

    res.status(201).json({ message: "Confirmación pendiente registrada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al registrar confirmación" });
  }
};

const confirmar = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { tipo, recurso_id } = req.body;

    const [resultado] = await db.promise().query(
      `UPDATE confirmaciones_pendientes
       SET estado = 'confirmada'
       WHERE user_id = ? AND tipo = ? AND recurso_id = ?
       AND estado = 'pendiente' AND expira_en > NOW()`,
      [user_id, tipo, Number(recurso_id)]
    );

    if (!resultado.affectedRows) {
      return res.status(403).json({ message: "No hay una confirmación pendiente válida" });
    }

    res.json({ message: "Confirmación aceptada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al confirmar operación" });
  }
};

module.exports = { crearConfirmacion, confirmar };