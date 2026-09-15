# 🌟 **WordCare** 🌟

> Progetto nato come lavoro di gruppo universitario (La Sapienza) e sviluppato ulteriormente da
> [Thomas Casu](https://github.com/ThomCasu) come base per la propria tesi di laurea in Ingegneria
> Informatica. Repository originale del gruppo: https://github.com/mgiorg/WordCare

## 🧠 **Descrizione del Progetto**

**WordCare** è una piattaforma innovativa progettata per supportare gli studi di logopedia, favorendo una stretta collaborazione tra pazienti e professionisti. L'obiettivo è fornire strumenti interattivi e personalizzati per migliorare le abilità linguistiche, monitorare i progressi e facilitare la comunicazione.

### ✨ **Funzionalità principali**

- **Autenticazione sicura**: Registrazione e login per pazienti e professionisti.
- **Dashboard personalizzata**: Visualizzazione di esercizi, statistiche e attività.
- **Strumenti interattivi**: Giochi e attività per migliorare le abilità linguistiche.
- **Gestione del profilo**: Personalizzazione per pazienti e logopedisti.

---

## 📂 **Struttura del Progetto**

```
WordCare
├── public
│   ├── css
│   │   └── login.css
│   ├── views
│   │   ├── login.html
│   │   └── paziente.html
│   ├── js
│   │   └── script.js
├── server
│   ├── controllers
│   │   └── authController.js
│   ├── routes
│   │   └── authRoutes.js
│   ├── database
│   │   └── database.js
│   ├── models
│   │   └── userModel.js
│   ├── repositories
│   │   └── userRepository.js
│   └── server.js
├── package.json
└── README.md
```

---

## 🛠️ **Prerequisiti**

Prima di iniziare, assicurati di avere:

- **Node.js** (versione 16 o superiore) installato sul tuo sistema.
- **npm** (Node Package Manager), incluso con Node.js.

---

## 📥 **Installazione**

### 1️⃣ **Clona il repository**

```bash
git clone <repository-url>
```

### 2️⃣ **Accedi alla directory del progetto**

```bash
cd WordCare
```

## 🖥️ **Come Installare Node.js e npm**

### **Windows**

1. Scarica il programma di installazione di Node.js dal sito ufficiale: [Node.js](https://nodejs.org).
2. Durante l'installazione, seleziona l'opzione per aggiungere Node.js al `PATH`.
3. Dopo l'installazione, verifica che Node.js e npm siano installati:
   ```bash
   node -v
   npm -v
   ```

### **Mac**

1. Installa Node.js utilizzando Homebrew:
   ```bash
   brew install node
   ```
2. Verifica l'installazione:
   ```bash
   node -v
   npm -v
   ```

### **Linux**

1. Usa il gestore di pacchetti del tuo sistema operativo. Ad esempio, su Ubuntu:
   ```bash
   sudo apt update
   sudo apt install nodejs npm
   ```
2. Verifica l'installazione:
   ```bash
   node -v
   npm -v
   ```

---

### 3️⃣ **Installa le dipendenze**

Esegui il seguente comando per installare tutte le librerie necessarie:

```bash
npm install
```

---

## 📚 **Librerie Necessarie**

### **Librerie di Produzione**

Queste librerie sono essenziali per il funzionamento del progetto:

1. **express**

   - **Descrizione**: Framework per creare il server web.
   - **Funzionalità**: Gestisce le route e le richieste HTTP.
   - **Installazione**:
     ```bash
     npm install express
     ```

2. **express-session**

   - **Descrizione**: Gestisce le sessioni utente per mantenere lo stato tra le richieste.
   - **Funzionalità**: Permette di salvare informazioni come l'ID utente durante la sessione.
   - **Installazione**:
     ```bash
     npm install express-session
     ```

3. **sqlite3**

   - **Descrizione**: Libreria per interagire con il database SQLite.
   - **Funzionalità**: Utilizzata per archiviare i dati degli utenti e altre informazioni.
   - **Installazione**:
     ```bash
     npm install sqlite3
     ```

4. **bcrypt**
   - **Descrizione**: Libreria per l'hashing sicuro delle password.
   - **Funzionalità**: Garantisce che le password siano archiviate in modo sicuro.
   - **Installazione**:
     ```bash
     npm install bcrypt
     ```

---

### **Librerie di Sviluppo**

Queste librerie sono utili durante lo sviluppo per migliorare la produttività:

1. **nodemon**
   - **Descrizione**: Riavvia automaticamente il server ogni volta che i file vengono modificati.
   - **Installazione**:
     ```bash
     npm install nodemon --save-dev
     ```

---

## 🚀 **Avvio del Progetto**

### 1️⃣ **Avvia il server**

Esegui il seguente comando per avviare il server:

```bash
npm start
```

### 2️⃣ **Apri il browser**

Vai su `http://localhost:3000` per accedere all'applicazione.

---

## 📖 **Dettagli dei File**

### **Frontend**

- **`public/views/login.html`**: Pagina di login e registrazione.
- **`public/css/login.css`**: Stile per la pagina di login.
- **`public/views/paziente.html`**: Dashboard del paziente.

### **Backend**

- **`server/server.js`**: Punto di ingresso del server.
- **`server/routes/authRoutes.js`**: Definizione delle route per autenticazione.
- **`server/controllers/authController.js`**: Logica per login e registrazione.
- **`server/database/database.js`**: Configurazione del database SQLite.
- **`server/repositories/userRepository.js`**: Query al database per gli utenti.

---

## 🛡️ **Tecnologie Utilizzate**

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Database**: SQLite

---

## 📜 **Licenza**

Questo progetto è distribuito sotto la licenza MIT.

---

## 💡 **Suggerimenti**

- Usa **`nodemon`** durante lo sviluppo per evitare di riavviare manualmente il server:
  ```bash
  npm run dev
  ```
- Assicurati che il file `database.db` sia nella directory corretta (`server/database`) per evitare errori di connessione.

---

## 🤝 **Contribuisci**

Se hai idee, suggerimenti o vuoi contribuire al progetto, non esitare a contattarmi! 😊
