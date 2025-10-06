# Protocolo de Documentos EMEC

This is a web application for uploading and protocoling documents for EMEC employees. The application consists of a frontend built with HTML, CSS, and JavaScript, and a Node.js backend for searching employees in a database.

## Features

*   **Document Upload:** Upload documents for a specific employee.
*   **Employee Search:** Search for employees by name or CAD.
*   **Responsive Design:** The application is designed to work on both desktop and mobile devices.
*   **File Validation:** The frontend performs basic validation for file types and sizes.

## Tech Stack

*   **Frontend:**
    *   HTML
    *   Bootstrap 5
    *   JavaScript
*   **Backend:**
    *   Node.js
    *   Express.js
    *   PostgreSQL

## Getting Started

To run this project locally, you will need to have [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/) installed on your machine.

### 1. Clone the repository

```bash
git clone https://github.com/4dsjunior/ProtocoloEmec_V2.0.git
cd ProtocoloEmec_V2.0
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root of the project and add the following variables with your PostgreSQL database credentials:

```
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=your_database_host
DB_PORT=your_database_port
DB_DATABASE=your_database_name
```

### 4. Run the application

```bash
node server.js
```

The application will be available at `http://localhost:3000`.

## Deployment

The application is deployed as follows:

*   **Frontend:** The `index.html` file is hosted on GitHub Pages.
*   **Backend:** The Node.js server is hosted on a VPS using EasyPanel.

## API Endpoints

### `GET /search-employees`

Searches for employees by name or CAD.

*   **Query Parameters:**
    *   `term` (string, required): The search term.
*   **Success Response (200):**
    ```json
    [
      {
        "numcad": 12345,
        "nomfun": "NOME DO FUNCIONARIO"
      }
    ]
    ```

## Security Considerations

*   **SQL Injection:** The application uses parameterized queries to prevent SQL injection attacks.
*   **Database Credentials:** The database credentials are not stored in the code. They are loaded from environment variables.
*   **CORS:** The backend has a CORS policy that restricts requests to the frontend's domain.

### Remaining Risks

*   **Server-Side File Validation:** The application does not have server-side validation for file uploads. This is a **critical vulnerability** that should be addressed by adding validation logic to the n8n workflow.
*   **Public Webhook URL:** The n8n webhook URL is publicly exposed in the frontend code. This is a medium risk and should be addressed in the future by moving the webhook call to the backend.
