describe('Asset List page tests', () => {
    const tmpAssetData = { id: "ID_12345", name: "Test PC", crit: 4, type: "Desctop PC" }
    beforeEach('visiting Asset List page', () => {
        cy.visit(Cypress.env('baseUrl'))
        cy.contains('Tools').click()
        cy.contains('Asset List').click()
    })

    it('can not add asset without id', () => {
        cy.contains('Add Asset').click()
        cy.get('input.inputFields[name="asset-name"]').type(tmpAssetData.name)
        cy.get('input.inputFields[name="asset-criticality"]').clear().type(tmpAssetData.crit)
        cy.get('input.inputFields[name="asset-type"]').type(tmpAssetData.type)
        cy.get('.AuthBtnContainer').find('button.standard-button').contains('Add').click();
        cy.get('.asset-form').should('be.visible')
    })


    it('can not add asset without name', () => {
        cy.contains('Add Asset').click()
        cy.get('input.inputFields[name="asset-id"]').type(tmpAssetData.id)
        cy.get('input.inputFields[name="asset-criticality"]').clear().type(tmpAssetData.crit)
        cy.get('input.inputFields[name="asset-type"]').type(tmpAssetData.type)
        cy.get('.AuthBtnContainer').find('button.standard-button').contains('Add').click();
        cy.get('.asset-form').should('be.visible')
    })

    it('can not add asset without criticality', () => {
        cy.contains('Add Asset').click()
        cy.get('input.inputFields[name="asset-id"]').type(tmpAssetData.id)
        cy.get('input.inputFields[name="asset-name"]').type(tmpAssetData.name)
        cy.get('input.inputFields[name="asset-criticality"]').clear()
        cy.get('input.inputFields[name="asset-type"]').type(tmpAssetData.type)
        cy.get('.AuthBtnContainer').find('button.standard-button').contains('Add').click();
        cy.get('.asset-form').should('be.visible')
    })

    it('can not add asset without type', () => {
        cy.contains('Add Asset').click()
        cy.get('input.inputFields[name="asset-id"]').type(tmpAssetData.id)
        cy.get('input.inputFields[name="asset-name"]').type(tmpAssetData.name)
        cy.get('input.inputFields[name="asset-criticality"]').clear().type(tmpAssetData.crit)
        cy.get('.AuthBtnContainer').find('button.standard-button').contains('Add').click();
        cy.get('.asset-form').should('be.visible')
    })

    describe('when adding an asset', () => {
        beforeEach('adding asset', () => {
            cy.contains('Add Asset').click()
            cy.get('input.inputFields[name="asset-id"]').type(tmpAssetData.id)
            cy.get('input.inputFields[name="asset-name"]').type(tmpAssetData.name)
            cy.get('input.inputFields[name="asset-criticality"]').clear().type(tmpAssetData.crit)
            cy.get('input.inputFields[name="asset-type"]').type(tmpAssetData.type)
            cy.get('.AuthBtnContainer').find('button.standard-button').contains('Add').click();
        })

        afterEach('removing asset', () => {
            // Clean up here, Remove asset
        })

        it('form should disapear', () => {
            cy.get('.asset-form').should('not.exist')
        })
        it('can find asset in list', () => {
            cy.get('.asset-list-container').should('contain', tmpAssetData.name)
            cy.get('.asset-list-container').should('contain', tmpAssetData.crit)
            cy.get('.asset-list-container').should('contain', tmpAssetData.type)
        })
    })
})