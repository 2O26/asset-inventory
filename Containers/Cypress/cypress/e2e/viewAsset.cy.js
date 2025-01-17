describe('View asset page tests', () => {
    const tmpAssetData = {
      name: "Test Asset",
      crit: 4,
      type: "laptop",
      owner: "Jack Sparrow"
    };
  
    beforeEach('visiting Asset List page', () => {
      cy.login();
      cy.contains('Tools').click();
      cy.contains('Asset List').click();
      cy.contains('Add Asset').click();
      cy.get('input.inputFields[name="asset-name"]').type(tmpAssetData.name);
      cy.get('input.inputFields[name="asset-criticality"]').clear().type(tmpAssetData.crit);
      cy.get('input.inputFields[name="asset-type"]').type(tmpAssetData.type);
      cy.get('input.inputFields[name="asset-owner"]').type(tmpAssetData.owner);
      cy.get('.AuthBtnContainer').find('button.standard-button').contains('Add').click();
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

    for (let i = 0; i < 1; i++) {
        describe(`when viewing asset ${i}`, () => {
            let tmpName = ""
            let tmpOwner = ""
            let tmpCreated = ""
            let tmpEdited = ""
            let tmpCrit = ""
            beforeEach('clicking asset in list and saving info', () => {
                cy.get('.assetRow').eq(i)
                    .then((row) => {
                        tmpName = row.find('.assetCell').eq(1).text();
                        tmpOwner = row.find('.assetCell').eq(2).text();
                        tmpCreated = row.find('.assetCell').eq(4).text();
                        tmpEdited = row.find('.assetCell').eq(5).text();
                        tmpCrit = row.find('.assetCell').eq(6).text();
                    }).click();
            })

            it('can verify asset name', () => {
                cy.get('h1.asset-name').should('contain.text', tmpName);
            })

            it('can verify asset Owner', () => {
                cy.get('.assetItem').contains('Owner').should('contain', tmpOwner);
            })

            it('can verify asset Creation Date', () => {
                cy.get('.assetItem').contains('Created at').should('contain', tmpCreated);
            })

            it('can verify asset Updated Date', () => {
                cy.get('.assetItem').contains('Updated at').should('contain', tmpEdited);
            })

            it('can verify asset criticality', () => {
                cy.get('.assetItem').contains('Criticality').should('contain', tmpCrit);
            })

        })
    }
})
