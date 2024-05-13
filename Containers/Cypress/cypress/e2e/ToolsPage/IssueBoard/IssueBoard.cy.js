describe('Testing Issue Board', () => {
    beforeEach('loggin in', () => {
        cy.login();
    })

    afterEach('logout', () => {
        cy.logout();
    })

    it('can vsit Issue Board page', () => {
        cy.contains('Tools').click()
        cy.contains('Issue Board').click()
    })
})