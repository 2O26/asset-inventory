describe('View asset page tests', () => {
    beforeEach('visiting Asset List page', () => {
        cy.login();
        cy.contains('Tools').click()
        cy.contains('Asset List').click()
    })

    afterEach('logout', () => {
        cy.logout();
    })

    for (let i = 0; i < 3; i++) {
        describe(`when viewing asset ${i}`, () => {
            let tmpName = ""
            let tmpType = ""
            let tmpOwner = ""
            let tmpCreated = ""
            let tmpEdited = ""
            let tmpCrit = ""
            beforeEach('clicking asset in list and saving info', () => {
                cy.get('.assetRow').eq(i)
                    .then((row) => {
                        tmpName = row.find('.assetCell').eq(1).text();
                        tmpOwner = row.find('.assetCell').eq(2).text();
                        tmpType = row.find('.assetCell').eq(3).text();
                        tmpCreated = row.find('.assetCell').eq(4).text();
                        tmpEdited = row.find('.assetCell').eq(5).text();
                        tmpCrit = row.find('.assetCell').eq(6).text();
                    }).click();
            })

            it('can verify asset name', () => {
                cy.get('[name="asset-name"]').should('contain', tmpName);
            })

            it('can verify asset type', () => {
                cy.get('.assetItem').contains('Type').should('contain', tmpType);
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
