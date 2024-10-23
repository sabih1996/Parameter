# Parameter Service

This project creates a Parameter Service using NestJS(Node.js framework in TypeScript) and gRPC. It's designed to manage and control access to various parameters or settings in a system.

## Key Features

Here's what it does:

1. Authentication: Before allowing any actions, it checks if the user has the right to access the service. This is done using a special code (JWT token) that proves the user's identity.

2. Parameter Management: Once authenticated, users can do several things with parameters:

- Get (retrieve) parameter values

- Create new parameters

- Change (update) existing parameters

- Remove (delete) parameters

- List available parameters

3. Organization-based Access: The service keeps parameters separate for different organizations. This means one company can't see or change another company's parameters.

4. Efficient Communication: It uses gRPC, which is a fast way for different parts of a system to talk to each other. This makes the service quick and reliable.

5. Flexible Parameter Lookup: If it can't find an exact parameter, it tries to find a more general one that might work instead.

In simple terms, it's like a secure, organized drawer system for storing and managing important settings or information for different companies. Each company has its own set of drawers, and only people with the right key (authentication) can access and manage what's in those drawers.

## Prerequisites

- Node.js (version 20.0.0 or higher)
- npm (comes with Node.js)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/sabih1996/parameter.git
cd parameter
```

2. Install dependencies:

```bash
npm run install
```

3. Update your environment variables value according making `.env` file in root directory and copr `.env.example` variable in it and replace with your values

## Database Setup and Migrations

1. Set the `DATABASE_URL` environment variable in your `.env` file:


You can use tools like [Dbvear)](https://dbeaver.io/) or [Supabase](https://supabase.com/) to create PostgreSQL Db and replace your .

```bash
DATABASE_URL=postgres://username:password@hostname:port/database_name
```

### Running Migrations

Migrations are automatically run when the application starts. The `DatabaseModule` checks for any pending migrations and applies them.

To manually create and run migrations:

1. Generate a new migration:
```bash
npm run typeorm migration:generate -- -n MigrationName
```

This will create a new migration file in the src/migrations directory.
2. Run migrations:

```bash
npm run typeorm migration:run
```

3. Revert the last migration:

```bash
npm run typeorm migration:revert
```

### Important Notes
- The synchronize option is set to false in production to prevent automatic schema changes.

- Migrations are stored in the dist/**/migrations/*.{ts,js} directory.

- The application uses a SnakeNamingStrategy for database column naming.

- In development mode, SQL queries are logged to the console.

### Troubleshooting Database Issues
- If you encounter the error "Outstanding database migrations", it means there are pending migrations. Run the migration command to apply them.

- Ensure your PostgreSQL server is running and accessible from your application environment.

- Check that the DATABASE_URL is correctly formatted and contains valid credentials.

## Scripts

This project uses npm scripts for various tasks:

- `npm run build`: Build the NestJS application
- `npm start`: Start the application
- `npm run start:dev`: Start the application in watch mode for development
- `npm run start:debug`: Start the application in debug mode with watch enabled
- `npm run lint`: Run ESLint to check and fix code style issues
- `npm run generate-protos`: Generate TypeScript code from Protocol Buffer definitions
- `npm run prebuild`: Clean the dist folder and generate protos before building
- `npm test`: Run Jest tests
- `npm run test:watch`: Run Jest tests in watch mode
- `npm run test:debug`: Run Jest tests in debug mode
- `npm run test:e2e`: Run end-to-end tests
- `npm run format`: Format code using Prettier

## Building and Running the Project

1. Generate Protocol Buffer code:

```bash
npm run generate-protos
```

2. Build the project:

```bash
npm run build
```

For development, you can use:

```bash
npm run start:dev
```

## Testing gRPC Methods with Postman

Postman supports testing gRPC services. Here's how you can use Postman to interact with the Parameter Service:

### Setting up Postman for gRPC

1. Open Postman and create a new request.
2. Change the request type from HTTP to gRPC (you may need to update Postman if you don't see this option).
3. Enter your server's address (e.g., `localhost:5000` if running locally).

### Importing the Proto File

1. In Postman, click on "Import" in the top left corner.
2. Select the `parameters.proto` file from your project.
3. Postman will parse the proto file and generate a list of available methods.

### Authenticating Requests

Since the service uses `AuthGuard`, you'll need to include authentication:

1. In Postman, go to the "Authorization" tab.
2. Select "Bearer Token" as the auth type.
3. Enter your JWT token in the "Token" field.

### Calling gRPC Methods

For each method (retrieve, create, update, delete, list):

1. Select the method from the dropdown in Postman.
2. In the "Message" tab, you'll see the structure of the request message.
3. Fill in the required fields with your test data.
4. Click "Invoke" to send the request.
### Example: Retrieving a Parameter

1. Select the "retrieve" method.
2. In the "Message" tab, you'll see something like:
 ```json
   {
     "paths": []
   }
   ```
3. Fill in the paths array with the parameter paths you want to retrieve:
```json
{
  "paths": ["/path/to/parameter"]
}
```
4. Click "Invoke" to send the request.
## Run Test Cases

- Run postgres container on docker with the following commands in order to run test cases:

```bash
docker pull postgres:15

docker run --name my-postgres -e POSTGRES_USER=myuser -e POSTGRES_PASSWORD=mypassword -e POSTGRES_DB=mydb -p 5432:5432 -d postgres:15
```

- --name my-postgres: Assigns the name "my-postgres" to the container.
- -e POSTGRES_USER=myuser: Sets the username for the PostgreSQL database.
- -e POSTGRES_PASSWORD=mypassword: Sets the password for the PostgreSQL user.
- -e POSTGRES_DB=mydb: Creates a new database with the name mydb.
- -p 5432:5432: Maps port 5432 of the container to port 5432 on the host machine.
- -d postgres:15: Runs PostgreSQL version 15 in detached mode.

Run unit tests:

```bash
npm run test:watch
```

Run test cases of specific file run this command:

```bash
npm run tets:watch -p full_spec_file_name
```

## Project Structure

```graphql
src
├── modules
│   ├── authentication     # Auth-related logic (e.g., JWT)
│   │   ├── jwt-auth.guard.ts
│   └── parameter          # Parameter module (handles business logic for parameters)
│       ├── parameter.controller.ts   # Handles gRPC methods
│       ├── parameter.module.ts       # Module definition for dependency injection
│       ├── parameter.service.ts      # Business logic and services
│       ├── tests/data.ts                    # Unit tests mock data
├── common
│   ├── helper             # Utility functions shared across modules
│   ├── interfaces         # Global interfaces and types
├── db
│   ├── entities           # Database models/entities
│   ├── migrations         # Database migrations
│   ├── db.module.ts       # Database module that integrates ORM (e.g., TypeORM)
├── proto
│   ├── parameters.proto    # Protobuf files for gRPC or messaging
├── shared
│   ├── logger             # Logging services used across the app
│   ├── modules            # Shared modules (e.g., for utilities used globally)
│   │   ├── shared.module.ts
├── test                   # End-to-end and environment testing setup
│   ├── environment        # Configuration for test environments
│   ├── constants          # Test constants
├── app.module.ts          # Main app module, pulls together all modules
├── main.ts                # Main entry point for NestJS application
```

## API Documentation

- The gRPC service methods are defined in `src/proto/parameters.proto`. 
- To explore available methods and message types, refer to this file or generate API documentation using a tool like protoc-gen-doc.

## Troubleshooting

- If you encounter database connection issues, ensure your Postgres container is running and the connection details in your .env file are correct.

- For gRPC-related errors, check that the proto files are correctly generated and the server is running.

- If you face dependency issues, try deleting the node_modules folder and running npm install again.
