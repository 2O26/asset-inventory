describe('History Tab Test', () => {
  const tmpAssetData = { name: "Test Asset", crit: 4, type: "laptop", owner: "Jack Sparrow" };

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

    describe('History Tab Functionality', () => {
      it('Check if History tab exists', () => {
          cy.get('button.tab-button').contains('History').click();
      });

      it('Verify asset details in History tab', () => {
  
      cy.get('button.tab-button').contains('Edit').click();
      cy.get('div.asset-info-container h1').invoke('text').then((editTabAssetId) => {
        const normalizedEditId = editTabAssetId.replace(/^0+/, '').replace(/[^0-9]/g, '').trim(); 
        console.log(`Normalized Edit Tab ID: '${normalizedEditId}'`); 
  
        cy.get('button.tab-button').contains('History').click();
        cy.get('div.history-content span').invoke('text').then((historyTabAssetId) => {
          const normalizedHistoryId = historyTabAssetId.replace(/^0+/, '').replace(/[^0-9]/g, '').trim(); 
          console.log(`Normalized History Tab ID: '${normalizedHistoryId}'`); 

          expect(normalizedEditId).to.eq(normalizedHistoryId, 'Asset IDs should match between Edit and History tabs');
        });
      });
    });
  });
  
  







})
