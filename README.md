# Ricordi

Ricordi is a digital scrapbook and memory journal, built with Java 21, Spring
Boot, Thymeleaf, Spring Data JPA, Spring Security, and PostgreSQL.

The visual direction is a keepsake scrapbook rather than a generic dashboard:
layered paper, taped photographs, handwritten notes, and elegant vintage
details. Its palette is:

| Color | Hex |
| --- | --- |
| Burgundy | `#6C0820` |
| Cherry blossom pink | `#F2AEBC` |
| Misty rose | `#F2DCDB` |
| Silver lake blue | `#5A86CB` |
| Lapis lazuli | `#3D5D91` |

## Requirements

- Java 21
- Maven 3.9 or newer
- PostgreSQL for persistent local data (optional for the initial scaffold)

## Run locally

From the project root, run:

```bash
mvn clean install
mvn spring-boot:run
```

The app is available at <http://localhost:8080>. Until PostgreSQL is configured,
the application uses an in-memory H2 database so it can start without an
external database. H2 data is temporary and is lost when the app stops.

To use PostgreSQL, create a database named `ricordi` and set these environment
variables before starting the app:

```text
DB_URL=jdbc:postgresql://localhost:5432/ricordi
DB_USERNAME=your_local_database_user
DB_PASSWORD=your_local_database_password
```

For example, in PowerShell:

```powershell
$env:DB_URL = "jdbc:postgresql://localhost:5432/ricordi"
$env:DB_USERNAME = "your_local_database_user"
$env:DB_PASSWORD = "your_local_database_password"
mvn spring-boot:run
```

The initial security setup uses Spring Security's generated development
password, printed in the application startup log. Registration, account
persistence, and the scrapbook workflows are not implemented yet.

## Project layout

- `src/main/java/com/ricordi` — application, security, web, domain, data,
  service, and exception-handling classes
- `src/main/resources/templates` — Thymeleaf pages and reusable fragments
- `src/main/resources/static` — CSS, JavaScript, images, and local uploads
- `src/test/java/com/ricordi` — Spring Boot test foundation

