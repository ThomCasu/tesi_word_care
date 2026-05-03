/**
 * WordCare - ProgressRepository.js
 * Gestisce l'accesso ai dati per la tabella Svolgimento (Fase 1 e 2).
 */

const { db } = require('../database/Database');

class ProgressRepository {
    
    // Inserisce una nuova sessione di gioco nella tabella Svolgimento
    saveGameSession(data) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO Svolgimento 
                (assegnazione_id, punteggio, punteggio_max, tempo_impiegato, dettagli_errori) 
                VALUES (?, ?, ?, ?, ?)
            `;
            
            // Assicuriamoci che dettagli_errori sia una stringa (JSON) prima di salvarlo
            const erroriString = typeof data.dettagli_errori === 'string' 
                ? data.dettagli_errori 
                : JSON.stringify(data.dettagli_errori || []);

            db.run(sql, [
                data.assegnazione_id, 
                data.punteggio, 
                data.punteggio_max, 
                data.tempo_impiegato, 
                erroriString
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID); // Restituisce l'ID del nuovo record inserito
                }
            });
        });
    }

    // Recupera tutto lo storico di un paziente unendo Svolgimento, Assegnazione e Gioco
    getPatientProgress(pazienteId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    s.data_ora, 
                    s.punteggio, 
                    s.punteggio_max, 
                    s.tempo_impiegato, 
                    s.dettagli_errori, 
                    g.nome as gioco_nome,
                    g.tipologia
                FROM Svolgimento s
                JOIN Assegnazione a ON s.assegnazione_id = a.id
                JOIN Gioco g ON a.gioco = g.id
                WHERE a.paziente = ?
                ORDER BY s.data_ora ASC
            `;
            db.all(sql, [pazienteId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }
}

module.exports = new ProgressRepository();