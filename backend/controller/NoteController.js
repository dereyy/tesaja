// controllers/NoteController.js
const db = require("../config/Database");

const getNotes = async (req, res) => {
  try {
    db.query(
      "SELECT id, title, content, CONVERT_TZ(created_at, '+00:00', '+00:00') AS created_at FROM notes ORDER BY created_at DESC",
      (err, results) => {
        if (err) throw err;
        res.json(results);
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve notes" });
  }
};

const addNote = async (req, res) => {
  try {
    const { title, content } = req.body;
    db.query(
      "INSERT INTO notes (title, content, created_at) VALUES (?, ?, UTC_TIMESTAMP())",
      [title, content],
      (err, result) => {
        if (err) throw err;
        res.json({
          id: result.insertId,
          title,
          content,
          created_at: new Date().toISOString(),
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Failed to add note" });
  }
};

const updateNote = async (req, res) => {
  try {
    const { title, content } = req.body;
    db.query(
      "UPDATE notes SET title = ?, content = ? WHERE id = ?",
      [title, content, req.params.id],
      (err) => {
        if (err) throw err;
        res.json({ success: true });
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Failed to update note" });
  }
};

const deleteNote = async (req, res) => {
  try {
    db.query("DELETE FROM notes WHERE id = ?", [req.params.id], (err) => {
      if (err) throw err;
      res.json({ success: true });
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete note" });
  }
};

module.exports = {
  getNotes,
  addNote,
  updateNote,
  deleteNote,
};
