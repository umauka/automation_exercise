describe('Get Featured Items', () => {
  it('Get Featured Items List with their Respective Prices Sorted in Ascending Order', () => {
    cy.visit('https://www.automationexercise.com/');
    cy.get('.shop-menu > .nav > :nth-child(4) > a').click();

    cy.fixture("testData").then((data) => {
      cy.get('[data-qa="login-email"]').type(data.login.username);
      cy.get('[data-qa="login-password"]').type(data.login.password);
    });

    cy.get('[data-qa="login-button"]').click();
    cy.getCookies().then((cookies) => {
      const cookieData = cookies.map(cookie => ({ name: cookie.name, value: cookie.value }));
      cy.writeFile('cypress/fixtures/sessionCookies.json', cookieData);
    });

    let pricesArray = [];
    let descArray = [];
    let result = [];

    // Fetch prices
    cy.get('div.features_items > .col-sm-4 > div > div > div > h2').each(($el) => {
      cy.wrap($el).invoke('text').then(text => {
        let price = parseFloat(text.substring(3).replace(/[^\d.-]/g, '')); // Remove "Rs. " and make it a float in case of fractions
        pricesArray.push(price);
      });
    });

    // Fetch descriptions
    cy.get('div.features_items > .col-sm-4 > div > div > div > p').each(($el2) => {
      cy.wrap($el2).invoke('text').then(text => {
        descArray.push(text);
      });
    });

    // Combine, sort, and log results
    cy.then(() => {
      // Verify that both arrays have the same length
      if (pricesArray.length !== descArray.length) {
        throw new Error('Arrays are of different lengths');
      }

      // Combine arrays into pairs
      for (let i = 0; i < pricesArray.length; i++) {
        result.push([descArray[i], pricesArray[i]]);
      }

      // Sort the result array by the price (second element)
      result.sort((a, b) => a[1] - b[1]);

      // Add "Rs. " prefix back to the prices
      result = result.map(pair => [pair[0], `Rs. ${pair[1]}`]);

      // Log the sorted and formatted result
      cy.log(JSON.stringify(result));
    });
  });
});


describe('Add To Cart, Place an Order and Make Payment', () => {
  before(() => {
    cy.readFile('cypress/fixtures/sessionCookies.json').then((cookies) => {
      cookies.forEach((cookie) => {
        cy.setCookie(cookie.name, cookie.value);
      });
    });
  });

  it('Add Featured Women\'s Green and White Tops to Cart, Place Order and Make Payment', () => {
    cy.visit('https://www.automationexercise.com/');

    // Navigate to Women's section and click on Dress and then Tops
    cy.get(':nth-child(1) > .panel-heading > .panel-title > a')
      .should('have.attr', 'href', '#Women').scrollIntoView().click();
    cy.get('#Women > .panel-body > ul > :nth-child(1) > a')
      .should('have.text', 'Dress ').click();
    cy.get('#Women > .panel-body > ul > :nth-child(2) > a')
      .should('have.text', 'Tops ').click({ force: true });

    // Verify the title
    cy.get('.title').should('have.text', 'Women - Tops Products');

    // Add Fancy Green Top to cart
    cy.get('.single-products > .productinfo').contains('p', 'Fancy Green Top')
      .parentsUntil('.single-products').find('a.btn').click();
    cy.get('.modal-content').should('be.visible');
    cy.get('.modal-body > :nth-child(1)').should('have.text', 'Your product has been added to cart.');
    cy.get('.modal-footer > .btn').click();

    // Add Summer White Top to cart
    cy.get('.single-products > .productinfo').contains('p', 'Summer White Top')
      .parentsUntil('.single-products').find('a.btn').click();
    cy.get('.modal-content').should('be.visible');
    cy.get('.modal-body > :nth-child(1)').should('have.text', 'Your product has been added to cart.');
    cy.get('u').should('have.text', 'View Cart').click();

    // Verify cart items
    cy.get('tr#product-8').should('be.visible').and('contain', 'Fancy Green Top');
    cy.get('tr#product-6').should('be.visible').and('contain', 'Summer White Top');
    cy.get('.col-sm-6 > .btn').should('have.text', 'Proceed To Checkout').click();

    // Place order and enter payment details
    cy.get('.form-control').scrollIntoView().type('Order placed.');
    cy.get('.btn').contains('Place Order').should('be.visible').click();
    cy.get('.heading').should('be.visible').and('have.text', 'Payment');

    cy.fixture('testData').then((data) => {
      cy.get('[data-qa="name-on-card"]').type(data.testCard.nameOnCard);
      cy.get('[data-qa="card-number"]').type(data.testCard.cardNumber);
      cy.get('[data-qa="cvc"]').type(data.testCard.cvv);
      cy.get('[data-qa="expiry-month"]').type(data.testCard.expiryDate.month);
      cy.get('[data-qa="expiry-year"]').type(data.testCard.expiryDate.year);
    });

    cy.get('[data-qa="pay-button"]').click();

    // Verify order placement
    cy.get('[data-qa="order-placed"] > b').should('be.visible').and('have.text', 'Order Placed!');
    cy.get('.col-sm-9 > p').should('be.visible').and('have.text', 'Congratulations! Your order has been confirmed!');
    cy.get('.col-sm-9 > .btn-default').should('have.attr', 'href').and('include', '/download');

    // Check for the invoice download
    const filename = 'cypress/downloads/invoice.txt';
    cy.readFile(filename, { timeout: 15000 }).should('exist').then((content) => {
      cy.log(content);
    });
  });
});
