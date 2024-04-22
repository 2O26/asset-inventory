# Documentation for configuration management and store
The configuration API endpoint handles the following configurations:
- Crono scan settings
- Settings for what IP ranges the application can scan
- Individual user dashboard settings

# Crono scan
The ability to scan an IP range recuringly is achieved through the crono scanner.

## API endpoints
The backend has three API calls that handles the functionality, namely:
- /getRecurring
- /addRecurring
- /removeRecurring

/getRecurring fetches the saved recurring scanning configuration, whereas /addRecurring and
/removeRecurring add and removes settings respectively.

## Accepted formats
At the time being only cron commands that are on the format "C C C C C" is supported. 
For instance:
- * * * * *
- 1 1 1 1 1
- * 1 3 * 1

## How the jobs are invoked
The cron jobs are invoked throgh a cron scheduler implemented through an external javascript library, namely "node-cron". The decision to use an external javascript library rather than the built in crontab was because:
- Easier implementation
- No need to dabble with the crontab and physical files on the host. Therefore, the application will survive a restart without loosing previous data (files created in docker container will get removed at restart).
- The scheduled job will only have the privileges that the runtime application has on the system. Hence, one can sandbox the deployed application to prevent, e.g, lateral movement within the system.

### Data flow
Each minute the runtime application sends a request to the database and asks for the planned recurring jobs. If the recurring job is right now, it will perform the scheduled task, if not it is ignored.

# IP range settings

# Inidividualized dashboard settings



Author: Marcus Kicklighter
