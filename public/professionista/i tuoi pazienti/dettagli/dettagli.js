// /professionista/i tuoi pazienti/dettagli/dettagli.js

// 1. LOGICA DELLA PAGINA E DATI PAZIENTE
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


  // Carica dati anagrafici paziente e esercizi
  if (patientId === 'demo') {
      // Dati demo fittizi
      renderPatientHeader({id: 'demo', nome: 'Mario', cognome: 'Rossi', data_nascita: '1980-01-01', patologia: 'Disturbo Specifico del Linguaggio'});
      renderEsercizi([
        {gioco: 'Completa la frase', scadenza: '2025-06-10', ripetizioni_svolte: 5, ripetizioni_assegnate: 5},
        {gioco: 'B o P?', scadenza: '2025-06-12', ripetizioni_svolte: 1, ripetizioni_assegnate: 4}
      ]);
  } else {
      // Dati Reali dal DB
      fetch(`/professionista/pazienti/${patientId}/dati`)
        .then(res => {
            if(!res.ok) throw new Error("Paziente non trovato");
            return res.json();
        })
        .then(data => renderPatientHeader(data))
        .catch(err => {
            document.getElementById('patient-header-container').innerHTML = `<h3 style="color:var(--danger)">Errore: Paziente non trovato.</h3>`;
        });

      fetch(`/professionista/pazienti/${patientId}/esercizi`)
        .then(res => res.json())
        .then(data => renderEsercizi(data))
        .catch(err => console.error("Nessun esercizio trovato", err));
  }

  // 2. DISEGNA I GRAFICI (Ora usa Chart.js)
  drawCharts();
});

// -- FUNZIONI DI UTILITA' --

function getPatientIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('id') || 'demo'; 
}

function formatDate(data) {
  if (!data) return '';
  const [y, m, d] = data.split('-');
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

// -- RENDER HTML --

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
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <input type="checkbox" class="status-checkbox" ${isCompletato ? 'checked' : ''} onclick="return false;">
      </td>
      <td style="font-weight: 600; color: var(--primary);">${es.gioco}</td>
      <td>${formatDate(es.scadenza)}</td>
      <td>
        <span style="font-weight:bold; color: ${isCompletato ? 'var(--success)' : 'var(--text)'}">
          ${es.ripetizioni_svolte}
        </span> / ${es.ripetizioni_assegnate}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ----------------- GRAFICI STATICI DEMO CON CHART.JS ------------------

function drawCharts() {
  drawEserciziSettimanali();
  drawMediaSettimane();
}

function drawEserciziSettimanali() {
  const ctx = document.getElementById('canvasEsercizi');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'],
      datasets: [{
        label: 'Esercizi svolti',
        data: [3, 5, 2, 4, 6, 7, 3], // Dati Demo
        backgroundColor: 'rgba(102, 126, 234, 0.7)', // Usa un colore simile a var(--primary) con opacità
        borderColor: '#667eea',
        borderWidth: 1,
        borderRadius: 4 // Arrotonda gli angoli delle barre
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false // Nascondiamo la legenda perché c'è un solo dataset ed è ovvio
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 10,
          grid: {
             color: '#f0f0f0' // Griglia leggera
          }
        },
        x: {
           grid: {
              display: false // Nasconde le righe verticali
           }
        }
      }
    }
  });
}

function drawMediaSettimane() {
  const ctx = document.getElementById('canvasMedia');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Set 1', 'Set 2', 'Set 3', 'Set 4', 'Set 5', 'Set 6'],
      datasets: [{
        label: 'Media Punteggio',
        data: [7.5, 8.0, 6.2, 9.0, 8.4, 7.8], // Dati Demo
        borderColor: '#764ba2', // Usa un colore simile a var(--accent)
        backgroundColor: 'rgba(118, 75, 162, 0.2)', // Riempimento semitrasparente sotto la linea
        borderWidth: 3,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#764ba2',
        pointBorderWidth: 2,
        pointRadius: 4,
        fill: true,
        tension: 0.4 // Rende la linea curva e morbida
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
           callbacks: {
              label: function(context) {
                  return 'Media: ' + context.parsed.y;
              }
           }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 10,
          grid: {
             color: '#f0f0f0'
          }
        },
        x: {
           grid: {
              display: false
           }
        }
      }
    }
  });
}