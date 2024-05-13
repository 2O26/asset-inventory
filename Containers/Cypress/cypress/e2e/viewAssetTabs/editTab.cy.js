describe('Edit Tab Test', () => {
  const tmpAssetData = {
    name: "Test Asset",
    crit: 4,
    type: "laptop",
    owner: "Jack Sparrow"
  };

  const tmpAssetData2 = {
    name: "Test Asset 2",
    crit: 1,
    type: "Pc",
    owner: "Jack Parrott",
    ip: "10.10.10.10"
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

  describe('Edit Tab Functionality', () => {
    it('Check if Edit tab exists', () => {
      cy.get('button.tab-button').contains('Edit').click();
    });

    it('Verify Editing asset is working as should', () => {
      cy.get('button.tab-button').contains('Edit').click();
      cy.get('input#Name').clear().type(tmpAssetData2.name);
      cy.get('input#Owner').clear().type(tmpAssetData2.owner);
      cy.get('input#Type').clear().type(tmpAssetData2.type);
      cy.get('input#Criticality').clear();
      cy.get('input#IP').clear().type(tmpAssetData2.ip);
      cy.wait(500);
      cy.get('button.standard-button').contains('Save').click();
      cy.wait(1000);
      cy.get('button.tab-button').contains('Edit').click();
      cy.get('input#Name').should('have.value', tmpAssetData2.name);
      cy.get('input#Owner').should('have.value', tmpAssetData2.owner);
      cy.get('input#Type').should('have.value', tmpAssetData2.type);
      cy.get('input#Criticality').should('have.value', tmpAssetData2.crit.toString());
      cy.get('input#IP').should('have.value', tmpAssetData2.ip);
    });

  });
});