describe('Sign Up Process', () => {
  it('should sign up as an individual', () => {
    cy.visit('http://frontend:3000'); // Adjust the URL as needed

    cy.get('button').contains('Sign Up as Individual').click();
    cy.get('input[name="name"]').type('John Doe');
    cy.get('input[name="email"]').type('john.doe@example.com');
    cy.get('button').contains('Connect Blockchain Wallet').click();

    cy.url().should('include', '/dashboard');
  });

  it('should sign up as an organization', () => {
    cy.visit('http://frontend:3000'); // Adjust the URL as needed

    cy.get('button').contains('Sign Up as Organization').click();
    cy.get('input[name="organizationName"]').type('Acme Corp');
    cy.get('input[name="email"]').type('contact@acme.com');
    cy.get('button').contains('Connect Blockchain Wallet').click();

    cy.url().should('include', '/organization-dashboard');
  });
});