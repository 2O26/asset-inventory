describe('Issue Board Tab Test', () => {
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

  describe('Issue Board Tab Functionality', () => {
    it('Check if Issue Board tab exists', () => {
      cy.get('button.tab-button').contains('Issue Board').click();
    });
  });
});