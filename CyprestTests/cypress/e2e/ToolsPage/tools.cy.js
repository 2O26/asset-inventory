describe('Tools page tests', () => {
    beforeEach('visiting tools page', () => {
        cy.visit(Cypress.env('baseUrl'))
        cy.contains('Tools').click()
    })

    it('can verify asset list button', () => {
        cy.get('.tools-container').should('contain', ' Asset List')
    })

    it('can verify IP Scanner button', () => {
        cy.get('.tools-container').should('contain', ' IP Scanner')
    })

    it('can verify Mac Scanner button', () => {
        cy.get('.tools-container').should('contain', ' Mac Scanner')
    })
})