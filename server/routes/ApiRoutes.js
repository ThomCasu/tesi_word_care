/**
 * WordCare - ApiRoutes.js
 */

const express = require('express');
const router = express.Router();
const AgendaRepository = require('../repositories/AgendaRepository');
const PatientRepository = require('../repositories/PatientRepository');
const UserRepository = require('../repositories/UserRepository');
const GameRepository = require('../repositories/GameRepository');

// Importiamo il nuovo controller per la Fase 2
const ProgressController = require('../controllers/ProgressController');

router.get('/patient-info', async (req, res) => {
	if (!req.session.userId) {
		const params = new URLSearchParams({
			code: '401',
			title: 'Utente non loggato',
			message: 'Si è verificato un errore: non sei loggato.',
			returnUrl: '/login'
		});
		return res.redirect(`/error.html?${params.toString()}`);
	}

	const nome = req.session.userName;
	const cognome = req.session.userSurname;

	try {
		let professionista = await PatientRepository.getNomeProfessionistaInCura(req.session.userId);
		if (!professionista) professionista = "Non assegnato";

		let ultimaVisita = await PatientRepository.getUltimaVisita(req.session.userId);
		if (!ultimaVisita) ultimaVisita = "Non disponibile";

		return res.json({ nome, cognome, professionista, ultimaVisita });
	} catch (err) {
		console.error('Errore nel recupero delle info paziente:', err);
		return res.status(500).json({ error: 'Errore interno' });
	}
});

router.get('/profilo/info', async (req, res) => {
	if (!req.session.userId) {
		const params = new URLSearchParams({
			code: '401',
			title: 'Utente non loggato',
			message: 'Si è verificato un errore: non sei loggato.',
			returnUrl: '/login'
		});
		return res.redirect(`/error.html?${params.toString()}`);
	}

	const userId = req.session.userId;

	try {
		const paziente = await PatientRepository.findByUserId(userId);
		const user = await UserRepository.findById(userId);

		if (!paziente || !user) {
			return res.status(404).json({ error: 'Paziente o utente non trovato' });
		}

		let professionista = await PatientRepository.getNomeProfessionistaInCura(userId);
		if (!professionista) professionista = "Non assegnato";

		let ultimaVisita = await PatientRepository.getUltimaVisita(userId);
		if (!ultimaVisita) ultimaVisita = "Non disponibile";

		return res.json({
			nome: paziente.nome,
			cognome: paziente.cognome,
			data_nascita: paziente.data_nascita,
			patologia: paziente.patologia,
			username: user.username,
			email: user.email,
			professionista,
			ultimaVisita
		});
	} catch (err) {
		console.error('Errore nel recupero delle info paziente:', err);
		return res.status(500).json({ error: 'Errore interno' });
	}
});

router.put('/profilo/info', async (req, res) => {
	if (!req.session.userId) {
		return res.status(401).json({ error: 'Utente non loggato' });
	}

	const userId = req.session.userId;
	const { user, paziente } = req.body;

	if (!user || !paziente) {
		return res.status(400).json({ error: 'Dati incompleti' });
	}

	try {
		// Verifica se username è già in uso da un altro utente
		const userByUsername = await UserRepository.findUserByUsername(user.username);
		if (userByUsername && userByUsername.id !== userId) {
			return res.status(409).json({ error: 'Username già in uso' });
		}

		// Verifica se email è già in uso da un altro utente
		const userByEmail = await UserRepository.findUserByEmail(user.email);
		if (userByEmail && userByEmail.id !== userId) {
			return res.status(409).json({ error: 'Email già in uso' });
		}

		// Aggiorna User (username + email)
		await UserRepository.updateUser(userId, {
			username: user.username,
			email: user.email
		});

		// Aggiorna Paziente
		await PatientRepository.updateByUserId(userId, paziente);

		return res.json({ success: true });

	} catch (err) {
		console.error('Errore durante il salvataggio del profilo:', err);
		return res.status(500).json({ error: 'Errore interno del server' });
	}
});


// Ritorna tutte le note del paziente loggato
router.get('/paziente-agenda', async (req, res) => {
	if (!req.session.userId) {
		// Redirect alla pagina di errore con query string
		const params = new URLSearchParams({
			code: '401',
			title: 'Utente non loggato',
			message: 'Si è verificato un errore: non sei loggato.',
			returnUrl: '/login'
		});

		return res.redirect(`/error.html?${params.toString()}`);
	}
	try {
		const pazienteId = req.session.patientId;
		const notes = await AgendaRepository.findByPatientId(pazienteId);
		// Nota: i nomi dei campi sono { id, data, titolo, note, segnalazione }
		res.json(notes);
	} catch (err) {
		console.error('Errore fetching agenda:', err);
		// Redirect alla pagina di errore con query string
		const params = new URLSearchParams({
			code: '500',
			title: 'Errore dati agenda',
			message: "Si è verificato un errore: non sono riuscito a recuperare le informazioni dell'agenda.",
			returnUrl: '/login'
		});

		return res.redirect(`/error.html?${params.toString()}`);
	}
});

// Salva una nuova nota
router.post('/paziente-agenda', express.json(), async (req, res) => {
	if (!req.session.userId) {
		// Redirect alla pagina di errore con query string
		const params = new URLSearchParams({
			code: '401',
			title: 'Utente non loggato',
			message: 'Si è verificato un errore: non sei loggato.',
			returnUrl: '/login'
		});

		return res.redirect(`/error.html?${params.toString()}`);
	}
	try {
		const pazienteId = req.session.patientId;
		const { data, titolo, note, segnalazione } = req.body;
		const newNote = await AgendaRepository.create({
			paziente: pazienteId,
			data,
			titolo,
			note,
			segnalazione: segnalazione ? 1 : 0
		});
		res.json(newNote);
	} catch (err) {
		console.error('Errore nel salvataggio nota:', err);
		// Redirect alla pagina di errore con query string
		const params = new URLSearchParams({
			code: '500',
			title: 'Errore creazione nota',
			message: "Si è verificato un errore: non sono riuscito a salvare la nota.",
			returnUrl: '/login'
		});

		return res.redirect(`/error.html?${params.toString()}`);
	}
});

router.delete('/paziente-agenda/:id', async (req, res) => {
	if (!req.session.userId) {
		return res.status(401).json({ error: 'Non loggato' });
	}
	const pazienteId = req.session.patientId;
	const noteId = parseInt(req.params.id, 10);
	try {
		const changes = await AgendaRepository.deleteById(pazienteId, noteId);
		if (changes > 0) {
			return res.json({ success: true });
		} else {
			// Redirect alla pagina di errore con query string
			const params = new URLSearchParams({
				code: '500',
				title: 'Errore cancellazione nota',
				message: "Si è verificato un errore: non sono riuscito a trovare la nota.",
				returnUrl: '/login'
			});

			return res.redirect(`/error.html?${params.toString()}`);
		}
	} catch (err) {
		console.error('Errore eliminazione nota:', err);
		// Redirect alla pagina di errore con query string
		const params = new URLSearchParams({
			code: '400',
			title: 'Errore server',
			message: "Si è verificato un errore: riprovare più tardi.",
			returnUrl: '/login'
		});

		return res.redirect(`/error.html?${params.toString()}`);
	}
});

// PUT /api/paziente-agenda/:id → aggiorna una nota
router.put('/paziente-agenda/:id', express.json(), async (req, res) => {
	if (!req.session.userId) {
		return res.status(401).json({ error: 'Non loggato' });
	}
	const pazienteId = req.session.patientId;
	const noteId = parseInt(req.params.id, 10);
	const { data, titolo, note, segnalazione } = req.body;

	try {
		// costruisco un oggetto entry per il repository
		const updated = await AgendaRepository.update({
			id: noteId,
			paziente: pazienteId,
			data,
			titolo,
			note,
			segnalazione: segnalazione ? 1 : 0
		});
		return res.json(updated);
	} catch (err) {
		console.error('Errore aggiornamento nota:', err);
		// Redirect alla pagina di errore con query string
		const params = new URLSearchParams({
			code: '500',
			title: 'Errore modifica nota',
			message: "Si è verificato un errore: non sono riuscito a modificare la nota selezionata.",
			returnUrl: '/login'
		});

		return res.redirect(`/error.html?${params.toString()}`);
	}
});

router.get('/esercizi-svolti', async (req, res) => {
	if (!req.session.userId) {
		return res.status(401).json({ error: 'Utente non autenticato' });
	}

	try {
		const totale = await GameRepository.countEserciziSvolti(req.session.userId);
		res.json({ totale });
	} catch (err) {
		console.error('Errore nel recupero degli esercizi svolti:', err);
		res.status(500).json({ error: 'Errore interno del server' });
	}
});

router.get('/esercizi', async (req, res) => {
	if (!req.session.userId) {
		return res.status(401).json({ error: 'Utente non autenticato' });
	}

	try {
		const esercizi = await GameRepository.getAllEserciziByUser(req.session.userId);
		return res.json(esercizi);
	} catch (err) {
		console.error('Errore nel recupero degli esercizi:', err);
		return res.status(500).json({ error: 'Errore interno del server' });
	}
});


// ==========================================
// FASE 2: GESTIONE PROGRESSI E GRAFICI
// ==========================================

// Rotta per salvare il risultato di una partita (chiamata dal Motore di Gioco)
router.post('/giochi/salva-risultato', express.json(), async (req, res) => {
	// Protezione middleware base in linea col resto del file
	if (!req.session.userId) {
		return res.status(401).json({ error: 'Utente non autenticato. Accesso negato.' });
	}
	// Delega la logica al nuovo ProgressController
	return ProgressController.saveScore(req, res);
});

// Rotta per recuperare i dati dei grafici (chiamata dalla Dashboard Professionista)
router.get('/pazienti/:id/progressi', async (req, res) => {
	if (!req.session.userId) {
		return res.status(401).json({ error: 'Utente non autenticato. Accesso negato.' });
	}
	// Delega la logica al nuovo ProgressController
	return ProgressController.getChartData(req, res);
});

module.exports = router;