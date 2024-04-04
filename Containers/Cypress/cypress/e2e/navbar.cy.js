describe('Navbar tests', () => {
  beforeEach('visiting homepage', () => {
    cy.login();
  })

  afterEach('logout', () => {
    cy.logout();
  })

  describe('when visiting dashboard page', () => {
    beforeEach('visiting dashboard', () => {
      cy.contains('Dashboard').click()
    })
    it('can verify correct url', () => {
      cy.url().should('eq', Cypress.env('base-url') + "/")
    })
  })

  describe('when visiting tools page', () => {
    beforeEach('visiting tools', () => {
      cy.contains('Tools').click()
    })
    it('can verify correct url', () => {
      cy.url().should('eq', `${Cypress.env('base-url')}/tools`)
    })
  })

  describe('when visiting settings page', () => {
    beforeEach('visiting settings', () => {
      cy.contains('Settings').click()
    })
    it('can verify correct url', () => {
      cy.url().should('eq', `${Cypress.env('base-url')}/settings`)
    })
  })

  describe('when visiting profile page', () => {
    beforeEach('visiting profile', () => {
      cy.contains('Profile').click()
    })
    it('can verify correct url', () => {
      cy.url().should('eq', `${Cypress.env('base-url')}/profile`)
    })
  })
})