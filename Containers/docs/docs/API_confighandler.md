# Documentation for Configuration Management and Store

This documentation provides detailed insights into the configuration API endpoints that handle Crono scan settings, IP range configurations, and individual user dashboard settings. It outlines how these configurations are managed through various API endpoints.

## Crono Scan

The ability to scan an IP range recurrently is facilitated through the Crono scanner, which leverages cron jobs to schedule scans.

### API Endpoints

The backend manages Crono scan settings through three primary API calls:

- `/getRecurring`: Fetches saved recurring scanning configurations.
- `/addRecurring`: Adds new recurring scanning settings.
- `/removeRecurring`: Removes existing recurring scanning settings.

### Accepted Formats

Currently, only cron command formats matching "C C C C C" are supported. Examples include:
- `* * * * *` (runs every minute)
- `1 1 1 1 1` (runs at one minute past one on January 1st if it's a Monday)
- `* 1 3 * 1` (runs every minute of the third day of the month if it's a Monday)

### How Jobs Are Invoked

Cron jobs are managed using the `node-cron` library for several reasons:
- **Ease of Implementation:** Integrates directly with Node.js applications without the need to manage crontab entries.
- **Persistence:** Unlike traditional crontab, which may lose entries if not properly backed up during system restarts, `node-cron` maintains schedule configurations within the application codebase.
- **Security:** Scheduled jobs run with the same privileges as the application, limiting the scope of potential system-level exploits.

### Data Flow

The cron scheduler activates every minute to query the database for scheduled tasks:
- If a scheduled task is due, it executes the task immediately.
- If no tasks are due, the request is ignored, minimizing unnecessary computations and database interactions.

## IP Range Settings

The application restricts and manages network scans based on configurable IP ranges. 

### API Endpoints

- `/getIPranges`: Returns a list of authorized IP ranges for the user, filtering based on user roles.
- `/addIPranges`: Allows administrators to add new IP ranges to the scan list.
- `/removeIPrange`: Enables administrators to remove existing IP ranges from the list.

### Authentication and Authorization

Access to these endpoints is secured through token-based authentication, with role checks to ensure that only authorized users (typically administrators) can alter IP range settings.

## Individualized Dashboard Settings

Each user can customize their dashboard settings, which include preferences for visual components and themes.

### API Endpoints

- `/getUserConfigurations`: Retrieves the current configuration settings for the user.
- `/UpdateUserConfig`: Updates the user's configuration settings based on provided inputs.

### Data Handling

- If a user's configuration does not exist, default settings are provided.
- Changes made by the user are immediately updated in the database to ensure consistency across sessions.

## Technical Considerations

- **Security:** All API endpoints require authentication, and sensitive actions are further protected by role-based authorization.
- **Data Integrity:** Use of MongoDB through Mongoose for robust data handling and validation.
- **Error Handling:** Comprehensive error logging and management to ensure system reliability and ease of debugging.

