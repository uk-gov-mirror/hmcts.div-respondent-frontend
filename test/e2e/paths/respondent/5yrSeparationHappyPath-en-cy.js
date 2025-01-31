const content = require('common/content');
const config = require('config');
const fivePlusYearsDivorceSession = require('test/resources/5PlusYears-divorce-session');

Feature('5 years Separation Journey');
const languages = ['en', 'cy'];

const runTests = (language = 'en') => {
  Scenario(`@Pipeline 5+ Years Separation Journey, Proceed divorce - ${language}`, async I => {
    await I.retry(2).createAUser();
    I.retry(2).createAosCaseForUser(fivePlusYearsDivorceSession);
    await I.amOnLoadedPage('/', language);

    await I.retry(2).createAUser();
    I.login(language);
    I.seeCaptureCaseAndPinPage(language);
    I.fillInReferenceNumberAndPinCode();
    I.navByClick(content[language].continue);
    if (config.tests.e2e.addWaitForCrossBrowser) {
      I.wait(3);
    }
    I.seeRespondPage(language);
    I.click(content[language].continue);

    I.seeReviewApplicationPage(language);
    I.wait(5);
    I.acknowledgeApplication(language);
    I.click(content[language].continue);

    I.seeLanguagePreferencePage(language);
    I.chooseBilingualApplication(language);
    I.click(content[language].continue);

    I.seeChooseAResponsePage(language);
    I.chooseToProceedWithDivorce(language);
    I.click(content[language].continue);

    I.seeFinancialSituationPage(language);
    I.clickToConsiderFinancialSituation(language);
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

    I.wait(5);

    I.seeCheckYourAnswersPage(language);
    I.confirmInformationIsTrue(language);
    I.submitApplication(language);

    I.seeDonePage(language);
    I.see('LV17D80999');
  }).retry(2);
};

languages
  .forEach(language => {
    runTests(language);
  });
