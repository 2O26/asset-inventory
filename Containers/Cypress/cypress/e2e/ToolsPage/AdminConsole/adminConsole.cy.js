describe('Testing Admin Console Page', () => {
    beforeEach('loggin in', () => {
        cy.login();
    })

    afterEach('logout', () => {
        cy.logout();
    })

    it('can verify redirect when presssiong logs button', () => {
        cy.contains('Tools').click();
        cy.window().then((win) => {
            cy.stub(win, 'open').as('windowOpen');
        });

        // Perform the action that triggers the window.open
        cy.contains(' Admin Console').click();

        // Assert that window.open was called with the correct arguments
        cy.get('@windowOpen').should('be.calledWith', 'http://localhost:8085', '_blank');
    })

})