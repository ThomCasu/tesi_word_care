/**
 * WordCare - PatientController.js
 */

const UserRepository = require('../repositories/UserRepository');
const PatientRepository = require('../repositories/PatientRepository');
const Behavior = require('../models/enums/ProfileBehavior');
const InCuraRepository = require('../repositories/InCuraRepository');
const ProfessionistaRepository = require('../repositories/ProfessionalRepository');
const path = require('path');

class PatientController {
	// Managing the flow of the patient dashboard
	// Route: /paziente
	async Patient(req, res) {
		try {
			// Trova l'utente tramite l'ID della sessione
			const userId = req.session.userId;
			const user = await UserRepository.findById(userId);
			if (!user) {
				// Redirect alla pagina di errore con query string
				const params = new URLSearchParams({
					code: '404',
					title: 'Utente non trovato',
					message: "Si è verificato un errore: l'utente non è stato trovato.",
					returnUrl: '/login'
				});
				return res.redirect(`/error.html?${params.toString()}`);
			}

			// Renderizza la vista del paziente
			res.sendFile(path.join(__dirname, '../../public/views/Paziente/paziente.html'));
		} catch (err) {
			console.error('Error in patient dashboard:', err);
			// Redirect alla pagina di errore con query string
			const params = new URLSearchParams({
				code: '500',
				title: 'Errore interno del server',
				message: "Si è verificato un errore durante il recupero della dashboard del paziente.",
				returnUrl: '/login'
			});
			return res.redirect(`/error.html?${params.toString()}`);
		}
	}

	async getPatientDashboard(req, res) {
		try {
			// N.B: ho uniformato req.user.id a req.session.userId basandomi sulla tua logica standard
			const userId = req.session.userId || req.user?.id; 
			const user = await UserRepository.findById(userId);
			const patient = await PatientRepository.findByUserId(userId);
			if (!user) {
				// Redirect alla pagina di errore con query string
				const params = new URLSearchParams({
					code: '404',
					title: 'Utente non trovato',
					message: "Si è verificato un errore: l'utente non è stato trovato.",
					returnUrl: '/login'
				});
				return res.redirect(`/error.html?${params.toString()}`);
			}
			if (!patient) {
				// Redirect alla pagina di errore con query string
				const params = new URLSearchParams({
					code: '404',
					title: 'Paziente non trovato',
					message: "Si è verificato un errore: non è stato trovato un profilo paziente associato alle tue credenziali.",
					returnUrl: '/login'
				});
				return res.redirect(`/error.html?${params.toString()}`);
			}

			res.json({
				name: patient.nome,
				surname: patient.cognome,
				behavior: user.behavior
			});
		} catch (error) {
			console.error('Errore nel recupero della dashboard:', error);
			// Redirect alla pagina di errore con query string
			const params = new URLSearchParams({
				code: '500',
				title: 'Errore interno del server',
				message: "Si è verificato un errore durante il recupero della dashboard del paziente.",
				returnUrl: '/login'
			});
			return res.redirect(`/error.html?${params.toString()}`);
		}
	}

	async getProfessionistaInCura(req, res) {
		try {
			const paziente = await PatientRepository.findByUserId(req.session.userId);
			const relazione = await InCuraRepository.findActiveByPazienteId(paziente.id);
			
			if(!relazione) {
				return res.json({ message: "Nessun professionista attualmente in cura." });
			}

			const professionista = await ProfessionistaRepository.findById(relazione.professionista);

			res.json({
				nome: professionista.nome,
				cognome: professionista.cognome,
				data_nascita: professionista.data_nascita,
				specializzazione: professionista.specializzazione,
				sede: professionista.sede,
				data_inizio: relazione.data_inizio
			});
		} catch (err) {
			console.error('Errore nel recupero del professionista:', err);
			// Redirect alla pagina di errore con query string
			const params = new URLSearchParams({
				code: '500',
				title: 'Errore nel server',
				message: "Si è verificato un errore: non è stato possibile recuperare il professionista in cura.",
				returnUrl: '/paziente'
			});
			return res.redirect(`/error.html?${params.toString()}`);
		}
	}

	/**
	 * NOVITÀ: Endpoint per permettere al Professionista di cercare i suoi pazienti
	 */
	async searchPazienti(req, res) {
		try {
			// 1. Recuperiamo l'ID utente dalla sessione (del professionista loggato)
			const userId = req.session.userId;

			// 2. Troviamo il record 'Professionista' corrispondente a questo User
			const professionista = await ProfessionistaRepository.findByUserId(userId);
			if (!professionista) {
				return res.status(403).json({ error: "Accesso negato: profilo professionista non trovato." });
			}

			// 3. Estraiamo i filtri di ricerca dalla query string dell'URL (?query=...&eta=...)
			const filtri = {
				query: req.query.query || null,
				eta: req.query.eta ? parseInt(req.query.eta) : null
			};

			// 4. Interroghiamo il DB passando l'ID reale del professionista
			const risultati = await PatientRepository.searchPazientiInCura(professionista.id, filtri);
			
			// 5. Restituiamo i risultati in formato JSON
			res.status(200).json(risultati);
		} catch (err) {
			console.error('Errore durante la ricerca dei pazienti:', err);
			res.status(500).json({ error: "Si è verificato un errore interno durante la ricerca dei pazienti." });
		}
	}
}

module.exports = new PatientController();