describe('Asset List page tests', () => {
    const tmpAssetData = { name: "Test PC", crit: 4, type: "Desctop PC", owner: "John Doe" }
    beforeEach('visiting Asset List page', () => {
        cy.login();
        cy.contains('Tools').click()
        cy.contains('Asset List').click()
    })

    afterEach('logout', () => {
        cy.logout();
    })

    it('can not add asset without name', () => {
        cy.contains('Add Asset').click()
        cy.get('input.inputFields[name="asset-criticality"]').clear().type(tmpAssetData.crit)
        cy.get('input.inputFields[name="asset-type"]').type(tmpAssetData.type)
        cy.get('input.inputFields[name="asset-owner"]').clear().type(tmpAssetData.owner)
        cy.get('.AuthBtnContainer').find('button.standard-button').contains('Add').click();
        cy.get('.asset-form').should('be.visible')
        cy.get('.standard-button').contains('Cancel').click()

    })

    it('can not add asset without criticality', () => {
        cy.contains('Add Asset').click()
        cy.get('input.inputFields[name="asset-name"]').type(tmpAssetData.name)
        cy.get('input.inputFields[name="asset-criticality"]').clear()
        cy.get('input.inputFields[name="asset-type"]').type(tmpAssetData.type)
        cy.get('input.inputFields[name="asset-owner"]').clear().type(tmpAssetData.owner)
        cy.get('.AuthBtnContainer').find('button.standard-button').contains('Add').click();
        cy.get('.asset-form').should('be.visible')
        cy.get('.standard-button').contains('Cancel').click()

    })

    it('can not add asset without type', () => {
        cy.contains('Add Asset').click()
        cy.get('input.inputFields[name="asset-name"]').type(tmpAssetData.name)
        cy.get('input.inputFields[name="asset-criticality"]').clear().type(tmpAssetData.crit)
        cy.get('input.inputFields[name="asset-owner"]').clear().type(tmpAssetData.owner)
        cy.get('.AuthBtnContainer').find('button.standard-button').contains('Add').click();
        cy.get('.asset-form').should('be.visible')
        cy.get('.standard-button').contains('Cancel').click()

    })

    it('can not add asset without owner', () => {
        cy.contains('Add Asset').click()
        cy.get('input.inputFields[name="asset-name"]').type(tmpAssetData.name)
        cy.get('input.inputFields[name="asset-type"]').type(tmpAssetData.type)
        cy.get('input.inputFields[name="asset-criticality"]').clear().type(tmpAssetData.crit)
        cy.get('.AuthBtnContainer').find('button.standard-button').contains('Add').click();
        cy.get('.asset-form').should('be.visible')
        cy.get('.standard-button').contains('Cancel').click()
    })

    describe('when adding an asset', () => {
        beforeEach('adding asset', () => {
            cy.contains('Add Asset').click()
            cy.get('input.inputFields[name="asset-name"]').type(tmpAssetData.name)
            cy.get('input.inputFields[name="asset-criticality"]').clear().type(tmpAssetData.crit)
            cy.get('input.inputFields[name="asset-type"]').type(tmpAssetData.type)
            cy.get('input.inputFields[name="asset-owner"]').type(tmpAssetData.owner)
            cy.get('.AuthBtnContainer').find('button.standard-button').contains('Add').click();
        })

        afterEach('removing asset', () => {
            // Clean up here, Remove asset
            cy.get('.assetCell').contains(tmpAssetData.name).parents('.assetRow').find('input[type="checkbox"]').click();
            cy.get('.standard-button').contains('Remove Asset').click()
            cy.get('button').filter((index, element) => element.textContent.trim() === 'Remove').click();
        })

        it('form should disapear', () => {
            cy.get('.asset-form').should('not.exist')
        })
        it('can find asset in list', () => {
            cy.get('.asset-list-container').should('contain', tmpAssetData.name)
            cy.get('.asset-list-container').should('contain', tmpAssetData.crit)
            cy.get('.asset-list-container').should('contain', tmpAssetData.type)
            cy.get('.asset-list-container').should('contain', tmpAssetData.owner)
        })
    })
    describe('when searching with a long random string', () => {
        beforeEach('asset search with long random string', () => {
            cy.get('.SearchBar input').type('8c0dd0655ca3418578b51582deb38ab47a0137e2a592541bc1ef34ad2d80af32');
        });
        it('should not display any assets in the list', () => {
            cy.get('.asset-list-container').should('not.contain', 'Test PC');
            cy.get('.asset-list-container').should('not.contain', 'Another Asset');
        });
    });
    describe('searching for an asset "Test PC"', () => {
        beforeEach('asset search', () => {

            // Add the asset "Test PC"
            cy.contains('Add Asset').click();
            cy.get('input.inputFields[name="asset-name"]').type(tmpAssetData.name);
            cy.get('input.inputFields[name="asset-criticality"]').clear().type(tmpAssetData.crit);
            cy.get('input.inputFields[name="asset-type"]').type(tmpAssetData.type);
            cy.get('input.inputFields[name="asset-owner"]').type(tmpAssetData.owner);
            cy.get('.AuthBtnContainer').find('button.standard-button').contains('Add').click();

            // Search for "Test PC"
            cy.get('.SearchBar input').type('Test PC');
        });

        it('should only display the asset "Test PC"', () => {
            // Ensure that only "Test PC" is displayed in the list
            cy.get('.asset-list-container').should('contain', 'Test PC');
            cy.get('.asset-list-container').should('not.contain', 'Another Asset');
        });

        afterEach('removing the asset "Test PC"', () => { //Cleanup
            cy.get('.assetCell').contains(tmpAssetData.name).parents('.assetRow').find('input[type="checkbox"]').click();
            cy.get('.standard-button').contains('Remove Asset').click();
            cy.get('button').filter((index, element) => element.textContent.trim() === 'Remove').click();
        });
    });



})