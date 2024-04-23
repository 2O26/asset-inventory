describe('Testing History Page', () => {
    let assetID = ""
    beforeEach('loggin in', () => {
        cy.login();
    })

    afterEach('logout', () => {
        cy.logout();
    })

    it('can verify added asset in history page', () => {
        cy.addAsset("TestName", 3, "TestType", "TestOwner").then(id => {
            assetID = id;
            cy.wait(1000)
            cy.contains('Tools').click()
            cy.contains(' History ').click()
            cy.contains('addedassets').parent().find('span').eq(1).contains(id).should('exist');
        });
    })
    it('can verify removed asset in history page', () => {
        cy.removeAsset("TestName")
        cy.wait(1000)
        cy.contains('Tools').click()
        cy.contains(' History ').click()
        cy.contains('removedassets').parent().find('span').eq(1).contains(assetID).should('exist');
    })

})