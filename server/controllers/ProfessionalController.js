/**
 * WordCare - ProfessionalController.js 
 */

const path = require('path');
const UserRepository = require('../repositories/UserRepository');
const ProfessionalRepository = require('../repositories/ProfessionalRepository');
const AppuntamentoRepository = require('../repositories/AppuntamentoRepository');
const Behavior = require('../models/enums/ProfileBehavior');

class ProfessionalController {

  async DatiPersonali(req, res) {
    try {
      // Qui va bene usare req.session.userId perché il repository del profilo usa presumibilmente l'user_id
      const userId = req.session.userId;
      const dati = await ProfessionalRepository.getProfiloCompleto(userId);

      if (!dati) {
        console.log("❌ Profilo non trovato nel DB");
        return res.status(404).json({ error: 'Profilo non trovato' });
      }

      // Stampa per confermare cosa stai restituendo
      console.log("✅ Profilo restituito:", dati);

      res.json({
        id: userId,
        nome: dati.nome || '',
        cognome: dati.cognome || '',
        data_nascita: dati.data_nascita || '',
        specializzazione: dati.specializzazione || '',
        sede: dati.sede || ''
      });

    } catch (err) {
      console.error('❌ Errore interno nel recupero profilo:', err);
      res.status(500).json({ error: 'Errore interno' });
    }
  }

  async SalvaDatiProfilo(req, res) {
    try {
      const userId = req.session.userId;
      const success = await ProfessionalRepository.salvaProfilo(userId, req.body);
      if (!success) return res.status(500).json({ error: 'Errore salvataggio profilo' });
      res.status(200).json({ success: true });
    } catch (err) {
      console.error('❌ Errore salvataggio profilo:', err);
      res.status(500).json({ error: 'Errore aggiornamento dati' });
    }
  }

  async listPazienti(req, res) {
    try {
      const userId = req.session.userId;
      const professional = await ProfessionalRepository.findByUserId(userId);
      // Passiamo il VERO id del professionista
      const pazienti = await ProfessionalRepository.getPazientiInCura(professional.id);
      res.json(pazienti);
    } catch (err) {
      console.error('❌ Errore listPazienti:', err);
      res.status(500).json({ error: 'Errore DB' });
    }
  }

  async aggiungiPaziente(req, res) {
    try {
      const userId = req.session.userId;
      const professional = await ProfessionalRepository.findByUserId(userId);
      const professionalId = professional.id;
      
      await ProfessionalRepository.aggiungiPaziente(req.body, professionalId);
      console.log("✅ Paziente inserito/collegato correttamente.");
      res.status(200).json({ success: true });
    } catch (err) {
      // 🛑 Intercettiamo l'errore specifico dal Repository
      if (err.message === "PAZIENTE_GIA_PRESENTE") {
          console.log("⚠️ Tentativo di inserimento di un paziente già in cura.");
          return res.status(409).json({ error: 'Questo paziente è già presente nella tua lista.' });
      }
      
      console.error("❌ Errore durante inserimento paziente:", err);
      res.status(500).json({ error: 'Errore interno durante l\'inserimento del paziente' });
    }
  }

  // --- NUOVO: Controller per rimuovere il paziente ---
  async rimuoviPaziente(req, res) {
    try {
      const userId = req.session.userId;
      const professional = await ProfessionalRepository.findByUserId(userId);
      const pazienteId = req.params.id;

      await ProfessionalRepository.rimuoviPaziente(pazienteId, professional.id);
      
      console.log(`✅ Legame terminato tra Professionista ID: ${professional.id} e Paziente ID: ${pazienteId}`);
      res.status(200).json({ success: true });
    } catch (err) {
      console.error('❌ Errore durante la rimozione del paziente:', err);
      res.status(500).json({ error: 'Errore interno durante la rimozione' });
    }
  }

  dettaglioPaziente(req, res) {
    res.sendFile(path.join(__dirname, '..', 'public', 'professional', 'paziente.html'));
  }

  async listaAppuntamenti(req, res) {
    try {
      const userId = req.session.userId;
      const professional = await ProfessionalRepository.findByUserId(userId);
      
      const appuntamenti = await AppuntamentoRepository.getByProfessionistaId(professional.id);
      res.json(appuntamenti);
    } catch (err) {
      console.error('❌ Errore listaAppuntamenti:', err);
      res.status(500).json({ error: 'Errore DB' });
    }
  }

  async creaAppuntamento(req, res) {
    try {
      const userId = req.session.userId;
      const professional = await ProfessionalRepository.findByUserId(userId);
      
      await AppuntamentoRepository.crea({ ...req.body, professionalId: professional.id });
      res.status(200).json({ success: true });
    } catch (err) {
      console.error("❌ Errore creazione appuntamento:", err);
      res.status(500).json({ error: 'Errore DB' });
    }
  }

  async eliminaAppuntamento(req, res) {
    try {
      // Per l'eliminazione basta l'id della tabella appuntamento fornito dai params
      await AppuntamentoRepository.elimina(req.params.id);
      res.status(200).json({ success: true });
    } catch (err) {
      console.error('❌ Errore eliminaAppuntamento:', err);
      res.status(500).json({ error: 'Errore DB' });
    }
  }

  async listaGiochi(req, res) {
    try {
      const giochi = await ProfessionalRepository.getListaGiochi();
      res.json(giochi);
    } catch (err) {
      console.error('❌ Errore listaGiochi:', err);
      res.status(500).json({ error: 'Errore DB' });
    }
  }

  async assegnaGioco(req, res) {
    try {
      const userId = req.session.userId;
      const professional = await ProfessionalRepository.findByUserId(userId);
      
      await ProfessionalRepository.assegnaGioco({ ...req.body, professionalId: professional.id });
      res.status(200).json({ success: true });
    } catch (err) {
      console.error('❌ Errore assegnaGioco:', err);
      res.status(500).json({ error: 'Errore DB' });
    }
  }

  async listaPromemoria(req, res) {
    try {
      const userId = req.session.userId;
      const professional = await ProfessionalRepository.findByUserId(userId);
      
      const promemoria = await ProfessionalRepository.getPromemoria(professional.id);
      res.json(promemoria);
    } catch (err) {
      console.error('❌ Errore listaPromemoria:', err);
      res.status(500).json({ error: 'Errore DB' });
    }
  }

  async creaPromemoria(req, res) {
    try {
      const userId = req.session.userId;
      const professional = await ProfessionalRepository.findByUserId(userId);
      
      await ProfessionalRepository.creaPromemoria({ ...req.body, professionalId: professional.id });
      res.status(200).json({ success: true });
    } catch (err) {
      console.error('❌ Errore creaPromemoria:', err);
      res.status(500).json({ error: 'Errore DB' });
    }
  }

  async eliminaPromemoria(req, res) {
    try {
      // Per l'eliminazione basta l'id della tabella promemoria
      await ProfessionalRepository.eliminaPromemoria(req.params.id);
      res.status(200).json({ success: true });
    } catch (err) {
      console.error('❌ Errore eliminaPromemoria:', err);
      res.status(500).json({ error: 'Errore DB' });
    }
  }

}

module.exports = new ProfessionalController();