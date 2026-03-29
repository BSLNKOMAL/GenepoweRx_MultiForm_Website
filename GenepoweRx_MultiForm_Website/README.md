# GenepoweRx® MultiForm Website
### Genetic Science powered by K&H

---

## 🚀 HOW TO RUN

### Step 1 — Start MongoDB
MongoDB is already running if you see it in MongoDB Compass.
If not:
```powershell
mkdir C:\data\db
mongod --dbpath C:\data\db
```

### Step 2 — Start Backend (Terminal 1)
```powershell
cd C:\Users\perra\PycharmProjects\GenepoweRx_MultiForm_Website\backend
npm install
node server.js
```
✅ Should show:
```
🚀 Server running on port 5000
✅ MongoDB Connected: localhost  (database: genepowerx_internals)
```

### Step 3 — Start Frontend (Terminal 2)
```powershell
cd C:\Users\perra\PycharmProjects\GenepoweRx_MultiForm_Website\frontend
npm install
npm start
```
✅ Browser opens at **http://localhost:3000**

---

## 📁 PROJECT STRUCTURE

```
GenepoweRx_MultiForm_Website/
├── backend/
│   ├── assets/logo.png              ← GenepoweRx logo (used in PDFs)
│   ├── config/db.js                 ← MongoDB: genepowerx_internals
│   ├── controllers/
│   │   ├── patientController.js     ← Patient CRUD + analytics
│   │   ├── formController.js        ← Form submit + PDF generation + visit tracking
│   │   ├── exportController.js      ← Excel export (4 types)
│   │   └── draftController.js       ← Draft save/load/delete
│   ├── middleware/upload.js         ← File upload (Multer, Windows-compatible)
│   ├── models/
│   │   ├── Patient.js               ← Auto ID: KHGENEPOWERX-NAME
│   │   ├── FormSubmission.js        ← visitNumber, visitLabel, isRevisit
│   │   └── Draft.js
│   ├── routes/api.js                ← All API routes
│   ├── uploads/                     ← Auto-created per patient
│   │   └── KHGENEPOWERX-NAME/
│   │       └── visit_1/
│   │           ├── pdfs/            ← Generated PDFs
│   │           └── uploads/         ← Patient uploaded files
│   ├── utils/pdfGenerator.js        ← PDFKit with logo & branding
│   └── server.js
│
└── frontend/
    └── src/
        ├── assets/logo.png          ← Transparent GenepoweRx logo
        ├── components/
        │   ├── Layout/              ← Sidebar + topbar
        │   └── common/
        │       ├── FormComponents.js
        │       ├── FileUpload.js    ← Drag & drop file upload
        │       └── RevisitBanner.js ← Shows on revisit forms
        ├── pages/
        │   ├── Dashboard.js         ← Stats & charts
        │   ├── PatientsPage.js      ← Patient list + search
        │   ├── PatientDetail.js     ← Profile + visit history + drafts
        │   ├── PatientLookup.js     ← Patient ID lookup + pre-fill revisit
        │   ├── DraftsPage.js
        │   ├── FormsHub.js
        │   ├── Guidelines.js        ← Instructions for patients & doctors
        │   ├── ExportPage.js        ← Excel export (4 types)
        │   ├── VisitDetail.js       ← Read-only visit view
        │   └── forms/
        │       ├── LifestyleForm.js
        │       ├── ShortLifestyleForm.js
        │       ├── WESForm.js
        │       ├── ONCoForm.js
        │       ├── ConsentForm.js   ← Canvas signature + PDF
        │       ├── useFormSubmit.js ← Submit + visit tracking + file upload
        │       └── useFormDraft.js
        └── services/api.js
```

---

## 🗄️ DATABASE
- **Name:** `genepowerx_internals`
- **Host:** `mongodb://localhost:27017/genepowerx_internals`

---

## 🔌 API ENDPOINTS

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/analytics | Dashboard stats |
| GET | /api/patients | All patients |
| GET | /api/patients/search?q= | Search |
| GET | /api/patients/:id | Patient details |
| POST | /api/forms/submit | Submit form (multipart) |
| POST | /api/forms/consent | Submit consent |
| GET | /api/history/:patientId | All visits for patient |
| GET | /api/visits/:patientId | Visit summary |
| GET | /api/pdf/submission/:id | Download visit PDF |
| GET | /api/pdf/:patientId/:type | Download latest PDF |
| GET | /api/export/patients | Excel: all patients |
| GET | /api/export/form/:formType | Excel: by form type |
| GET | /api/export/clinical-insights | Excel: clinical report |
| GET | /api/export/patient/:patientId | Excel: single patient |

---

## ✅ FEATURES

### Patient ID Format
`KHGENEPOWERX-PATIENTNAME` (e.g. `KHGENEPOWERX-JOHNDOE`)

### Multi-Visit System
- Each form submission = new visit (Visit 1, Visit 2, Visit 3...)
- Previous visit data never overwritten
- View any visit in read-only mode
- Pre-fill new visit from previous visit data

### 5 Forms
- Lifestyle Form (full intake)
- Short Lifestyle Form
- WES Questionnaire
- ONCO Questionnaire
- Consent Form (canvas signature + PDF)

### PDF Generation
- Auto-generated after every form submission
- Contains GenepoweRx logo, patient info, all form data
- Stored in `uploads/PATIENTID/visit_N/pdfs/`
- Download from patient profile or visit detail page

### File Upload
- Drag & drop on every form
- Stored in `uploads/PATIENTID/visit_N/uploads/`
- Works on Windows (copy+delete, not rename)

### Excel Export (4 types)
- All patients registry
- Form-wise (all visits for a form type)
- Clinical insights (ONCO, WES, mental health sheets)
- Single patient (all forms + all visits)

### Draft System
- Save any form as draft
- Resume from any device using draft ID
- Linked to patient ID

### Guidelines Page
- Instructions for patients (5 tabs)
- Instructions for doctors/admin
