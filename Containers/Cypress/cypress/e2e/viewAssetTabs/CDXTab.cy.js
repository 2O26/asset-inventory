describe('CDX Tab Test', () => {
  const tmpAssetData = {
    name: "Test Asset",
    crit: 4,
    type: "laptop",
    owner: "Jack Sparrow"
  };

  beforeEach('visiting Asset List page and creating asset', () => {
    cy.login();
    cy.contains('Tools').click();
    cy.contains('Asset List').click();
    cy.contains('Add Asset').click();
    cy.get('input.inputFields[name="asset-name"]').type(tmpAssetData.name);
    cy.get('input.inputFields[name="asset-criticality"]').clear().type(tmpAssetData.crit);
    cy.get('input.inputFields[name="asset-type"]').type(tmpAssetData.type);
    cy.get('input.inputFields[name="asset-owner"]').type(tmpAssetData.owner);
    cy.get('.AuthBtnContainer').find('button.standard-button').contains('Add').click();
    cy.get('.assetCell').contains(tmpAssetData.name).parents('.assetRow').click();
    cy.get('button.tab-button').contains('C-DX').click();
    cy.get('input[type="file"][name="file"]').then(subject => {
      cy.fixture('juiceBOM.json').then(fileContent => {
        const blob = new Blob([JSON.stringify(fileContent)], { type: 'application/json' });
        const file = new File([blob], 'juiceBOM.json', { type: 'application/json' });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        subject[0].files = dataTransfer.files;
        subject[0].dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
  });

  afterEach('removing asset and logout', () => {
    cy.contains('Tools').click();
    cy.contains('Asset List').click();

    const clickCheckboxUntilChecked = (maxAttempts, attempts = 0) => {
      attempts++;
      cy.get('.assetCell').contains(tmpAssetData.name).parents('.assetRow').find('input[type="checkbox"]').click().then($checkbox => {
        const isChecked = $checkbox.is(':checked');
        if (!isChecked && attempts < maxAttempts) {
          cy.wait(500);
          clickCheckboxUntilChecked(maxAttempts, attempts);
        }
      });
    };
    clickCheckboxUntilChecked(5); 
    
    cy.get('.assetCell').contains(tmpAssetData.name).parents('.assetRow').find('input[type="checkbox"]').should('be.checked');
    cy.get('div').contains('Remove Asset').then($button => {
      if ($button.length) {
        $button.click();
        cy.get('div[role="dialog"][aria-label="Remove Asset"]', { timeout: 10000 }).should('be.visible').within(() => {
          cy.get('button.standard-button').contains('Remove').click();
        });
      }
    });

    cy.logout();
  });

  describe('CDX tab Functionality', () => {
    it('Check if CDX tab exists', () => {
      cy.get('button.tab-button').contains('C-DX').click();
    });

    it('Check if CDX tab has the uploaded file', () => {
      cy.get('button.tab-button').contains('C-DX').click();
      cy.wait(2000);
      cy.get('.cdxFileTest').should('contain', 'Uploaded SBOM file');
    });

    it('Check if the uploaded file has all tabs', () => {
      cy.get('button.tab-button').contains('C-DX').click();
      cy.wait(2000);
      cy.get('.cdxFileTest').click();
      cy.wait(2000);
      cy.get('.ReactModal__Content').should('be.visible');
      cy.get('.button-container-json button.tab-button').should('have.length', 5);
      cy.get('.button-container-json button.tab-button').eq(0).should('contain.text', 'Full CycloneDX File');
      cy.get('.button-container-json button.tab-button').eq(1).should('contain.text', 'Metadata about software');
      cy.get('.button-container-json button.tab-button').eq(2).should('contain.text', 'External Libraries Used');
      cy.get('.button-container-json button.tab-button').eq(3).should('contain.text', 'External Frameworks Used');
      cy.get('.button-container-json button.tab-button').eq(4).should('contain.text', 'Vulnerble Components');
      cy.reload();
      cy.wait(2000);
    });
    
    it('Should match SBOM file information with Global Library Search', () => {
      const expectedDetails = {
          name: 'body-parser',
          version: '1.19.0',
          purl: 'pkg:npm/body-parser@1.19.0'
      };
  
      cy.get('button.tab-button').contains('C-DX').click();
      cy.wait(2000);
      cy.get('.cdxFileTest').contains('Uploaded SBOM file').click();
      cy.wait(2000);
      cy.contains('components:').click();
      cy.contains('0:').click();
      cy.get('li > ul > li').then(($lis) => {
        const componentLi = $lis.filter((index, li) => Cypress.$(li).find('label > span').text().trim() === '0:');
      
        if (componentLi.length > 0) {
          const name = componentLi.find('li > label:contains("name:") > span').text().trim();
          const version = componentLi.find('li > label:contains("version:") > span').text().trim();
          const purl = componentLi.find('li > label:contains("bom-ref:") > span').text().trim();

          expect(name, `Checking name`).to.equal(expectedDetails.name);
          expect(version, `Checking version`).to.equal(expectedDetails.version);
          expect(purl, `Checking purl`).to.equal(expectedDetails.purl);
          
        } else {
          cy.log('Component details not found');
        }
      });

      cy.reload();
      cy.wait(1000);
      cy.contains('Tools').click();
      cy.contains('Global SBOM library search').click();
      cy.get('.inputWrapper input[type="text"]').type(`${expectedDetails.name}{enter}`);
      cy.get('.drop-down-header').contains(`${expectedDetails.name} @ ${expectedDetails.version}`).click();
  
      cy.get('.json-tree-container').then(element => {
          const actualDetails = {
              name: element.find('.dropdown-container p').eq(0).text().trim(),
              version: element.find('.dropdown-container p').eq(2).text().trim(),
              purl: element.find('.dropdown-container p').eq(1).text().trim()
          };
  
          expect(actualDetails.name, `Check name in library: '${actualDetails.name}'`).to.include(expectedDetails.name);
          expect(actualDetails.version, `Check version in library: '${actualDetails.version}'`).to.include(expectedDetails.version);
          expect(actualDetails.purl, `Check purl in library: '${actualDetails.purl}'`).to.include(expectedDetails.purl);
      });
  });
  
  });
});