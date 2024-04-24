describe('Testing PDF download Page', () => {
    let ipRange = "10.0.0.0/32"
    beforeEach('loggin in', () => {
        cy.login();
        cy.addIPRange(ipRange)
        cy.contains('Tools').click();
        cy.contains(' Download PDF').click();
        cy.window().then((win) => {
            // Create a stub for pdfMake.createPdf().download()
            const pdfMakeStub = {
                download: cy.stub().as('downloadStub')
            };

            // Stub the createPdf function to return your stubbed download method
            cy.stub(win.pdfMake, 'createPdf').returns(pdfMakeStub);
        });
    })

    afterEach('logout', () => {
        cy.removeIPRange(ipRange)
        cy.logout();
    })

    it('chekcbox "All" value should be checked ', () => {
        cy.get(`input[type="checkbox"][value="${ipRange}"]`).should('not.be.checked')
        cy.get(`input[type="checkbox"][value="all"]`).should('be.checked')
    })

    it('if ip range is pressed, all should be unchecked ', () => {
        cy.get(`input[type="checkbox"][value="${ipRange}"]`).click()
        cy.get(`input[type="checkbox"][value="all"]`).should('not.be.checked')
    })

    it('can download when "All" is checked" ', () => {
        cy.get('.standard-button').click()
        cy.get('@downloadStub').should('have.been.calledOnceWith', 'pdf_from_json.pdf');
    })

    it('can download specific ip range is checked" ', () => {
        cy.get(`input[type="checkbox"][value="${ipRange}"]`).click()
        cy.get('.standard-button').click()
        cy.get('@downloadStub').should('have.been.calledOnceWith', 'pdf_from_json.pdf');
    })
})