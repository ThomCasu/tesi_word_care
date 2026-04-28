/**
 * WordCare - ProfessionalRepository.js 
 */

const { db } = require('../database/Database');
const Profesional = require('../models/Professionista');

class ProfessionalRepository {
  async getProfiloCompleto(userId) {
    const query = `
      SELECT u.id AS id, p.nome, p.cognome, p.data_nascita, p.specializzazione, p.sede
      FROM User u
      JOIN Professionista p ON u.id = p.user_id
      WHERE u.id = ?
    `;

    return new Promise((resolve, reject) => {
      db.get(query, [userId], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  // --- METODO CORRETTO ---
  async salvaProfilo(userId, dati) {
    return new Promise((resolve, reject) => {
      // Aggiorniamo SOLO la tabella Professionista, perché è lì che stanno nome e cognome!
      const sql = `
        UPDATE Professionista 
        SET nome = ?, cognome = ?, data_nascita = ?, specializzazione = ?, sede = ?
        WHERE user_id = ?
      `;
      const params = [
        dati.nome, 
        dati.cognome, 
        dati.data_nascita, 
        dati.specializzazione, 
        dati.sede, 
        userId // req.session.userId dal controller
      ];

      db.run(sql, params, function (err) {
        if (err) {
          console.error("❌ Errore SQL in salvaProfilo:", err.message);
          return reject(err);
        }
        resolve(true);
      });
    });
  }

  async getPazientiInCura(professionalId) {
    const query = `
      SELECT p.id, p.nome, p.cognome, p.data_nascita, p.patologia
      FROM InCura ic
      JOIN Paziente p ON ic.paziente = p.id
      WHERE ic.professionista = ?`;

    return new Promise((resolve, reject) => {
      db.all(query, [professionalId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  async aggiungiPaziente({ nome, cognome, data_nascita, patologia }, professionalId) {
    return new Promise((resolve, reject) => {
      // 1. Controlla se il paziente esiste già nel database (ignorando maiuscole/minuscole)
      const checkPazienteSql = `SELECT id FROM Paziente WHERE LOWER(nome) = LOWER(?) AND LOWER(cognome) = LOWER(?) AND data_nascita = ?`;

      db.get(checkPazienteSql, [nome, cognome, data_nascita], (err, pazienteRow) => {
        if (err) return reject(err);

        if (pazienteRow) {
          // Il paziente esiste. Controlliamo se è già in cura con questo professionista
          const paziente_id = pazienteRow.id;
          const checkInCuraSql = `SELECT * FROM InCura WHERE paziente = ? AND professionista = ?`;

          db.get(checkInCuraSql, [paziente_id, professionalId], (err, inCuraRow) => {
            if (err) return reject(err);

            if (inCuraRow) {
              // ❌ Già in cura! Rifiutiamo la promessa con un errore personalizzato
              return reject(new Error("PAZIENTE_GIA_PRESENTE"));
            } else {
              // ⚠️ Esiste nel DB ma non è in cura con questo professionista. Aggiungiamo solo la relazione.
              const oggi = new Date().toISOString().split('T')[0];
              db.run(
                `INSERT INTO InCura (paziente, professionista, data_inizio) VALUES (?, ?, ?)`,
                [paziente_id, professionalId, oggi],
                function (err) {
                  if (err) return reject(err);
                  console.log("⚙️ Paziente esistente collegato in InCura con successo");
                  resolve(true);
                }
              );
            }
          });
        } else {
          // 2. Il paziente non esiste, procediamo con la creazione completa
          const timestamp = Date.now();
          const email = `paziente${timestamp}@demo.com`;
          const username = `paziente${timestamp}`;
          const password = 'demo123';
          const behavior = 'patient';

          // Step A: Crea User
          db.run(
            `INSERT INTO User (email, username, password, behavior) VALUES (?, ?, ?, ?)`,
            [email, username, password, behavior],
            function (err) {
              if (err) return reject(err);
              const user_id = this.lastID;

              // Step B: Crea Paziente
              db.run(
                `INSERT INTO Paziente (user_id, nome, cognome, data_nascita, patologia) VALUES (?, ?, ?, ?, ?)`,
                [user_id, nome, cognome, data_nascita, patologia],
                function (err2) {
                  if (err2) return reject(err2);
                  const paziente_id = this.lastID;
                  const oggi = new Date().toISOString().split('T')[0];

                  // Step C: Crea Relazione InCura
                  db.run(
                    `INSERT INTO InCura (paziente, professionista, data_inizio) VALUES (?, ?, ?)`,
                    [paziente_id, professionalId, oggi],
                    function (err3) {
                      if (err3) return reject(err3);
                      console.log("⚙️ Nuovo paziente e relazione InCura creati con successo");
                      resolve(true);
                    }
                  );
                }
              );
            }
          );
        }
      });
    });
  }

  // --- NUOVO: Rimuove la relazione in InCura tra Paziente e Professionista ---
  async rimuoviPaziente(pazienteId, professionalId) {
    const query = `DELETE FROM InCura WHERE paziente = ? AND professionista = ?`;
    
    return new Promise((resolve, reject) => {
      db.run(query, [pazienteId, professionalId], function (err) {
        if (err) {
          console.error("❌ Errore SQL in rimuoviPaziente:", err.message);
          return reject(err);
        }
        resolve(true);
      });
    });
  }

  async getListaGiochi() {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM gioco`, [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  async assegnaGioco({ gioco_id, paziente_id, professionalId, scadenza, num_ripetizioni }) {
    const query = `
      INSERT INTO assegnazione (gioco_id, paziente_id, professionista_id, scadenza, num_ripetizioni, svolto)
      VALUES (?, ?, ?, ?, ?, 0)`;
    return new Promise((resolve, reject) => {
      db.run(query, [gioco_id, paziente_id, professionalId, scadenza, num_ripetizioni], function (err) {
        if (err) return reject(err);
        resolve(true);
      });
    });
  }

  async getPromemoria(professionalId) {
    const query = `
      SELECT pr.*
      FROM Promemoria pr
      JOIN PostIt pi ON pi.promemoria = pr.id
      WHERE pi.professionista = ?`;
    return new Promise((resolve, reject) => {
      db.all(query, [professionalId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  async creaPromemoria({ data, ora_notifica, nota, professionalId }) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO promemoria (data, ora_notifica, nota) VALUES (?, ?, ?)`,
        [data, ora_notifica, nota],
        function (err) {
          if (err) return reject(err);
          const promemoriaId = this.lastID;
          db.run(
            `INSERT INTO post_it (professionista, promemoria) VALUES (?, ?)`,
            [professionalId, promemoriaId],
            function (err2) {
              if (err2) return reject(err2);
              resolve(true);
            }
          );
        }
      );
    });
  }

  async findById(id) {
    const query = `SELECT * FROM Professionista WHERE id = ?`;
    return new Promise((resolve, reject) => {
      db.get(query, [id], (err, row) => {
        if (err) return reject(err);
        if (!row) return resolve(null);
        const user = new Profesional(
          row.id,
          row.user_id,
          row.nome,
          row.cognome,
          row.data_nascita,
          row.specializzazione,
          row.sede
        );
        resolve(user);
      });
    });
  }

  async findByUserId(id) {
    const query = `SELECT * FROM Professionista WHERE user_id = ?`;
    return new Promise((resolve, reject) => {
      db.get(query, [id], (err, row) => {
        if (err) return reject(err);
        if (!row) return resolve(null);
        const user = new Profesional(
          row.id,
          row.user_id,
          row.nome,
          row.cognome,
          row.data_nascita,
          row.specializzazione,
          row.sede
        );
        resolve(user);
      });
    });
  }

  async new(userId, nome, cognome, dataNascita = null, specializzazione = null, sede = null) {
    const query = `INSERT INTO Professionista (user_id, nome, cognome, data_nascita, specializzazione, sede)
                   VALUES (?, ?, ?, ?, ?, ?)`;
    return new Promise((resolve, reject) => {
      db.run(query, [userId, nome, cognome, dataNascita, specializzazione, sede], function (err) {
        if (err) return reject(err);
        resolve(this.lastID);
      });
    });
  }
}

module.exports = new ProfessionalRepository();