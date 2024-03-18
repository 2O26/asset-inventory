describe('Tools page tests', () => {
    beforeEach('visiting tools page', () => {
        cy.visit(Cypress.env('baseUrl'))
        cy.contains('Tools').click()
    })

    it('can verify asset list button', () => {
        cy.get('.tools-container').should('contain', ' Asset List')
    })

    it('can verify Network Scan button', () => {
        cy.get('.tools-container').should('contain', ' Network Scan')
    })

    it('can verify View Logs button', () => {
        cy.get('.tools-container').should('contain', ' View Logs')
    })

    it('can verify Graph View button', () => {
        cy.get('.tools-container').should('contain', ' Graph View')
    })
})