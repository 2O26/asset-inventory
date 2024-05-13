describe('Settings Page Tests', () => {
    let ipRange = "127.0.0.1/32"

    const cveSettings = {
        apiToken: 'testToken123',
        username: 'testUser',
        apiKey: 'testApiKey'
    };

    const trelloSettings = {
        apiKey: 'testApiKey',
        token: 'testToken',
        boardId: 'testBoardId'
    };


    beforeEach(() => { cy.login(); cy.contains('Settings').click(); });
    afterEach('logout', () => { cy.logout(); })

    describe('Check if settings page sections exist', () => {
        it('Check if Dashboard Settings exist', () => {
            cy.get('.center-flex-column').should('contain', 'Dashboard Settings')
        })

        it('Check if Network Scan Settings exist', () => {
            cy.get('.center-flex-column').should('contain', 'Network Scan Settings')
        })

        it('Check if Recurring Scan Settings exist', () => {
            cy.get('.center-flex-column').should('contain', 'Recurring Scan Settings')
        })

        it('Check if CVE Scan Settings exist', () => {
            cy.get('.center-flex-column').should('contain', 'CVE Scan Settings')
        })
    })

    describe('Check if Dashboard Settings functional', () => {
        it('Asset list + Graph View, as specified in the settings.', () => {
            cy.contains('Dashboard Settings').click()
            cy.contains('h3', 'Main').parent().contains('Asset List').next('input').clear().type('1');
            cy.contains('h3', 'Main').parent().contains('Graph View').next('input').clear();
            cy.contains('h3', 'Secondary').parent().contains('Asset List').next('input').clear();
            cy.contains('h3', 'Secondary').parent().contains('Graph View').next('input').clear().type('1');
            cy.get('.standard-button').contains('Save').click();
            cy.contains('Dashboard').click();
            cy.get('.dashboard-tool-container-75').find('h3.item-header-ds:contains("Asset List")').should('exist');
            cy.get('.dashboard-tool-container-25').find('h3.item-header-ds:contains("Graph View"):last').should('exist');
        });

        it('Graph View + Asset list, as specified in the settings.', () => {
            cy.contains('Dashboard Settings').click();
            cy.contains('h3', 'Main').parent().contains('Asset List').next('input').clear();
            cy.contains('h3', 'Main').parent().contains('Graph View').next('input').clear().type('1');
            cy.contains('h3', 'Secondary').parent().contains('Asset List').next('input').clear().type('1');
            cy.contains('h3', 'Secondary').parent().contains('Graph View').next('input').clear();
            cy.get('.standard-button').contains('Save').click();
            cy.contains('Dashboard').click();
            cy.get('.dashboard-tool-container-75').find('h3.item-header-ds:contains("Graph View")').should('exist');
            cy.get('.dashboard-tool-container-25').find('h3.item-header-ds:contains("Asset List"):last').should('exist');
        });

    })

    describe('Check if Network Scan Settings are functional.', () => {
        it('Verify the added IP range has been successfully added to the network scan section.', () => {
            cy.contains('Network Scan Settings').click()
            cy.get('.standard-button').contains(' Add IP range').click()
            cy.get('input[name="IPrangeInput"]').clear().type(ipRange);
            cy.get('button[type="submit"]').contains('Add IP range').click();
            cy.contains('Tools').click();
            cy.contains(' Network Scanner').click();
            cy.get(`input[type="checkbox"][name="rangetype"][value="${ipRange}"]`).should('exist')
            cy.contains('Settings').click();
            cy.contains('Network Scan Settings').click()
            cy.on('window:confirm', () => true);
            cy.contains('.span-text', ipRange).siblings('button[aria-label="Remove"]').click();
        });
    });

    describe('Check if Recurring Scan Settings are functional.', () => {
        it('Check if the recurring scan job has been added correctly.', () => {
            cy.contains('Network Scan Settings').click();
            cy.get('.standard-button').contains(' Add IP range').click();
            cy.get('input[name="IPrangeInput"]').clear().type(ipRange);
            cy.get('button[type="submit"]').contains('Add IP range').click();

            cy.contains('Recurring Scan Settings').click();
            cy.get('.standard-button').contains(' Add Scan Job').click();
            cy.get('input[name="RecurringScanTime"]').clear().type('0 0 * * 1');
            cy.contains('IP range to recurringly scan:').parent().find('select').as('ipRangeSelect');
            cy.get('@ipRangeSelect').should('be.visible').and('not.be.disabled');
            cy.get('@ipRangeSelect').find('option').each(($el) => {
                cy.log($el.text());
            });
            cy.get('@ipRangeSelect').select(ipRange).should('have.value', ipRange);
            cy.get('.standard-button').contains('Add Job').click();

            cy.get('.list-container .span-text:contains("Network Scan: 0 0 * * 1 ' + ipRange + '")').should('exist');
            cy.on('window:confirm', () => true);
            cy.contains('.span-text', 'Network Scan: 0 0 * * 1 ' + ipRange)
                .parent('li')
                .within(() => {
                    cy.get('button[aria-label="Remove"]').click();
                });

            cy.contains('.span-text', ipRange)
                .siblings('button[aria-label="Remove"]')
                .click();
        });
    });

    describe('Check if CVE Scan Settings are functional.', () => {
        it('Check if the CVE Scan Settings have no input errors.', () => {
            cy.contains('CVE Scan Settings').click();
            cy.get('.settings-container').should('be.visible');
            cy.get('input#username').clear().type(cveSettings.username);
            cy.get('input#OSSAPIKEY').clear().type(cveSettings.apiKey);
            cy.get('button').contains('Save').click();
            cy.wait(500);
            cy.get('p.successText').contains('Successfully updated API key').should('be.visible');
            cy.get('input#username').should('have.value', cveSettings.username);
            cy.get('input#OSSAPIKEY').should('have.value', cveSettings.apiKey);
            cy.wait(500);
            cy.get('button').contains('Check Connection').click();
            cy.wait(500);
            cy.get('p.successText').contains('Could not validate API key').should('be.visible');
            cy.wait(500);
            cy.get('input#username').clear();
            cy.get('input#OSSAPIKEY').clear();
            cy.get('button').contains('Save').click();
        });

        it('Check if the CVE Scan connection has no errors.', () => {
            cy.contains('CVE Scan Settings').click();
            cy.get('.settings-container').should('be.visible');
            cy.get('input#username').clear().type(cveSettings.username);
            cy.get('input#OSSAPIKEY').clear().type(cveSettings.apiKey);
            cy.get('button').contains('Save').click();
            cy.wait(500);
            cy.get('button').contains('Check Connection').click();
            cy.get('p.successText').contains('Could not validate API key').should('be.visible');
            cy.wait(500);
            cy.get('input#username').clear();
            cy.get('input#OSSAPIKEY').clear();
            cy.get('button').contains('Save').click();
        });

    });

    describe('Check if Issue Board Settings are functional.', () => {
        it('Check if the Trello Settings have no input errors.', () => {
            cy.contains('Issue Board Settings').click();
            cy.get('.settings-container').should('be.visible');
            cy.get('input#trelloApiKey').clear().type(trelloSettings.apiKey);
            cy.get('input#trelloToken').clear().type(trelloSettings.token);
            cy.get('input#trelloBoardId').clear().type(trelloSettings.boardId);
            cy.get('button.save-btn').contains('Save').click();
            cy.get('.success-message').contains('Trello settings updated successfully').should('be.visible');
            cy.get('input#trelloApiKey').should('have.value', trelloSettings.apiKey);
            cy.get('input#trelloToken').should('have.value', trelloSettings.token);
            cy.get('input#trelloBoardId').should('have.value', trelloSettings.boardId);
            cy.get('input#trelloApiKey').clear();
            cy.get('input#trelloToken').clear();
            cy.get('input#trelloBoardId').clear();
            cy.get('button.save-btn').contains('Save').click();
        });

        it('Check if the Trello connection has no errors.', () => {
            cy.contains('Issue Board Settings').click();
            cy.get('.settings-container').should('be.visible');
            cy.get('input#trelloApiKey').clear().type(trelloSettings.apiKey);
            cy.get('input#trelloToken').clear().type(trelloSettings.token);
            cy.get('input#trelloBoardId').clear().type(trelloSettings.boardId);
            cy.get('button.save-btn').contains('Save').click();
            cy.get('button.check-btn').contains('Check Connection').click();
            cy.get('button.check-btn').should('contain', 'Failed');
            cy.get('input#trelloApiKey').clear();
            cy.get('input#trelloToken').clear();
            cy.get('input#trelloBoardId').clear();
            cy.get('button.save-btn').contains('Save').click();
        });
    });
});

