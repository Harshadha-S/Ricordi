# Ricordi

**A scrapbook-style digital journal for preserving everyday memories.**

Ricordi is a personal journaling experience inspired by the warmth of a physical scrapbook. It brings daily writing prompts, dated journal entries, photographs, and a nostalgic album interface together in one place.

> *A little space for the days you want to remember.*

## Features

- **Daily writing prompts** — discover a prompt to help you reflect and write.
- **Dated journal entries** — write and revisit entries by date.
- **Photo memories** — add photographs to journal days and include captions.
- **Calendar and date navigation** — move between days and revisit past entries.
- **On This Day** — revisit memories associated with the current date from previous years, where matching entries exist.
- **Scrapbook-inspired interface** — a vintage album aesthetic with decorative details.
- **Album themes** — choose from the available visual themes.
- **Decorations** — scrapbook-style decorative assets are included as the decoration experience is developed.

Ricordi is a work in progress; features and interface details may change as development continues.

## Tech Stack

- **Language:** Java
- **Backend:** Spring Boot, Spring Data JPA
- **Frontend:** Thymeleaf, HTML, CSS, JavaScript
- **Database:** PostgreSQL
- **Testing:** JUnit and H2 for tests
- **Build:** Maven / Maven Wrapper

## Requirements

- Java 21
- PostgreSQL
- Git

Use the Maven Wrapper included in the repository where available, so you do not need to install Maven separately.

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Harshadha-S/Ricordi.git
cd Ricordi
```

### 2. Create the PostgreSQL database

Create a local PostgreSQL database named `ricordi` (or use the database name configured for your environment).

For example, from `psql`:

```sql
CREATE DATABASE ricordi;
```

### 3. Configure database credentials

Ricordi is intended to read the database password from an environment variable rather than storing a real password in source code.

Set the values for your local environment. In PowerShell:

```powershell
$env:DB_PASSWORD = "your_local_database_password"
```

If your configuration defines additional database settings as environment variables, set those too. Check `src/main/resources/application.properties` for the exact property names and defaults used by the current version.

**Never commit your real database password, `.env` files, API keys, tokens, or other credentials.** Keep local secrets out of Git and use environment variables or an appropriate secret manager.

### 4. Run the application

On Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

On macOS/Linux:

```bash
./mvnw spring-boot:run
```

Open the local address printed by Spring Boot, typically:

```text
http://localhost:8080
```

### 5. Run tests

On Windows:

```powershell
.\mvnw.cmd test
```

On macOS/Linux:

```bash
./mvnw test
```

Tests may use the H2 in-memory database so that they can run without using your personal PostgreSQL data.

## Project Structure

The main application code and resources are under `src/main/`. In a typical Spring Boot layout:

```text
Ricordi/
├── src/
│   ├── main/
│   │   ├── java/                 # Java application code
│   │   └── resources/
│   │       ├── static/           # CSS, JavaScript, and image assets
│   │       ├── templates/        # Thymeleaf templates
│   │       └── application.properties
│   └── test/                     # Automated tests
├── mvnw
├── mvnw.cmd
├── pom.xml
└── README.md
```

The exact package and resource layout may evolve as the project grows.

## Privacy and Local Data

Journal entries and personal photographs can be sensitive. Keep private data out of source control. Ricordi's local upload directory should remain excluded from Git, and real credentials should be supplied through environment variables rather than committed configuration.

Before pushing changes, review the staged files:

```bash
git status
git diff --cached
```

You can also inspect tracked files for accidental uploads or configuration files before committing.

## Roadmap

Planned and evolving areas include:

- Refining the scrapbook and page-turn experience
- Improving photo and caption workflows
- Expanding date-based memory browsing
- Completing an interactive decoration/sticker experience
- Continuing to improve usability, reliability, and test coverage

## Contributing

This is an actively developed personal project. Suggestions, bug reports, and thoughtful feedback are welcome.

When contributing, please avoid committing personal journal content, uploaded photographs, database files, credentials, or local environment configuration.

## License

No license has been specified yet. Unless a license is added to this repository, all rights remain with the copyright holder and reuse should not be assumed to be permitted.

---

Built with care for the memories worth keeping.
