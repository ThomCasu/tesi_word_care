// /professionista/i tuoi pazienti/dettagli/dettagli.js

// Variabili globali per memorizzare le istanze dei grafici e distruggerle prima di ridisegnarle
let generalChartInstance = null;
let timeChartInstance = null;
let errorChartInstance = null;
let globalRawData = []; // Salveremo qui i dati crudi del DB

document.addEventListener('DOMContentLoaded', () => {
  const patientId = getPatientIdFromUrl();

  // Gestione Navbar
  const avatarTrigger = document.getElementById("avatar-dropdown-trigger");
  const avatarMenu = document.getElementById("avatar-dropdown-menu");
  if (avatarTrigger && avatarMenu) {
      avatarTrigger.addEventListener("click", (e) => {
          e.stopPropagation();
          avatarMenu.classList.toggle("active");
      });
      document.addEventListener("click", () => {
          if(avatarMenu.classList.contains("active")) avatarMenu.classList.remove("active");
      });
  }

  fetch("/professionista/profilo")
    .then(res => res.json())
    .then(data => {
      const dropdownName = document.getElementById("dropdown-name");
      if (dropdownName && data.cognome) dropdownName.textContent = `Dr. ${data.cognome}`;
    }).catch(err => console.error("Errore profilo navbar:", err));

  // Inizializza Dati Anagrafici ed Esercizi
  initPatientInfo(patientId);

  // Inizializza Grafici (FASE 4)
  initChartsData(patientId);
  
  // Listener per il filtro giochi
  document.getElementById('game-filter').addEventListener('change', (e) => {
      drawSpecificCharts(e.target.value);
  });
});

// -- UTILITA' --
function getPatientIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('id') || 'demo'; 
}

function formatDate(data) {
  if (!data) return '';
  const [y, m, d] = data.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

function calcolaEta(dataNascita) {
  if (!dataNascita) return 'N/A';
  const oggi = new Date();
  const nascita = new Date(dataNascita);
  let eta = oggi.getFullYear() - nascita.getFullYear();
  const m = oggi.getMonth() - nascita.getMonth();
  if (m < 0 || (m === 0 && oggi.getDate() < nascita.getDate())) eta--;
  return eta;
}

// -- RENDER INFO BASE --
function initPatientInfo(patientId) {
    if (patientId === 'demo') {
        renderPatientHeader({id: 'demo', nome: 'Mario', cognome: 'Rossi', data_nascita: '2015-01-01', patologia: 'Disturbo Fonologico'});
        renderEsercizi([
          {gioco: 'Completa la frase', scadenza: '2025-06-10', ripetizioni_svolte: 5, ripetizioni_assegnate: 5},
        ]);
        return;
    }

    fetch(`/professionista/pazienti/${patientId}/dati`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => renderPatientHeader(data))
      .catch(() => document.getElementById('patient-header-container').innerHTML = `<h3 style="color:var(--danger)">Errore: Paziente non trovato.</h3>`);

    fetch(`/professionista/pazienti/${patientId}/esercizi`)
      .then(res => res.json())
      .then(data => renderEsercizi(data))
      .catch(err => console.error(err));
}

function renderPatientHeader(data) {
  const container = document.getElementById('patient-header-container');
  if (!container) return;
  const iniziali = (data.nome.charAt(0) + data.cognome.charAt(0)).toUpperCase();
  const patologia = data.patologia || "Nessuna patologia specificata";

  container.innerHTML = `
    <div class="patient-header-avatar">${iniziali}</div>
    <div class="patient-header-info">
      <h2>${data.nome} ${data.cognome}</h2>
      <div class="patient-header-badges">
        <span class="badge"><i class="fas fa-fingerprint"></i> ID: ${data.id}</span>
        <span class="badge"><i class="fas fa-birthday-cake"></i> ${calcolaEta(data.data_nascita)} anni (${formatDate(data.data_nascita)})</span>
        <span class="badge"><i class="fas fa-notes-medical"></i> ${patologia}</span>
      </div>
    </div>
  `;
}

function renderEsercizi(data) {
  const tbody = document.getElementById('esercizi-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--subtext)">Nessun esercizio assegnato</td></tr>`;
      return;
  }
  data.forEach(es => {
    const isCompletato = es.ripetizioni_svolte >= es.ripetizioni_assegnate;
    tbody.innerHTML += `
      <tr>
        <td><input type="checkbox" class="status-checkbox" ${isCompletato ? 'checked' : ''} onclick="return false;"></td>
        <td style="font-weight: 600; color: var(--primary);">${es.gioco}</td>
        <td>${formatDate(es.scadenza)}</td>
        <td><span style="font-weight:bold; color: ${isCompletato ? 'var(--success)' : 'var(--text)'}">${es.ripetizioni_svolte}</span> / ${es.ripetizioni_assegnate}</td>
      </tr>`;
  });
}

// ==========================================
// FASE 4: LOGICA GRAFICI STATISTICI API
// ==========================================

async function initChartsData(patientId) {
    try {
        let chartData, rawData;

        if (patientId === 'demo') {
            // Dati fittizi per visualizzare il layout senza DB
            chartData = { labels: ['01/05', '03/05', '05/05'], datasets: [{ label: 'Andamento', data: [6, 8, 10], borderColor: '#764ba2', backgroundColor: 'rgba(118, 75, 162, 0.2)', fill: true, tension: 0.3 }] };
            rawData = [
                { data_ora: '2025-05-01T10:00:00', punteggio: 6, punteggio_max: 10, tempo_impiegato: 120, dettagli_errori: '["CONILIO", "GIRAFA", "CONILIO"]', gioco_nome: 'Completa la frase' },
                { data_ora: '2025-05-03T10:00:00', punteggio: 8, punteggio_max: 10, tempo_impiegato: 90,  dettagli_errori: '["GIRAFA"]', gioco_nome: 'Completa la frase' },
                { data_ora: '2025-05-05T10:00:00', punteggio: 10, punteggio_max: 10, tempo_impiegato: 45, dettagli_errori: '[]', gioco_nome: 'Completa la frase' }
            ];
        } else {
            // Chiamata vera all'API
            const response = await fetch(`/api/pazienti/${patientId}/progressi`);
            const result = await response.json();
            chartData = result.chartData;
            rawData = result.rawData;
        }

        globalRawData = rawData || [];
        
        // 1. Disegna Grafico Globale (Line)
        drawGeneralChart(chartData);
        
        // 2. Popola Menu a Tendina
        populateGameFilter(globalRawData);

    } catch (err) {
        console.error("Errore nel caricamento dei dati dei grafici:", err);
    }
}

function drawGeneralChart(chartData) {
    const ctx = document.getElementById('canvasMedia');
    if (!ctx) return;
    if (generalChartInstance) generalChartInstance.destroy();

    // Se non ci sono dati, mostra un grafico vuoto pulito
    if (!chartData || chartData.labels.length === 0) {
        chartData = { labels: ['Nessun dato'], datasets: [{ data: [], label: 'In attesa di partite' }] };
    }

    generalChartInstance = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, max: 10, grid: { color: '#f0f0f0' } },
                x: { grid: { display: false } }
            }
        }
    });
}

function populateGameFilter(rawData) {
    const filterSelect = document.getElementById('game-filter');
    if (!filterSelect) return;
    
    // Estrae i nomi dei giochi unici a cui ha giocato
    const uniqueGames = [...new Set(rawData.map(row => row.gioco_nome))];
    
    uniqueGames.forEach(game => {
        const option = document.createElement('option');
        option.value = game;
        option.textContent = game;
        filterSelect.appendChild(option);
    });

    document.getElementById('no-data-msg').style.display = uniqueGames.length > 0 ? 'block' : 'none';
}

function drawSpecificCharts(selectedGame) {
    const wrapper = document.getElementById('specific-charts-container');
    const msg = document.getElementById('no-data-msg');

    if (selectedGame === 'all' || !selectedGame) {
        wrapper.style.display = 'none';
        msg.style.display = 'block';
        return;
    }

    wrapper.style.display = 'grid'; // Layout CSS grid (affiancati)
    msg.style.display = 'none';

    // Filtra i dati solo per il gioco scelto
    const gameData = globalRawData.filter(row => row.gioco_nome === selectedGame);
    
    drawTimeChart(gameData);
    drawErrorChart(gameData);
}

// Grafico 2: Tempo Impiegato (Barre)
function drawTimeChart(gameData) {
    const ctx = document.getElementById('canvasTempo');
    if (timeChartInstance) timeChartInstance.destroy();

    const labels = gameData.map(row => {
        const d = new Date(row.data_ora);
        return `${d.getDate()}/${d.getMonth() + 1}`;
    });
    const dataTempo = gameData.map(row => row.tempo_impiegato);

    timeChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Secondi',
                data: dataTempo,
                backgroundColor: 'rgba(102, 126, 234, 0.7)',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { grid: { display: false } } }
        }
    });
}

// Grafico 3: Analisi Errori Frequenti (Ciambella)
function drawErrorChart(gameData) {
    const ctx = document.getElementById('canvasErrori');
    if (errorChartInstance) errorChartInstance.destroy();

    // Logica di conteggio parole errate
    const conteggioErrori = {};
    
    gameData.forEach(row => {
        let erroriArray = [];
        try {
            // Parso la stringa JSON dal database
            erroriArray = JSON.parse(row.dettagli_errori || "[]");
        } catch (e) { console.error("Errore parsing JSON errori", e); }
        
        erroriArray.forEach(errore => {
            conteggioErrori[errore] = (conteggioErrori[errore] || 0) + 1;
        });
    });

    const labels = Object.keys(conteggioErrori);
    const dataValori = Object.values(conteggioErrori);

    if (labels.length === 0) {
        // Nessun errore commesso in questo gioco
        errorChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: ['Nessun Errore!'], datasets: [{ data: [1], backgroundColor: ['#a8e6a2'] }] },
            options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { tooltip: { enabled: false } } }
        });
        return;
    }

    // Colori belli per la ciambella
    const colori = ['#f8a7a7', '#ffcc70', '#667eea', '#764ba2', '#26A69A', '#e74c3c'];

    errorChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: dataValori,
                backgroundColor: colori.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%', // Rende la ciambella sottile
            plugins: {
                legend: { position: 'right', labels: { boxWidth: 12, font: { size: 10 } } }
            }
        }
    });
}