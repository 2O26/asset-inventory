describe('Settings Page Tests', () => {
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
        it('Verify that the number of left side asset lists is one in Dashboard, as specified in the settings.', () => {
            cy.contains('Dashboard Settings').click()
            cy.contains('h3', 'Left Side').parent().contains('Asset List').next('input').clear().type('1');
            cy.get('.standard-button').contains('Save').click();
            cy.contains('Dashboard').click();
            cy.get('.container-75-50').find('h3.item-header-ds:contains("Asset List")').should('exist');
        });

        it('Verify that the number of left side asset lists is zero in Dashboard, as specified in the settings.', () => {
            cy.contains('Dashboard Settings').click();
            cy.contains('h3', 'Left Side').parent().contains('Asset List').next('input').clear().type('0');
            cy.get('.standard-button').contains('Save').click();
            cy.contains('Dashboard').click();
            cy.get('.container-75-50').find('h3.item-header-ds:contains("Asset List"):last').should('not.exist');
        });

        it('Verify that the number of left side Graph Views is zero in Dashboard, as specified in the settings.', () => {
            cy.contains('Dashboard Settings').click();
            cy.contains('h3', 'Left Side').parent().contains('Graph View').next('input').clear().type('0');
            cy.get('.standard-button').contains('Save').click();
            cy.contains('Dashboard').click();
            cy.get('.container-75-50').find('h3.item-header-ds:contains("Graph View"):last').should('not.exist');
        });

        it('Verify that the number of left side Graph Views is one in Dashboard, as specified in the settings.', () => {
            cy.contains('Dashboard Settings').click()
            cy.contains('h3', 'Left Side').parent().contains('Graph View').next('input').clear().type('1');
            cy.get('.standard-button').contains('Save').click();
            cy.contains('Dashboard').click();
            cy.get('.container-75-50').find('h3.item-header-ds:contains("Graph View")').should('exist');
        });

        it('Verify that the number of right side asset lists is zero in Dashboard, as specified in the settings.', () => {
            cy.contains('Dashboard Settings').click()
            cy.contains('h3', 'Right Side').parent().contains('Asset List').next('input').clear().type('0');
            cy.get('.standard-button').contains('Save').click();
            cy.contains('Dashboard').click();
            cy.get('.container-25-50').find('h3.item-header-ds:contains("Asset List")').should('not.exist');
        });

        it('Verify that the number of right side asset lists is one in Dashboard, as specified in the settings.', () => {
            cy.contains('Dashboard Settings').click();
            cy.contains('h3', 'Right Side').parent().contains('Asset List').next('input').clear().type('1');
            cy.get('.standard-button').contains('Save').click();
            cy.contains('Dashboard').click();
            cy.get('.container-25-50').find('h3.item-header-ds:contains("Asset List"):last').should('exist');
        });

        it('Verify that the number of right side Graph Views is one in Dashboard, as specified in the settings.', () => {
            cy.contains('Dashboard Settings').click();
            cy.contains('h3', 'Right Side').parent().contains('Graph View').next('input').clear().type('1');
            cy.get('.standard-button').contains('Save').click();
            cy.contains('Dashboard').click();
            cy.get('.container-25-50').find('h3.item-header-ds:contains("Graph View"):last').should('exist');
        });

        it('Verify that the number of right side Graph Views is zero in Dashboard, as specified in the settings.', () => {
            cy.contains('Dashboard Settings').click()
            cy.contains('h3', 'Right Side').parent().contains('Graph View').next('input').clear().type('0');
            cy.get('.standard-button').contains('Save').click();
            cy.contains('Dashboard').click();
            cy.get('.container-25-50').find('h3.item-header-ds:contains("Graph View")').should('not.exist');
        });
    })

    describe('Check if Network Scan Settings are functional.', () => {
        it('Verify the added IP range has been successfully added to the network scan section.', () => {
            cy.contains('Network Scan Settings').click()
            cy.get('.standard-button').contains(' Add IP range').click()
            cy.get('input[name="IPrangeInput"]').clear().type('192.168.1.0/24');
            cy.get('button[type="submit"]').contains('Add IP range').click();
            cy.contains('Tools').click();
            cy.contains(' Network Scanner').click();
            cy.get('input[type="checkbox"][name="rangetype"][value="192.168.1.0/24"]').should('exist')
            cy.contains('Settings').click();
            cy.contains('Network Scan Settings').click()
            cy.on('window:confirm', () => true);
            cy.contains('.span-text', '192.168.1.0/24').siblings('button[aria-label="Remove"]').click();
        });
    });

    describe('Check if Recurring Scan Settings are functional.', () => {
        it.only('Check if the recurring scan job has been added correctly.', () => {
            cy.contains('Network Scan Settings').click()
            cy.get('.standard-button').contains(' Add IP range').click()
            cy.get('input[name="IPrangeInput"]').clear().type('192.168.1.0/24');
            cy.get('button[type="submit"]').contains('Add IP range').click();
            cy.contains('Recurring Scan Settings').click()
            cy.get('.standard-button').contains(' Add Scan Job').click()
            cy.get('input[name="RecurringScanTime"]').clear().type('0 0 * * 1');
            cy.get('.select-container').first().select('192.168.1.0/24')
            cy.get('.standard-button').contains(' Add Job ').click()
            cy.get('.list-container .span-text:contains("0 0 * * 1")').should('exist');
            cy.on('window:confirm', () => true);
            cy.contains('li', '0 0 * * 1 192.168.1.0/24').within(() => { cy.get('button[aria-label="Remove"]').click(); });
            cy.contains('.span-text', '192.168.1.0/24').siblings('button[aria-label="Remove"]').click();
        });
    })

    describe('Check if CVE Scan Settings are functional.', () => { })

});

