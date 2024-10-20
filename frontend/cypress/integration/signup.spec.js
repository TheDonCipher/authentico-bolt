describe('Sign Up Process', () => {
  beforeEach(() => {
    cy.visit('/');
    // Mock the Thirdweb wallet connection
    cy.window().then((win) => {
      win.ethereum = {
        request: () => Promise.resolve('0x1234567890123456789012345678901234567890'),
        on: () => {},
      };
    });
  });

  it('should sign up as an individual', () => {
    cy.intercept('POST', '**/user/signup/individual').as('signupIndividual');
    
    cy.get('button').contains('Sign Up as Individual').click();
    cy.get('input[name="name"]').type('John Doe');
    cy.get('input[name="email"]').type('john.doe@example.com');
    cy.get('button').contains('Connect Blockchain Wallet').click();

    // Wait for the wallet connection to complete
    cy.wait(2000);

    // Submit the form
    cy.get('form').submit();

    // Wait for the signup request and log the response
    cy.wait('@signupIndividual').then((interception) => {
      if (interception.response) {
        cy.log('Signup response:', interception.response.body);
      } else {
        cy.log('No response received from signup request');
      }
    });

    cy.url({ timeout: 40000 }).should('include', '/dashboard').then((url) => {
      cy.log(`Current URL: ${url}`);
    });
  });

  it('should sign up as an organization', () => {
    cy.intercept('POST', '**/user/signup/organization').as('signupOrganization');
    
    cy.get('button').contains('Sign Up as Organization').click();
    cy.get('input[name="orgName"]').type('Acme Corp');
    cy.get('input[name="email"]').type('contact@acme.com');
    cy.get('button').contains('Connect Blockchain Wallet').click();

    // Wait for the wallet connection to complete
    cy.wait(2000);

    // Submit the form
    cy.get('form').submit();

    // Wait for the signup request and log the response
    cy.wait('@signupOrganization').then((interception) => {
      if (interception.response) {
        cy.log('Signup response:', interception.response.body);
      } else {
        cy.log('No response received from signup request');
      }
    });

    cy.url({ timeout: 40000 }).should('include', '/organization-dashboard').then((url) => {
      cy.log(`Current URL: ${url}`);
    });
  });
});
