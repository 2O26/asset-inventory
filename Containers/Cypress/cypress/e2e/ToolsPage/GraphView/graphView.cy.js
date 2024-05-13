describe('Graph View page tests', () => {
    const tmpAssetData = { name: "Test Asset", crit: 4, type: "laptop", owner: "Jack Sparrow" };

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
        cy.contains('Tools').click()
        cy.contains('Graph View').click()
    })
    
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

    it('Can verify URL', () => {
        cy.url().should('include', "tools/graph-view")
    })

    it('Can see react flow panel', () => {
        cy.get('.react-flow').should('exist')
    })
    it('Can see react flow controls', () => {
        cy.get('.react-flow__controls ').should('exist')
    })
    it('Can see react flow minimap', () => {
        cy.get('.react-flow__minimap').should('exist')
    })

    describe('when clicking node', () => {
        let assetName = ""
        beforeEach('clicking node', () => {
            cy.get(".react-flow__node.react-flow__node-turbo.nopan.selectable > .wrapper.gradient > .inner").eq(0).then(assetNode => {
                assetName = assetNode.find(".title").text()
            }).click()
        })
        it('can assert URL name', () => {
            cy.url().should('include', "/asset-view/")
        })

        it('can assert asset name', () => {
            cy.get('h1.asset-name').should('contain.text', assetName);
        })
    })
})