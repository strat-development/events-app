describe('The Home Page', () => {
    before(() => {
        cy.login('testuser@mail.com', Cypress.env("TEST_USER_PASSWORD"))
            .then(() => {
                cy.createUserProfile()
                cy.searchForEvent()
                cy.editUser()
                cy.editSocials()
                cy.editInterests()
                cy.createGroup()
                cy.createEvent()
            })
    })

    it('successfully loads', () => {
        // cy.url().should('not.eq', Cypress.config().baseUrl + '/')
    })
})