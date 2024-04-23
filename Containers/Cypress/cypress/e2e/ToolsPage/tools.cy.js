describe('Tools page tests', () => {
    beforeEach('visiting tools page', () => {
        cy.login();
        cy.contains('Tools').click()
    })

    afterEach('logout', () => {
        cy.logout();
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

    it('can verify History button', () => {
        cy.get('.tools-container').should('contain', ' History')
    })

    it('can verify  Global SBOM library search button', () => {
        cy.get('.tools-container').should('contain', ' Global SBOM library search')
    })

    it('can verify  Download PDF button', () => {
        cy.get('.tools-container').should('contain', ' Download PDF')
    })

    it('can verify  Admin Console button', () => {
        cy.get('.tools-container').should('contain', ' Admin Console')
    })
})