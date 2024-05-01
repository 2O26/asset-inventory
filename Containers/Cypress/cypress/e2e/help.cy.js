describe('Testing help button', () => {
    beforeEach('loggin in and create ip range', () => {
        cy.login();
    })

    afterEach('remove ip range and logout', () => {
        cy.logout();
    })

    it("can redirect to help page", () => {
        cy.window().then((win) => {
            cy.stub(win, 'open').as('windowOpen');
        });

        // Perform the action that triggers the window.open
        cy.contains('Help').click()

        // Assert that window.open was called with the correct arguments
        cy.get('@windowOpen').should('be.calledWith', "http://localhost:6880/home/", "_blank");
    })
})