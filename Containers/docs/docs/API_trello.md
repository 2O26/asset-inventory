# Issue Board: Trello API Integration

The Asset Inventory application integrates with the Trello API to provide a comprehensive issue tracking and management system for assets. This document outlines the configuration process and functionality of the Trello API integration, which is accessible through the "Issue Board Settings" section of the application.

## Overview

The Trello API integration allows users to create, update, and manage Trello boards, lists, and cards associated with assets within the Asset Inventory. By leveraging the powerful capabilities of Trello, users can track and organize tasks, issues, and other relevant information related to their assets in a familiar and user-friendly interface.

The integration is seamlessly integrated into the application's workflow, enabling users to streamline their asset management processes and collaborate more effectively with team members.

## Configuration

To enable the Trello API integration, you need to provide the following credentials in the application's "Issue Board Settings" section:

1. **Trello API Key**: A unique API key obtained from the Trello developer console. This key is used to authenticate requests to the Trello API.

2. **Trello Token**: A personal access token generated from the Trello developer console. This token grants specific permissions to access and modify Trello data.

3. **Trello Board ID**: The ID of the Trello board associated with the Asset Inventory application. All lists and cards related to the assets will be created and managed within this board.

## Functionality

The Trello API integration provides the following functionality:

### Board Management

The application automatically creates and manages a dedicated Trello board for the Asset Inventory. The board ID must be provided in the application settings.

### List Management

For each asset in the Asset Inventory, the application can create and manage a corresponding list on the Trello board. This list serves as a container for cards representing various aspects or tasks related to the asset.

### Card Management

Within each asset's list, the application allows you to create, update, and delete cards. These cards can represent specific tasks, issues, or any other relevant information associated with the asset.

#### Creating a Card

To create a new card for an asset, simply provide a title and (optionally) a description for the card. The application will handle the creation process and add the card to the appropriate list on the Trello board.

#### Updating a Card

Existing cards can be updated with new titles and descriptions. The application provides an interface to modify these card details and synchronize the changes with the Trello board.

#### Deleting a Card

If a card is no longer needed, it can be deleted from the asset's list on the Trello board using the provided interface.

### Connection Testing

The application includes a "Check Connection" button that allows you to verify the connectivity with the Trello API using the provided credentials. This feature helps ensure that the Trello integration is properly configured and functioning correctly.

## Implementation Details

The Trello API integration is implemented using the following technologies:

- **React**: The user interface is built with React, a popular JavaScript library for building user interfaces.
- **Tanstack React Query**: This library is used for efficient and declarative data fetching and caching, providing a seamless integration with the Trello API.
- **Axios**: A promise-based HTTP client used for making API requests to the Trello API.

The core logic for interacting with the Trello API is encapsulated within the `TrelloSettings` component, which handles the state management, API calls, and user interface rendering.

For more detailed information on the implementation, please refer to the `TrelloSettings.jsx` file in the codebase.