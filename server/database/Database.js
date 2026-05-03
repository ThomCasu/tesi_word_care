/**
 * WordCare - Database.js
 */

const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Initialize SQLite database connection using the specified file
const db = new sqlite3.Database(path.join(__dirname, "database.db"), (err) => {
	// Log error if connection fails
	if (err) {
		console.error("Errore durante la connessione al database:", err.message);
	} else {
		console.log("Connesso al database SQLite.");
	}
});

// Enable foreign key support for relational integrity
db.run("PRAGMA foreign_keys = ON");

// Function to initialize the database schema (create tables if not exist)
function initDb() {
	db.serialize(() => {
		// Creazione della tabella 'User'
		db.run(`
            CREATE TABLE IF NOT EXISTS User (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                username TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                behavior TEXT NOT NULL
            );
        `);
		
		// --- Entità Paziente
		db.run(`
			CREATE TABLE IF NOT EXISTS Paziente (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				user_id INTEGER NOT NULL,
				nome TEXT NOT NULL,
				cognome TEXT NOT NULL,
				data_nascita DATE,
				patologia TEXT,
				FOREIGN KEY(user_id) REFERENCES User(id) ON DELETE CASCADE
			);
		`);

		// --- Entità Professionista
		db.run(`
			CREATE TABLE IF NOT EXISTS Professionista (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				user_id INTEGER NOT NULL,
				nome TEXT NOT NULL,
				cognome TEXT NOT NULL,
				data_nascita DATE,
				specializzazione TEXT,
				sede TEXT,
				FOREIGN KEY(user_id) REFERENCES User(id) ON DELETE CASCADE
			);
		`);

		// --- Relazione in_cura (M:N Paziente - Professionista)
		db.run(`
			CREATE TABLE IF NOT EXISTS InCura (
				paziente INTEGER NOT NULL,
				professionista INTEGER NOT NULL,
				data_inizio DATE NOT NULL,
				data_fine DATE,
				note TEXT,
				PRIMARY KEY(paziente, professionista),
				FOREIGN KEY(paziente) REFERENCES Paziente(id) ON DELETE CASCADE,
				FOREIGN KEY(professionista) REFERENCES Professionista(id) ON DELETE CASCADE
			);
		`);

		// --- Entità Promemoria
		db.run(`
			CREATE TABLE IF NOT EXISTS Promemoria (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				data DATE NOT NULL,
				ora_notifica TIME NOT NULL,
				nota TEXT NOT NULL
			);
		`);

		// --- Relazione post_it (M:N Professionista - Promemoria)
		db.run(`
			CREATE TABLE IF NOT EXISTS PostIt (
				professionista INTEGER NOT NULL,
				promemoria INTEGER NOT NULL,
				PRIMARY KEY(professionista, promemoria),
				FOREIGN KEY(professionista) REFERENCES Professionista(id) ON DELETE CASCADE,
				FOREIGN KEY(promemoria) REFERENCES Promemoria(id) ON DELETE CASCADE
			);
		`);

		// --- Relazione Appuntamento (Paziente - Professionista) con attributi
		db.run(`
			CREATE TABLE IF NOT EXISTS Appuntamento (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				paziente INTEGER NOT NULL,
				professionista INTEGER NOT NULL,
				data DATE NOT NULL,
				ora TIME NOT NULL,
				sede TEXT NOT NULL,
				FOREIGN KEY(paziente) REFERENCES Paziente(id) ON DELETE CASCADE,
				FOREIGN KEY(professionista) REFERENCES Professionista(id) ON DELETE CASCADE,
				UNIQUE(paziente, professionista, data, ora)
			);
		`);

		// --- Entità Gioco
		db.run(`
			CREATE TABLE IF NOT EXISTS Gioco (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				nome TEXT NOT NULL UNIQUE,
				tipologia TEXT NOT NULL,
				note TEXT
			);
		`);

		// --- Relazione Assegnazione (MODIFICATA: Solo prescrizione)
		db.run(`
			CREATE TABLE IF NOT EXISTS Assegnazione (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				paziente INTEGER NOT NULL,
				professionista INTEGER NOT NULL,
				gioco INTEGER NOT NULL,
				scadenza DATE NOT NULL,
				ripetizioni_assegnate INTEGER NOT NULL CHECK(ripetizioni_assegnate >= 1),
				
				FOREIGN KEY(paziente) REFERENCES Paziente(id) ON DELETE CASCADE,
				FOREIGN KEY(professionista) REFERENCES Professionista(id) ON DELETE CASCADE,
				FOREIGN KEY(gioco) REFERENCES Gioco(id) ON DELETE CASCADE
			);
		`);

		// --- NUOVA TABELLA: Svolgimento (Raccolta dati singola partita)
		db.run(`
			CREATE TABLE IF NOT EXISTS Svolgimento (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				assegnazione_id INTEGER NOT NULL,
				data_ora DATETIME DEFAULT CURRENT_TIMESTAMP,
				punteggio INTEGER,
				punteggio_max INTEGER,
				tempo_impiegato INTEGER,
				dettagli_errori TEXT,
				
				FOREIGN KEY(assegnazione_id) REFERENCES Assegnazione(id) ON DELETE CASCADE
			);
		`);

		// --- Relazione Agenda (appunti del paziente che si segna giorno per giorno)
		db.run(`
			CREATE TABLE IF NOT EXISTS Agenda (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				paziente INTEGER NOT NULL,
				data DATE NOT NULL,
				titolo TEXT,
				note TEXT,
				segnalazione INTEGER NOT NULL CHECK(segnalazione IN (0,1)),
				FOREIGN KEY(paziente) REFERENCES Paziente(user_id) ON DELETE CASCADE
			);
		`);

		console.log("Tabelle inizializzate o già esistenti.");
	});
}

module.exports = {
	db,
	initDb,
};