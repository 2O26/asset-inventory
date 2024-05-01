// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

Cypress.Commands.add('login', () => {

    cy.origin(Cypress.env('kc-url'), () => {
        cy.visit(Cypress.env('base-url'))
        cy.get('#username').type('admin')
        cy.get('#password').type('admin')
        cy.get('#kc-login').click()
    })
});

Cypress.Commands.add('logout', () => {
    cy.contains('Sign Out').click()
}
)
Cypress.Commands.add('addAsset', (name, criticality, type, owner) => {
    cy.contains('Tools').click()
    cy.contains('Asset List').click()
    cy.contains('Add Asset').click()
    cy.get('input.inputFields[name="asset-name"]').type(name)
    cy.get('input.inputFields[name="asset-criticality"]').clear().type(criticality)
    cy.get('input.inputFields[name="asset-type"]').type(type)
    cy.get('input.inputFields[name="asset-owner"]').type(owner)
    cy.get('.AuthBtnContainer').find('button.standard-button').contains('Add').click();

    return cy.get('.assetCell').contains(name).parents('.assetRow').invoke('attr', 'id').then(id => {
        return id;
    });
});

Cypress.Commands.add('removeAsset', (name) => {
    cy.contains('Tools').click()
    cy.contains('Asset List').click()
    cy.get('.assetCell').contains(name).parents('.assetRow').find('input[type="checkbox"]').click();
    cy.get('.standard-button').contains('Remove Asset').click();
    cy.get('button').filter((index, element) => element.textContent.trim() === 'Remove').click();
});

Cypress.Commands.add('addIPRange', (range) => {
    cy.contains('Settings').click()
    cy.contains('Network Scan Settings').click()
    cy.get('.standard-button').contains(' Add IP range').click()
    cy.get('input[name="IPrangeInput"]').clear().type(range);
    cy.get('button[type="submit"]').contains('Add IP range').click();
});

Cypress.Commands.add('removeIPRange', (range) => {
    cy.contains('Settings').click();
    cy.contains('Network Scan Settings').click()
    cy.on('window:confirm', () => true);
    cy.contains('.span-text', range).siblings('button[aria-label="Remove"]').click();
});



