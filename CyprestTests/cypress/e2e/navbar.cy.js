describe('Navbar tests', () => {
  beforeEach('visiting homepage', () => {
    cy.visit(Cypress.env('baseUrl'))
  })

  describe('when visiting dashboard page', () => {
    beforeEach('visiting dashboard', () => {
      cy.contains('Dashboard').click()
    })
    it('can verify correct url', () => {
      cy.url().should('eq', Cypress.env('baseUrl') + "/")
    })
  })

  describe('when visiting tools page', () => {
    beforeEach('visiting tools', () => {
      cy.contains('Tools').click()
    })
    it('can verify correct url', () => {
      cy.url().should('eq', `${Cypress.env('baseUrl')}/tools`)
    })
  })

  describe('when visiting settings page', () => {
    beforeEach('visiting settings', () => {
      cy.contains('Settings').click()
    })
    it('can verify correct url', () => {
      cy.url().should('eq', `${Cypress.env('baseUrl')}/settings`)
    })
  })

  describe('when visiting profile page', () => {
    beforeEach('visiting profile', () => {
      cy.contains('Profile').click()
    })
    it('can verify correct url', () => {
      cy.url().should('eq', `${Cypress.env('baseUrl')}/profile`)
    })
  })

  describe('when visiting signin page', () => {
    beforeEach('visiting signin', () => {
      cy.contains('Sign in').click()
    })
    it('can verify correct url', () => {
      cy.url().should('eq', `${Cypress.env('baseUrl')}/signin`)
    })
  })
})