describe('View asset page tests', () => {
    beforeEach('visiting Asset List page', () => {
        cy.visit(Cypress.env('baseUrl'))
        cy.contains('Tools').click()
        cy.contains('Asset List').click()
    })

    describe('when viewing asset 0', () => {
        let tmpName = ""
        let tmpType = ""
        let tmpCrit = ""
        let tmpOwner = ""
        beforeEach('clicking asset in list and saving info', () => {
            cy.get('.assetRow').eq(0)
                .then((row) => {
                    tmpName = row.find('.assetCell').eq(0).text();
                    tmpType = row.find('.assetCell').eq(1).text();
                    tmpCrit = row.find('.assetCell').eq(2).text();
                    tmpOwner = row.find('.assetCell').eq(3).text();
                }).click();
        })

        it('can verify asset name', () => {
            cy.get('[name="asset-name"]').should('contain', tmpName);
        })

        it('can verify asset type', () => {
            cy.get('.assetItem').contains('Type').should('contain', tmpType);
        })

        it('can verify asset criticality', () => {
            cy.get('.assetItem').contains('Criticality').should('contain', tmpCrit);
        })

        it('can verify asset Owner', () => {
            cy.get('.assetItem').contains('Owner').should('contain', tmpOwner);
        })
    })

    describe('when viewing asset 1', () => {
        let tmpName = ""
        let tmpType = ""
        let tmpCrit = ""
        let tmpOwner = ""
        beforeEach('clicking asset in list and saving info', () => {
            cy.get('.assetRow').eq(1)
                .then((row) => {
                    tmpName = row.find('.assetCell').eq(0).text();
                    tmpType = row.find('.assetCell').eq(1).text();
                    tmpCrit = row.find('.assetCell').eq(2).text();
                    tmpOwner = row.find('.assetCell').eq(3).text();
                }).click();
        })

        it('can verify asset name', () => {
            cy.get('[name="asset-name"]').should('contain', tmpName);
        })

        it('can verify asset type', () => {
            cy.get('.assetItem').contains('Type').should('contain', tmpType);
        })

        it('can verify asset criticality', () => {
            cy.get('.assetItem').contains('Criticality').should('contain', tmpCrit);
        })

        it('can verify asset Owner', () => {
            cy.get('.assetItem').contains('Owner').should('contain', tmpOwner);
        })
    })


})