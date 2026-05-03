/**
 * WordCare - ProgressController.js
 * Gestisce le logiche di business per i punteggi e i grafici.
 */

const ProgressRepository = require('../repositories/ProgressRepository');

class ProgressController {
    
    /**
     * Riceve i dati dal frontend a fine partita e li salva.
     * Rotta prevista: POST /api/giochi/salva-risultato
     */
    async saveScore(req, res) {
        try {
            const { assegnazione_id, punteggio, punteggio_max, tempo_impiegato, dettagli_errori } = req.body;

            // Validazione base
            if (!assegnazione_id || punteggio === undefined || !punteggio_max) {
                return res.status(400).json({ error: "Dati mancanti per il salvataggio della sessione." });
            }

            const sessionId = await ProgressRepository.saveGameSession({
                assegnazione_id,
                punteggio,
                punteggio_max,
                tempo_impiegato,
                dettagli_errori
            });

            console.log(`✅ Sessione di gioco salvata con successo. ID: ${sessionId}`);
            res.status(200).json({ success: true, message: "Punteggio salvato correttamente!" });

        } catch (err) {
            console.error('❌ Errore durante il salvataggio della sessione:', err);
            res.status(500).json({ error: "Errore interno durante il salvataggio." });
        }
    }

    /**
     * Recupera i dati dal DB e li impacchetta per Chart.js applicando la normalizzazione.
     * Rotta prevista: GET /api/pazienti/:id/progressi
     */
    async getChartData(req, res) {
        try {
            const pazienteId = req.params.id;
            
            // 1. Recupero dati grezzi dal DB tramite Repository
            const storicoDati = await ProgressRepository.getPatientProgress(pazienteId);

            if (!storicoDati || storicoDati.length === 0) {
                return res.status(200).json({
                    labels: [],
                    datasets: []
                });
            }

            // 2. Preparazione degli array per Chart.js
            const labels = [];
            const normalizzati = [];

            // 3. Elaborazione e Normalizzazione (come richiesto nella To-Do List)
            storicoDati.forEach(sessione => {
                // Formattiamo la data per renderla leggibile sull'asse X del grafico (es: 20/05/2025)
                const dateObj = new Date(sessione.data_ora);
                const dataFormat = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
                
                labels.push(dataFormat);

                // Normalizzazione: (punteggio / punteggio_max) * 10
                let votoDecimi = (sessione.punteggio / sessione.punteggio_max) * 10;
                
                // Arrotondiamo a un decimale per pulizia grafica (es. 8.5)
                normalizzati.push(parseFloat(votoDecimi.toFixed(1)));
            });

            // 4. Invio della risposta strutturata per il frontend
            res.status(200).json({
                labels: labels,
                datasets: [
                    {
                        label: 'Andamento Punteggi (in decimi)',
                        data: normalizzati,
                        borderColor: '#26A69A', // Colore primario WordCare
                        backgroundColor: 'rgba(38, 166, 154, 0.2)',
                        fill: true,
                        tension: 0.3 // Rende la linea del grafico morbida/curva
                    }
                ]
            });

        } catch (err) {
            console.error('❌ Errore durante il recupero dei dati per il grafico:', err);
            res.status(500).json({ error: "Errore interno durante la generazione del grafico." });
        }
    }
}

module.exports = new ProgressController();