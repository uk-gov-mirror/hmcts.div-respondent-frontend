const content = require('common/content');
const desertionSession = require('test/resources/desertion-divorce-session');
const config = require('config');

Feature('Desertion journey');
const languages = ['en', 'cy'];

const runTests = (language = 'en') => {
  const amountOfTimesToRetry = 10;
  const waitInterval = 5;

  Scenario(`@Pipeline Proceed with divorce with desertion without agreement case - ${language}`, async I => {
    await I.retry(amountOfTimesToRetry).createAUser();

    I.retry(amountOfTimesToRetry).createAosCaseForUser(desertionSession);
    await I.amOnLoadedPage('/', language);

    await I.retry(amountOfTimesToRetry).createAUser();
    I.login(language);
    I.seeCaptureCaseAndPinPage(language);
    I.fillInReferenceNumberAndPinCode();
    I.navByClick(content[language].continue);
    if (config.tests.e2e.addWaitForCrossBrowser) {
      I.wait(waitInterval);
    }
    I.seeRespondPage(language);
    I.click(content[language].continue);

    I.seeReviewApplicationPage(language);
    I.acknowledgeApplication(language);
    I.click(content[language].continue);

    I.seeLanguagePreferencePage(language);
    I.chooseBilingualApplication(language);
    I.click(content[language].continue);

    I.seeChooseAResponsePage(language);
    I.chooseToProceedWithDivorce(language);
    I.click(content[language].continue);

    I.seeJurisdictionPage(language);
    I.chooseAgreeToJurisdiction(language);
    I.scrollPageToBottom();
    I.click(content[language].continue);

    I.seeLegalProceedingPage(language);
    I.chooseNoLegalProceedings(language);
    I.navByClick(content[language].continue);

    I.seeContactDetailsPage(language);
    I.consentToSendingNotifications(language);
    I.navByClick(content[language].continue);

    if (config.features.respondentEquality === 'true') {
      I.seeEqualityPage(language);
      I.completePCQs(language);
    }

    I.wait(waitInterval);

    I.seeCheckYourAnswersPage(language);
    I.confirmInformationIsTrue(language);
    I.submitApplication(language);

    I.seeDonePage(language);
    I.see('EZ12D81281');
  }).retry(amountOfTimesToRetry);
};

languages
  .forEach(language => {
    runTests(language);
  });
