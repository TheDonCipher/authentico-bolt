describe('Sign Up Process', () => {
  it('should sign up as an individual', () => {
    cy.visit('http://frontend:3000'); // Adjust the URL as needed

    cy.get('button').contains('Sign Up as Individual').click();
    cy.get('input[name="name"]').type('John Doe');
    cy.get('input[name="email"]').type('john.doe@example.com');
    cy.get('button').contains('Connect Blockchain Wallet').click();

    // Add debugging step
    cy.url().then((url) => {
      cy.log('Current URL:', url);
    });

    cy.url({ timeout: 10000 }).should('include', '/dashboard'); // Increase timeout to 10 seconds
  });

  it('should sign up as an organization', () => {
    cy.visit('http://frontend:3000'); // Adjust the URL as needed

    cy.get('button').contains('Sign Up as Organization').click();
    cy.get('input[name="organizationName"]').should('be.visible').type('Acme Corp');
    cy.get('input[name="email"]').should('be.visible').type('contact@acme.com');
    cy.get('button').contains('Connect Blockchain Wallet').click();

    // Add debugging step
    cy.url().then((url) => {
      cy.log('Current URL:', url);
    });

    cy.url({ timeout: 10000 }).should('include', '/organization-dashboard'); // Increase timeout to 10 seconds
  });
});