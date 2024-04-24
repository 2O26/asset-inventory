describe('Testing SBOM Page', () => {
    beforeEach('loggin in', () => {
        cy.login();
    })

    afterEach('logout', () => {
        cy.logout();
    })

    it('can vsit SMOB page', () => {
        cy.contains('Tools').click()
        cy.contains(' Global SBOM library search').click()
    })
})