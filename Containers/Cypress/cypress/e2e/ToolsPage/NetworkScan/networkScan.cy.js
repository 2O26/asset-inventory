describe('Testing NetworkScan Page', () => {
    let ipRange = "127.0.0.1/32"
    beforeEach('loggin in and create ip range', () => {
        cy.login();
        cy.addIPRange(ipRange)
        cy.contains('Tools').click();
        cy.contains(' Network Scanner').click();
    })

    afterEach('remove ip range and logout', () => {
        cy.removeIPRange(ipRange)
        cy.logout();
    })

    it('can verify ipRange in Netowrk Scan Page', () => {
        cy.get(`input[type="checkbox"][name="rangetype"][value="${ipRange}"]`).should('exist')
    })

    it('Scan btn should be dissabled', () => {
        cy.get('.standard-button').should('be.disabled');
    })

    it('Can not scan when scan type not defined', () => {
        cy.get(`input[type="checkbox"][name="rangetype"][value="${ipRange}"]`).click()
        cy.get('.standard-button').should('be.disabled');
    })

    it('Can not scan when ip range not defined', () => {
        cy.get('input[name="scantype"][value="simple"]').click()
        cy.get('.standard-button').should('be.disabled');
    })

    it('Can scan when scan type and ip range is defined', () => {
        cy.get('input[name="scantype"][value="simple"]').click()
        cy.get(`input[type="checkbox"][name="rangetype"][value="${ipRange}"]`).click()
        cy.get('.standard-button').should('not.be.disabled');
    })

    it('Can perform simple scan on local host', () => {
        cy.get('input[name="scantype"][value="simple"]').click()
        cy.get(`input[type="checkbox"][name="rangetype"][value="${ipRange}"]`).click()
        cy.get('.standard-button').click()
        cy.wait(1000)
        cy.get('.resultText', { timeout: 10000 }).should('exist');
        cy.get('.resultText').should('contain', 'Successfully scanned subnet')


    })

    // it('Can perform extensive scan on local host', () => {
    //     cy.get('input[name="scantype"][value="extensive"]').click()
    //     cy.get(`input[type="checkbox"][name="rangetype"][value="${ipRange}"]`).click()
    //     cy.get('.standard-button').click()
    //     cy.wait(1000)
    //     cy.get('.resultText', { timeout: 10000 }).should('exist');
    //     cy.get('.resultText').should('contain', 'Successfully started scanning IP range')

    // })

    // it('can see info texts', () => {
    //     cy.get(".info-content").first().should('exist')
    //     cy.get(".info-content").eq(1).should('exist')
    // })

    // it('can only select one scan type', () => {
    //     cy.get('input[name="scantype"][value="extensive"]').click()
    //     cy.get('input[name="scantype"][value="simple"]').click()
    //     cy.get('input[name="scantype"][value="extensive"]').should('not.be.checked')
    // })

})