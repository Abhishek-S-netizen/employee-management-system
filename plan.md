# Employee Management System - Implementation Plan

This plan outlines the architecture and steps to implement the "Add Employee / Add Intern" module for the Employee Management System, focusing on a robust Node.js/Express backend, PostgreSQL database, and automated document workflows.

## User Review Required

> [!IMPORTANT]
> **Cloudinary & SMTP Credentials**: Since this implementation involves Cloudinary and Nodemailer, we will need to set up environment variables for API keys and SMTP credentials.
> **Puppeteer in Windows**: Running Puppeteer on local Windows environments usually requires the browser to be installed. We will ensure the setup script handles this or uses the bundled Chromium.
> **Database Access**: We assume a local or remote PostgreSQL instance is available. We will need the connection string.

## Proposed Changes

### 1. Database Schema (PostgreSQL)

We will use two main tables as requested.

#### `users` table
| Column | Type | Constraints |
| :--- | :--- | :--- |
| `id` | SERIAL | PRIMARY KEY |
| `name` | VARCHAR | NOT NULL |
| `email` | VARCHAR | UNIQUE, NOT NULL |
| `role` | VARCHAR | NOT NULL |
| `type` | VARCHAR | CHECK (type IN ('employee', 'intern')) |
| `title` | VARCHAR | NOT NULL |
| `employee_code` | VARCHAR | UNIQUE, NOT NULL |
| `start_date` | DATE | NOT NULL |
| `end_date` | DATE | NULLABLE |
| `employee_code_link`| TEXT | |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

#### `offer_letters` table
| Column | Type | Constraints |
| :--- | :--- | :--- |
| `id` | SERIAL | PRIMARY KEY |
| `user_id` | INTEGER | FOREIGN KEY (users.id) |
| `link` | TEXT | NOT NULL (Cloud URL) |
| `offer_letter_code` | VARCHAR | UNIQUE, NOT NULL |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

---

### 2. Backend Architecture (Node.js + Express)

The backend will follow a **Controller-Service-Repository** pattern to ensure modularity and scalability.

#### Folder Structure
```text
backend/
├── src/
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic (PDF, Email, Cloudinary)
│   ├── repositories/     # Data access layer (SQL queries)
│   ├── templates/        # HTML templates for offer letters
│   ├── utils/            # Helpers (Validation, Code generation)
│   ├── config/           # DB, Cloudinary, Mailer config
│   └── routes/           # API endpoints
├── .env                  # Secrets
└── app.js                # Entry point
```

#### Key Logic Components
- **Code Generation**: Helper to format IDs (001, 002) and generate codes (E001, IN002, OL001).
- **Template Engine**: Using a lightweight library (like `handlebars` or simple regex) to replace placeholders in HTML.
- **PDF Service**: Puppeteer service to launch a headless browser and generate PDF buffers from HTML.
- **Upload Service**: Cloudinary SDK wrapper to upload buffers and retrieve secure URLs.
- **Email Service**: Nodemailer integration to send HTML emails with the document link.

---

### 3. Frontend (React)

- **Form Component**: A Tailwind-styled (or vanilla CSS) React form with validation logic.
- **Feedback UI**: Success/Error notifications for the appointment process.
- **State Management**: Simple `useState` or `useReducer` for form fields.

---

## Technical Report & Workflow Detail

### Sequence of Operation

1. **Frontend Validation**: Ensure all required fields (including conditional `end_date`) are present.
2. **Database Transaction (Lean Scope)**:
   - Start SQL Transaction.
   - Insert user → Get serial ID.
   - Generate `employee_code` based on ID and type.
   - Update user with code and `employee_code_link`.
   - Insert record into `offer_letters` table with `link` set to `NULL` initially.
   - **Commit Transaction**.
3. **External Operations (Post-Commit)**:
   - Select appropriate template (Intern vs Employee).
   - Generate dynamic HTML with user data.
   - Puppeteer: Convert HTML to PDF buffer.
   - Cloudinary: Upload PDF buffer and receive public URL.
   - **Database Update**: Update the `offer_letters` record with the generated Cloudinary link.
   - **Email Delivery**: Send email via Nodemailer containing the downloadable link.
4. **Response**: Return the registered user data and the offer letter link to the frontend.

---

## Verification Plan

### Manual Verification
- Verify the "Appoint" process completes successfully in the UI.
- Confirm the `offer_letters` table is updated with the link after the initial insertion.
- Check Cloudinary for the PDF and verify the link works.
- Check inbox for the email delivery.
- Validate Intern-specific fields (EndDate) validation logic.
