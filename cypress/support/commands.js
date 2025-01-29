/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
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
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

Cypress.Commands.add('login', (email, password) => {
    cy.visit('/')
    cy.get('button').contains('Login').click()
    cy.get('input[id="email"]').type(email)
    cy.get('input[id="password"]').type(password)
    cy.get('button').contains('Sign in').click()
})

Cypress.Commands.add("createUserProfile", () => {
    if (!Cypress.env("TEST_USER_FULL_NAME") === "Test User") {
        cy.get('input[id="fullName"]').type('Test User')
        cy.get('input[id="email"]').type('testuser@mail.com')
        cy.get('input[id="city"]').type('Gdansk')
        cy.get('input[id="country"]').type('Poland')

        cy.get('button').contains('Next').click()

        cy.get('button').contains("Test interest 1").click()
        cy.get('button').contains("Create User").click()
    }
})

Cypress.Commands.add("searchForEvent", () => {
    cy.get('input[id="search"]').type('Test')
    cy.get("input[id='city']").type('Gdańsk')
    cy.get('button').contains('Search').click()

    cy.get('h1').contains('TEST').click()

    cy.get('button').then(buttons => {
        if (buttons.text().includes('Attend')) {
            cy.get('button').contains('Attend').click()
        } else if (buttons.text().includes('Unattend')) {
            cy.get('button').contains('Unattend').click()
        }
    })

    cy.get('button').contains('Dashboard').click()
})

Cypress.Commands.add("editUser", () => {
    cy.get('button').contains('Edit user').scrollIntoView().click()
    cy.get('input[id="fullName"]').type('Test User')
    cy.get('input[id="email"]').type('testemail@mail.com')
    cy.get('input[id="city"]').type('Gdansk')
    cy.get('input[id="country"]').type('Poland')
    cy.get('button').contains('Edit Profile').click()

    cy.get('button').contains('Edit BIO').scrollIntoView().click()
    cy.get('div[id="text-editor-toolbar"]').find('button').each(($button, index, $list) => {
        cy.wrap($button).scrollIntoView().click()
        cy.get('.tiptap').type(`Test bio ${index + 1}{enter}`)
    })

    cy.get('button').contains('Save changes').click()
})

Cypress.Commands.add("editSocials", () => {
    cy.get('button').contains('Edit socials').scrollIntoView().click()

    cy.get('input[placeholder="Facebook link..."]').type('https://github.com/ddebixx')
    cy.get('input[placeholder="Instagram link..."]').type('https://github.com/ddebixx')
    cy.get('input[placeholder="Twitter link..."]').type('https://github.com/ddebixx')

    cy.get('button').contains('Update socials').click()
})

Cypress.Commands.add("editInterests", () => {
    cy.get('a').contains('Interests').scrollIntoView().click()

    cy.get('body').then($body => {
        cy.get('button[id^="user-interest-"]').each(($button) => {
            cy.wrap($button).click()
        })

        cy.get('button').contains('Remove Selected').click()
    })

    cy.get('button[id="interest-0"]').each(($button) => {
        cy.wrap($button).click()
    })

    cy.get('button').contains('Save Interests').click()
})

Cypress.Commands.add("createGroup", () => {
    cy.get('a').contains('Your groups').click()

    cy.get('button').contains('Create Group').click()
    cy.get('input[placeholder="Group Name"]').type('Test Group')
    cy.get('input[placeholder="Group City"]').type('Gdańsk')
    cy.get('input[placeholder="Group Country"]').type('Poland')

    cy.get('button').contains('Next step').click()

    cy.get('button[id="interest-0"]').each(($button) => {
        cy.wrap($button).click()
    })

    cy.get('button').contains('Next step').click()

    cy.get('div[id="text-editor-toolbar"]').find('button').each(($button, index, $list) => {
        cy.wrap($button).scrollIntoView().click()
        cy.get('.tiptap').type(`Test bio ${index + 1}{enter}`)
    })

    cy.get('button').contains('Create group').click()
})

Cypress.Commands.add("visitGroup", () => {
    cy.get('a').contains('Test group').click()
})

Cypress.Commands.add("createEvent", () => {
    cy.get('a').contains('Events').click()

    cy.get('button').contains('Create event').click()

    cy.get('input[placeholder="Event Title"]').type('Test Event')
    cy.contains('button', 'Select event group').click()
    cy.contains('div', 'Test Group').click()
    cy.get('input[placeholder="Event Description"]').type('Test description')
    cy.get('input[type="datetime-local"]').type('2024-11-30T14:30')
    cy.get('input[placeholder="Event Address"]').type('Gdańsk, Fajna 15')
    cy.get('input[placeholder="Ticket Price"]').type('Free')
    cy.get('button').contains('Create Event').click()
})

Cypress.Commands.add("visitEvent", () => {
    cy.get('button').contains('Hosting').click()
})
