-- SQLite, per aggiornare copia nel terminale: sqlite3 database.db < Query.sql

-- =======================
-- APPUNTAMENTO (Test iniziale)
-- =======================
Insert into Appuntamento (paziente, professionista, data, ora, sede)
values(5, 1, '2025-04-15', '18:00:00', 'Via del Tutto Eccezionale, 15');

-- =======================
-- UTENTI
-- =======================

-- Già presente: utente luca (id = 4)
-- Già presente: utente mario (id = 5)

-- =======================
-- PROFESSIONISTA
-- =======================

-- Inserimento del professionista associato all'utente 'luca'
INSERT INTO Professionista (user_id, nome, cognome, data_nascita, specializzazione, sede)
VALUES (4, 'Luca', 'Bianchi', '1987-05-12', 'Logopedia', 'Via del Tutto Eccezionale, 15');

-- =======================
-- PAZIENTE
-- =======================

-- Inserimento del paziente associato a user_id 5 (se non già presente)
INSERT INTO Paziente (user_id, nome, cognome, data_nascita, patologia)
VALUES (5, 'Mario', 'Rossi', '2015-08-12', 'Disturbo fonologico');

-- =======================
-- RELAZIONE IN CURA
-- =======================

-- Collega Mario (id=1) a Luca (id=1) in cura attiva
INSERT INTO InCura (paziente, professionista, data_inizio, note)
VALUES (1, 1, '2025-01-15', 'Secondo ciclo di logopedia');

-- =======================
-- APPUNTAMENTO
-- =======================

INSERT INTO Appuntamento (paziente, professionista, data, ora, sede)
VALUES (1, 1, '2025-06-10', '10:00:00', 'Via del Tutto Eccezionale, 15');

-- =======================
-- GIOCO E ASSEGNAZIONE (Aggiornata per la Fase 1)
-- =======================

INSERT INTO Gioco (nome, tipologia, note)
VALUES ('Parole con la S', 'Fonologia', 'Esercizio per migliorare la pronuncia del fonema S');

-- Inserimento nella tabella Assegnazione "snellita" (solo prescrizione)
INSERT INTO Assegnazione (paziente, professionista, gioco, scadenza, ripetizioni_assegnate)
VALUES (1, 1, 1, '2025-06-15', 5);

-- =======================
-- SVOLGIMENTO (Dati fittizi per i grafici)
-- =======================

-- Simulazione: il bambino gioca due volte il gioco assegnato.
-- Nel campo 'dettagli_errori' usiamo il formato JSON.
INSERT INTO Svolgimento (assegnazione_id, data_ora, punteggio, punteggio_max, tempo_impiegato, dettagli_errori)
VALUES (1, '2025-05-20 15:30:00', 8, 10, 120, '["sole", "sale"]');

INSERT INTO Svolgimento (assegnazione_id, data_ora, punteggio, punteggio_max, tempo_impiegato, dettagli_errori)
VALUES (1, '2025-05-21 16:00:00', 9, 10, 105, '["sasso"]');

-- =======================
-- PROMEMORIA E POSTIT
-- =======================

INSERT INTO Promemoria (data, ora_notifica, nota)
VALUES ('2025-06-08', '09:00:00', 'Verifica dei progressi con il gioco "Parole con la S"');

INSERT INTO PostIt (professionista, promemoria)
VALUES (1, 1);

-- =======================
-- AGENDA
-- =======================

INSERT INTO Agenda (paziente, data, titolo, note, segnalazione)
VALUES (1, '2025-06-01', 'Prima osservazione', 'Mario confonde S e Z, ma ha buona attenzione', 1);

-- =======================
-- QUERY DI TEST
-- =======================

SELECT * FROM User;
SELECT * FROM Professionista;
SELECT * FROM Paziente;
SELECT * FROM InCura;
SELECT * FROM Appuntamento;
SELECT * FROM Gioco;
SELECT * FROM Assegnazione;
SELECT * FROM Svolgimento; -- Aggiunto test per la nuova tabella
SELECT * FROM Promemoria;
SELECT * FROM PostIt;
SELECT * FROM Agenda;