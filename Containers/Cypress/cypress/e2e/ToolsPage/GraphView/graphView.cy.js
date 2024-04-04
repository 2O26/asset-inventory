describe('Graph View page tests', () => {
    beforeEach('visiting Asset List page', () => {
        cy.login();
        cy.contains('Tools').click()
        cy.contains('Graph View').click()
    })

    afterEach('logout', () => {
        cy.logout();
    })

    it('Can verify URL', () => {
        cy.url().should('include', "tools/graph-view")
    })

    it('Can see react flow panel', () => {
        cy.get('.react-flow').should('exist')
    })
    it('Can see react flow controls', () => {
        cy.get('.react-flow__controls ').should('exist')
    })
    it('Can see react flow minimap', () => {
        cy.get('.react-flow__minimap').should('exist')
    })

    describe('when clicking node', () => {
        let assetName = ""
        beforeEach('clicking node', () => {
            cy.get(".react-flow__node.react-flow__node-turbo.nopan.selectable > .wrapper.gradient > .inner").eq(0).then(assetNode => {
                assetName = assetNode.find(".title").text()
            }).click()
        })
        it('can assert URL name', () => {
            cy.url().should('include', "/asset-view/")
        })

        it('can assert asset name', () => {
            cy.get('.asset-info-container [name="asset-name"]').invoke('text').should("eq", assetName)
        })
    })
})