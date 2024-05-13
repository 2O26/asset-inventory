describe('Docs Tab Test', () => {
  const tmpAssetData = {
    name: "Test Asset",
    crit: 4,
    type: "laptop",
    owner: "Jack Sparrow"
  };

  beforeEach('visiting Asset List page and creating asset', () => {
    cy.login();
    cy.contains('Tools').click();
    cy.contains('Asset List').click();
    cy.contains('Add Asset').click();
    cy.get('input.inputFields[name="asset-name"]').type(tmpAssetData.name);
    cy.get('input.inputFields[name="asset-criticality"]').clear().type(tmpAssetData.crit);
    cy.get('input.inputFields[name="asset-type"]').type(tmpAssetData.type);
    cy.get('input.inputFields[name="asset-owner"]').type(tmpAssetData.owner);
    cy.get('.AuthBtnContainer').find('button.standard-button').contains('Add').click();
    cy.get('.assetCell').contains(tmpAssetData.name).parents('.assetRow').click();
  });

  afterEach('removing asset and logout', () => {
    cy.contains('Tools').click();
    cy.contains('Asset List').click();

    const clickCheckboxUntilChecked = (maxAttempts, attempts = 0) => {
      attempts++;
      cy.get('.assetCell').contains(tmpAssetData.name).parents('.assetRow').find('input[type="checkbox"]').click().then($checkbox => {
        const isChecked = $checkbox.is(':checked');
        if (!isChecked && attempts < maxAttempts) {
          cy.wait(500);
          clickCheckboxUntilChecked(maxAttempts, attempts);
        }
      });
    };
    clickCheckboxUntilChecked(5); 
    
    cy.get('.assetCell').contains(tmpAssetData.name).parents('.assetRow').find('input[type="checkbox"]').should('be.checked');
    cy.get('div').contains('Remove Asset').then($button => {
      if ($button.length) {
        $button.click();
        cy.get('div[role="dialog"][aria-label="Remove Asset"]', { timeout: 10000 }).should('be.visible').within(() => {
          cy.get('button.standard-button').contains('Remove').click();
        });
      }
    });

    cy.logout();
  });

  describe('Docs Tab Functionality', () => {
    it('Check if Docs tab exists', () => {
        cy.get('button.tab-button').contains('Docs').click();
    });

    it('Check if an input field exists', () => {
        cy.get('input.inputFields').should('exist');
    });

    it('Type text into input field, click update, and receive success alert', () => {
        const testLink = 'https://example.com';
        cy.get('input.inputFields').type(testLink);
        cy.get('button.standard-button').contains('Set Link').click();
        cy.on('window:alert', (alertText) => {
            expect(alertText).to.equal('Successfully updated doc link');
        });
    });

    it('Check if "Open Link" button opens the link in a new tab', () => {
        const testLink = 'https://example.com';
        cy.get('input.inputFields').type(testLink);
        cy.get('button.standard-button').contains('Set Link').click();
        cy.get('button.standard-button').contains('Open Link').click();
        cy.url().should('eq', testLink);
    });

    it('Check if "Remove Link" button removes the link', () => {
        const testLink = 'https://example.com';
        cy.get('input.inputFields').type(testLink);
        cy.get('button.standard-button').contains('Set Link').click();
        cy.get('button.standard-button').contains('Remove Link').click();
        cy.on('window:alert', (alertText) => {
            expect(alertText).to.equal('Successfully updated doc link');
        });
        cy.get('div').contains('There is no connected documentation link to this asset');
    });
});

});