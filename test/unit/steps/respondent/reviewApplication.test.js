/* eslint max-lines: 0 */

const modulePath = 'steps/respondent/review-application/ReviewApplication.step';
const ReviewApplication = require(modulePath);
const reviewApplicationContent = require('steps/respondent/review-application/ReviewApplication.content');
const ChooseAResponse = require('steps/respondent/choose-a-response/ChooseAResponse.step');
const SolicitorRepresentation = require('steps/respondent/solicitor-representation/SolicitorRepresentation.step');
const LanguagePreference = require('steps/respondent/language-preference/LanguagePreference.step');
const config = require('config');
const idam = require('services/idam');
const { middleware, question, sinon, content, expect } = require('@hmcts/one-per-page-test-suite');
const feesAndPaymentsService = require('services/feesAndPaymentsService');

describe(modulePath, () => {
  beforeEach(() => {
    sinon.stub(idam, 'protect')
      .returns(middleware.nextMock);
    sinon.stub(feesAndPaymentsService, 'get')
      .resolves({
        feeCode: 'FEE0002',
        version: 4,
        amount: 550.00,
        description: 'Filing an application for a divorce, nullity or civil partnership dissolution – fees order 1.2.' // eslint-disable-line max-len
      });
  });

  afterEach(() => {
    idam.protect.restore();
    feesAndPaymentsService.get.restore();
  });

  it('has idam.protect middleware', () => {
    return middleware.hasMiddleware(ReviewApplication, [idam.protect()]);
  });

  it('has getFeeFromFeesAndPayments middleware called with the proper values, and the corresponding number of times', () => { // eslint-disable-line max-len
    const session = {
      originalPetition: {
        jurisdictionConnection: {}
      }
    };
    return content(
      ReviewApplication,
      session,
      { specificContent: ['title'] }
    ).then(() => {
      sinon.assert.calledThrice(feesAndPaymentsService.get);
      sinon.assert.calledWith(feesAndPaymentsService.get, 'petition-issue-fee');
      sinon.assert.calledWith(feesAndPaymentsService.get, 'general-application-fee');
      sinon.assert.calledWith(feesAndPaymentsService.get, 'application-financial-order-fee');
    });
  });

  it('shows error if statement of truth not answered', () => {
    const session = {
      originalPetition: {
        jurisdictionConnection: {}
      }
    };
    return question.testErrors(ReviewApplication, session);
  });

  describe('solicitor feature redirect', () => {
    let sandbox = {};
    const fields = { respConfirmReadPetition: 'Yes' };
    const session = {
      originalPetition: {
        reasonForDivorceClaimingAdultery: false,
        languagePreferenceWelsh: 'Yes'
      }
    };

    before(() => {
      sandbox = sinon.createSandbox();
    });

    after(() => {
      sandbox.restore();
    });

    it('redirects to choose a response page when answered and solicitor feature off', () => {
      sandbox.stub(config, 'features').value({
        respSolicitorDetails: false
      });
      return question.redirectWithField(ReviewApplication, fields, ChooseAResponse, session);
    });

    it('redirects to solicitor question page when solicitor feature on', () => {
      sandbox.stub(config, 'features').value({
        respSolicitorDetails: true
      });
      return question.redirectWithField(ReviewApplication, fields, SolicitorRepresentation, session);
    });
  });

  describe('language question redirect', () => {
    it('redirects to the language question if language preference not present in session', () => {
      const fields = { respConfirmReadPetition: 'Yes' };
      const session = {
        originalPetition: {
          reasonForDivorceClaimingAdultery: false
        }
      };
      return question.redirectWithField(ReviewApplication, fields, LanguagePreference, session);
    });

    it('redirects to the language question if the petitioner answered No', () => {
      const fields = { respConfirmReadPetition: 'Yes' };
      const session = {
        originalPetition: {
          reasonForDivorceClaimingAdultery: false,
          languagePreferenceWelsh: 'No'
        }
      };
      return question.redirectWithField(ReviewApplication, fields, LanguagePreference, session);
    });
  });

  describe('Behaviour Details', () => {
    it('Alignment', () => {
      const reasonForDivorceBehaviourDetails = [
        'My wife is 1',
        'My wife is 1\r',
        'My wife is 2',
        'My wife is 1\r',
        'My wife\n is 2\r',
        'My wife is 3',
        'My wife is 1\r',
        'My wife is 2\r',
        'My wife is 3\r',
        'My wife is 4',
        'My wife is 1\r',
        'My wife is 2\r',
        'My wife is 3\r',
        'My wife is 4\r',
        'My wife is 5',
        'My wife is 1\r',
        'My wife is 2\r',
        'My wife is 3\r',
        'My wife is 4\r',
        'My wife is 5',
        '\r',
        '',
        'My wife is 6'
      ];
      const alignedBehaviourDetails = [
        'My wife is 1<br>',
        'My wife is 1',
        'My wife is 2<br>',
        'My wife is 1',
        'My wife\n is 2',
        'My wife is 3<br>',
        'My wife is 1',
        'My wife is 2',
        'My wife is 3',
        'My wife is 4<br>',
        'My wife is 1',
        'My wife is 2',
        'My wife is 3',
        'My wife is 4',
        'My wife is 5<br>',
        'My wife is 1',
        'My wife is 2',
        'My wife is 3',
        'My wife is 4',
        'My wife is 5<br>',
        'My wife is 6'
      ];
      const req = {
        journey: {},
        session: {
        }
      };
      const step = new ReviewApplication(req, {});
      step.retrieve()
        .validate();

      expect(
        step.alignSections(reasonForDivorceBehaviourDetails))
        .to
        .deep
        .equal(alignedBehaviourDetails);
    });
  });

  describe('Amend Case', () => {
    it('displays Amend case heading, issue date, reissue date', () => {
      const session = {
        originalPetition: {
          issueDate: '2019-22-02T00:00:00.000+0000',
          previousCaseId: '12345',
          previousIssueDate: '2018-10-02T00:00:00.000Z',
          jurisdictionConnection: {}
        }
      };
      return content(
        ReviewApplication,
        session,
        {
          specificContent: ['amendAppDetails'],
          specificValues: [ '02 October 2018', '22 February 2019' ]
        }
      );
    });
  });

  describe('values', () => {
    it('displays case reference number', () => {
      const session = {
        originalPetition: {
          caseReference: 'some-ref-number',
          jurisdictionConnection: {}
        }
      };
      return content(
        ReviewApplication,
        session,
        {
          specificValues: [session.originalPetition.caseReference]
        }
      );
    });

    it('displays issue date', () => {
      const session = {
        originalPetition: {
          issueDate: '2006-02-02T00:00:00.000+0000',
          jurisdictionConnection: {}
        }
      };
      return content(
        ReviewApplication,
        session,
        {
          specificValues: ['02 February 2006']
        }
      );
    });

    it('displays menatal and physical separation dates if they are used', () => {
      const session = {
        originalPetition: {
          jurisdictionConnection: {},
          reasonForDivorce: 'separation-5-years',
          reasonForDivorceDecisionDate: '2003-02-01T00:00:00.000+0000',
          reasonForDivorceLivingApartDate: '2003-02-02T00:00:00.000+0000'
        }
      };
      return content(
        ReviewApplication,
        session,
        {
          specificValues: ['02 February 2003']
        }
      );
    });

    it('displays petitioner and respondent names', () => {
      const session = {
        originalPetition: {
          jurisdictionConnection: {},
          petitionerFirstName: 'petitioner first name',
          petitionerLastName: 'petitioner last name',
          respondentFirstName: 'respondent first lastname',
          respondentLastName: 'respondent last name'
        }
      };
      return content(
        ReviewApplication,
        session,
        {
          specificValues: [
            session.originalPetition.petitionerFirstName,
            session.originalPetition.petitionerLastName,
            session.originalPetition.respondentFirstName,
            session.originalPetition.respondentLastName
          ]
        }
      );
    });

    it('displays co-respondent names', () => {
      const session = {
        originalPetition: {
          jurisdictionConnection: {},
          reasonForDivorce: 'adultery',
          reasonForDivorceAdulteryWishToName: 'Yes',
          reasonForDivorceAdultery3rdPartyFirstName: 'corespondent firstname',
          reasonForDivorceAdultery3rdPartyLastName: 'corespondent lastname'
        }
      };
      return content(
        ReviewApplication,
        session,
        {
          specificContent: ['coRespRoleExplain'],
          specificValues: [
            session.originalPetition.reasonForDivorceAdultery3rdPartyFirstName,
            session.originalPetition.reasonForDivorceAdultery3rdPartyLastName
          ]
        }
      );
    });

    it('displays marriage date formatted', () => {
      const session = {
        originalPetition: {
          jurisdictionConnection: {},
          marriageDate: '2001-02-02T00:00:00.000Z'
        }
      };
      return content(
        ReviewApplication,
        session,
        { specificValues: ['02 February 2001'] }
      );
    });

    it('displays legal proceedings details', () => {
      const session = {
        originalPetition: {
          jurisdictionConnection: {},
          legalProceedings: 'Yes',
          legalProceedingsDetails: 'The legal proceeding details'
        }
      };
      return content(
        ReviewApplication,
        session,
        { specificValues: [session.originalPetition.legalProceedingsDetails] }
      );
    });

    it('displays reason for divorce adultery details', () => {
      const session = {
        originalPetition: {
          jurisdictionConnection: {},
          reasonForDivorce: 'adultery',
          reasonForDivorceAdulteryKnowWhere: 'Yes',
          reasonForDivorceAdulteryKnowWhen: 'Yes',
          reasonForDivorceAdulteryDetails: 'Here are some adultery details',
          reasonForDivorceAdulteryWhereDetails: 'Where the adultery happened',
          reasonForDivorceAdulteryWhenDetails: 'When the adultery happened'
        }
      };
      return content(
        ReviewApplication,
        session,
        {
          specificValues: [
            session.originalPetition.reasonForDivorceAdulteryDetails,
            session.originalPetition.reasonForDivorceAdulteryWhereDetails,
            session.originalPetition.reasonForDivorceAdulteryWhenDetails
          ]
        }
      );
    });

    it('displays reason for divorce unreasonable behaviour details', () => {
      const session = {
        originalPetition: {
          jurisdictionConnection: {},
          reasonForDivorce: 'unreasonable-behaviour',
          reasonForDivorceBehaviourDetails: ['My wife is lazy']
        }
      };
      return content(
        ReviewApplication,
        session,
        { specificValues: [session.originalPetition.reasonForDivorceBehaviourDetails] }
      );
    });

    it('displays reason for divorce desertion details', () => {
      const session = {
        originalPetition: {
          jurisdictionConnection: {},
          reasonForDivorce: 'desertion',
          reasonForDivorceDesertionDetails: 'I was deserted'
        }
      };
      return content(
        ReviewApplication,
        session,
        { specificValues: [session.originalPetition.reasonForDivorceDesertionDetails] }
      );
    });
  });

  describe('Respondent Brexit policy wording', () => {
    it('Displays new Legal policy wording for Brexit', () => {
      const session = {
        originalPetition: {
          newLegalConnectionPolicy: 'Yes',
          jurisdictionConnectionNewPolicy: ['G', 'H', 'I']
        }
      };
      return content(
        ReviewApplication,
        session,
        { specificContent: ['jurisdictionConnectionNewPolicyOther', 'jurisdictionConnectionPetDomiciled', 'jurisdictionConnectionResDomiciled'] }
      );
    });

    it('Does not display new Legal policy wording for Brexit due to older case', () => {
      const session = {
        originalPetition: {
          jurisdictionConnection: ['G'],
          jurisdictionConnectionNewPolicy: ['G']
        }
      };
      return content(
        ReviewApplication,
        session,
        { specificContent: ['jurisdictionConnectionOther'] }
      );
    });
  });

  describe('content', () => {
    const ignoreContent = [
      'webChatTitle',
      'chatDown',
      'chatWithAnAgent',
      'noAgentsAvailable',
      'allAgentsBusy',
      'chatClosed',
      'chatAlreadyOpen',
      'chatOpeningHours',
      'amendAppDetails',
      'coRespondentsCorrespondenceAddress',
      'coRespondent',
      'reasonForDivorceAdulteryCorrespondentNamed',
      'reasonForDivorceAdulteryCorrespondentNotNamed',
      'reasonForDivorceAdulteryStatement',
      'reasonForDivorceAdulteryWhere',
      'reasonForDivorceAdulteryWhen',
      'statementOfSecondHandInformationAboutAdultery',
      'reasonForDivorceUnreasonableBehaviourBrokenDown',
      'reasonForDivorceSeparationFiveYears2DatesRecent',
      'reasonForDivorceSeparationTwoYears2DatesRecent',
      'reasonForDivorceUnreasonableBehaviourStatement',
      'reasonForDivorceSeparationTwoYears',
      'reasonForDivorceSeparationTwoYearsBrokenDown',
      'reasonForDivorceSeparationFiveYears',
      'reasonForDivorceSeparationFiveYearsBrokenDown',
      'reasonForDivorceDesertion',
      'reasonForDivorceDesertionAgreed',
      'descriptionOfAdultery',
      'coRespRoleExplain',
      'descriptionOfBehaviour',
      'descriptionOfDesertion',
      'reasonForDivorceDesertionBrokenDown',
      'reasonForDivorceDesertionStatement',
      'claimingCostsFromRespondentCoRespondent',
      'claimingCostsFromCoRespondent',
      'claimingCostsFromRespondent',
      'financialOrdersPropertyMoneyPensionsChildren',
      'financialOrdersChildren',
      'financialOrdersPropertyMoneyPensions',
      'applicantsCorrespondenceAddress',
      'costsPetitionerPayedByRespondentAndCorrespondent',
      'costsPetitionerPayedByCorrespondent',
      'costsPetitionerPayedByRespondent',
      'costsPetitionerDivorceCostsByRespondentAndCorespondent',
      'costsPetitionerDivorceCostsByCorespondent',
      'costsPetitionerDivorceCostsByRespondent',
      'costsPetitionerDivorceCostsByFinancialOrder',
      'jurisdictionConnectionBothResident',
      'jurisdictionConnectionBothDomiciled',
      'jurisdictionConnectionPetDomiciled',
      'jurisdictionConnectionResDomiciled',
      'jurisdictionConnectionNewPolicyOther',
      'jurisdictionConnectionOneResides',
      'jurisdictionConnectionPetitioner',
      'jurisdictionConnectionRespondent',
      'jurisdictionConnectionPetitionerSixMonths',
      'jurisdictionConnectionOther',
      'onGoingCasesNo',
      'petitionerCorrespondenceAddressHeading',
      'whereTheMarriage',
      'readConfirmationQuestion',
      'readConfirmationYes',
      'readConfirmationNo',
      'reasonForDivorceSeparationFiveYearsOver',
      'reasonForDivorceSeparationFiveYearsLvingApart',
      'reasonForDivorceSeparationFiveYears2DatesRecent',
      'signIn',
      'signOut',
      'languageToggle',
      'thereWasAProblem',
      'change',
      'husband',
      'wife'
    ];

    it('all', () => {
      const session = {
        originalPetition: {
          jurisdictionConnection: {}
        }
      };
      return content(ReviewApplication, session, { ignoreContent });
    });

    context('intro text - claim costs & finantial order', () => {
      it('from respondent and co-respondent', () => {
        const session = {
          originalPetition: {
            jurisdictionConnection: {},
            claimsCosts: 'Yes',
            financialOrder: 'Yes',
            financialOrderFor: [],
            claimsCostsFrom: ['respondent', 'correspondent']
          }
        };
        return content(
          ReviewApplication,
          session,
          { specificContent: ['costsPetitionerPayedByRespondentAndCorrespondent'] }
        );
      });
      it('from co-respondent', () => {
        const session = {
          originalPetition: {
            jurisdictionConnection: {},
            claimsCosts: 'Yes',
            financialOrder: 'Yes',
            financialOrderFor: [],
            claimsCostsFrom: ['correspondent']
          }
        };
        return content(ReviewApplication, session, {
          specificContent: ['costsPetitionerPayedByCorrespondent']
        });
      });

      it('from neither respondent or co-respondent', () => {
        const session = {
          originalPetition: {
            jurisdictionConnection: {},
            claimsCosts: 'Yes',
            financialOrder: 'Yes',
            financialOrderFor: [],
            claimsCostsFrom: []
          }
        };
        return content(
          ReviewApplication,
          session,
          { specificContent: ['costsPetitionerPayedByRespondent'] });
      });

      it('when claims costs is null', () => {
        const session = {
          originalPetition: {
            jurisdictionConnection: {},
            claimsCosts: 'Yes',
            financialOrder: 'Yes',
            financialOrderFor: []
          }
        };
        return content(
          ReviewApplication,
          session,
          { specificContent: ['costsPetitionerPayedByRespondent'] });
      });
    });

    context('claim costs only', () => {
      it('from respondent and co-respondent', () => {
        const session = {
          originalPetition: {
            jurisdictionConnection: {},
            claimsCosts: 'Yes',
            financialOrder: 'No',
            claimsCostsFrom: ['respondent', 'correspondent']
          }
        };
        return content(
          ReviewApplication,
          session,
          { specificContent: ['costsPetitionerDivorceCostsByRespondentAndCorespondent'] }
        );
      });
      it('from co-respondent', () => {
        const session = {
          originalPetition: {
            jurisdictionConnection: {},
            claimsCosts: 'Yes',
            financialOrder: 'No',
            claimsCostsFrom: ['correspondent']
          }
        };
        return content(
          ReviewApplication,
          session,
          { specificContent: ['costsPetitionerDivorceCostsByCorespondent'] });
      });

      it('from neither respondent or co-respondent', () => {
        const session = {
          originalPetition: {
            jurisdictionConnection: {},
            claimsCosts: 'Yes',
            financialOrder: 'No',
            claimsCostsFrom: []
          }
        };
        return content(
          ReviewApplication,
          session,
          { specificContent: ['costsPetitionerDivorceCostsByRespondent'] });
      });

      it('when claims costs is null', () => {
        const session = {
          originalPetition: {
            jurisdictionConnection: {},
            claimsCosts: 'Yes',
            financialOrder: 'No'
          }
        };
        return content(
          ReviewApplication,
          session,
          { specificContent: ['costsPetitionerDivorceCostsByRespondent'] });
      });
    });

    it('financialOrderFor only', () => {
      const session = {
        originalPetition: {
          jurisdictionConnection: {},
          claimsCosts: 'No',
          financialOrder: 'Yes',
          financialOrderFor: 'petitioner',
          claimsCostsFrom: []
        }
      };
      return content(
        ReviewApplication,
        session,
        { specificContent: ['costsPetitionerDivorceCostsByFinancialOrder'] });
    });

    it('not claiming costs or applying for financial Order', () => {
      const session = {
        originalPetition: {
          jurisdictionConnection: {},
          claimsCosts: 'No',
          financialOrder: 'No',
          claimsCostsFrom: []
        }
      };
      return content(
        ReviewApplication,
        session,
        { specificContent: ['costsPetitionerDivorceNoCosts'] });
    });

    it('shows details for co-respondent', () => {
      const session = {
        originalPetition: {
          jurisdictionConnection: {},
          reasonForDivorce: 'adultery',
          reasonForDivorceAdulteryWishToName: 'Yes',
          reasonForDivorceAdultery3rdPartyFirstName: 'first name',
          reasonForDivorceAdultery3rdPartyLastName: 'last name'
        }
      };
      return content(
        ReviewApplication,
        session,
        { specificContent: ['coRespondent'] });
    });

    it('shows name for co-respondent', () => {
      const session = {
        originalPetition: {
          jurisdictionConnection: {},
          reasonForDivorce: 'adultery',
          reasonForDivorceAdulteryWishToName: 'Yes',
          reasonForDivorceAdultery3rdPartyFirstName: 'first name',
          reasonForDivorceAdultery3rdPartyLastName: 'last name'
        }
      };
      return content(
        ReviewApplication,
        session,
        { specificContent: ['coRespondent'] });
    });

    context('jurisdiction', () => {
      it('for both resident', () => {
        const session = {
          originalPetition: {
            jurisdictionConnection: { A: '', C: '' },
            reasonForDivorce: 'adultery'
          }
        };
        return content(
          ReviewApplication,
          session,
          {
            specificContent: [
              'jurisdictionConnectionBothResident',
              'jurisdictionConnectionRespondent'
            ]
          });
      });
      it('for one resides', () => {
        const session = {
          originalPetition: {
            jurisdictionConnection: { B: '' },
            reasonForDivorce: 'adultery'
          }
        };
        return content(
          ReviewApplication,
          session,
          { specificContent: ['jurisdictionConnectionOneResides'] });
      });
      it('respondent', () => {
        const session = {
          originalPetition: {
            jurisdictionConnection: { C: '' },
            reasonForDivorce: 'adultery'
          }
        };
        return content(
          ReviewApplication,
          session,
          { specificContent: ['jurisdictionConnectionRespondent'] });
      });
      it('petitioner', () => {
        const session = {
          originalPetition: {
            jurisdictionConnection: { D: '' },
            reasonForDivorce: 'adultery'
          }
        };
        return content(
          ReviewApplication,
          session,
          { specificContent: ['jurisdictionConnectionPetitioner'] });
      });
      it('petitioner six months', () => {
        const session = {
          originalPetition: {
            jurisdictionConnection: { E: '' },
            reasonForDivorce: 'adultery'
          }
        };
        return content(
          ReviewApplication,
          session,
          { specificContent: ['jurisdictionConnectionPetitionerSixMonths'] });
      });
      it('both domiciled', () => {
        const session = {
          originalPetition: {
            jurisdictionConnection: { F: '' },
            reasonForDivorce: 'adultery'
          }
        };
        return content(
          ReviewApplication,
          session,
          { specificContent: ['jurisdictionConnectionBothDomiciled'] });
      });
      it('both domiciled', () => {
        const session = {
          originalPetition: {
            jurisdictionConnection: { G: '' },
            reasonForDivorce: 'adultery'
          }
        };
        return content(
          ReviewApplication,
          session,
          { specificContent: ['jurisdictionConnectionOther'] });
      });
    });

    context('legal proceedings', () => {
      it('No', () => {
        const session = {
          originalPetition: {
            jurisdictionConnection: {},
            legalProceedings: 'No'
          }
        };
        return content(
          ReviewApplication,
          session,
          { specificContent: ['onGoingCasesNo'] });
      });
      it('Yes', () => {
        const session = {
          originalPetition: {
            jurisdictionConnection: {},
            legalProceedings: 'Yes'
          }
        };
        return content(
          ReviewApplication,
          session,
          { specificContent: ['onGoingCasesYes'] });
      });
    });

    context('reasons for divorce', () => {
      context('adultery', () => {
        it('co-respondent is named', () => {
          const session = {
            originalPetition: {
              jurisdictionConnection: {},
              reasonForDivorce: 'adultery',
              reasonForDivorceAdulteryWishToName: 'Yes'
            }
          };
          return content(
            ReviewApplication,
            session,
            { specificContent: ['reasonForDivorceAdulteryCorrespondentNamed'] });
        });
        it('knows where', () => {
          const session = {
            originalPetition: {
              jurisdictionConnection: {},
              reasonForDivorce: 'adultery',
              reasonForDivorceAdulteryKnowWhere: 'Yes'
            }
          };
          return content(
            ReviewApplication,
            session,
            { specificContent: ['reasonForDivorceAdulteryWhere'] });
        });
        it('knows when', () => {
          const session = {
            originalPetition: {
              jurisdictionConnection: {},
              reasonForDivorce: 'adultery',
              reasonForDivorceAdulteryKnowWhen: 'Yes'
            }
          };
          return content(
            ReviewApplication,
            session,
            { specificContent: ['reasonForDivorceAdulteryWhen'] });
        });
        it('show details if petitioner has information from another person', () => {
          const session = {
            originalPetition: {
              jurisdictionConnection: {},
              reasonForDivorce: 'adultery',
              reasonForDivorceAdulterySecondHandInfo: 'Yes',
              reasonForDivorceAdulterySecondHandInfoDetails: 'This info came from someone else.'
            }
          };
          return content(
            ReviewApplication,
            session,
            {
              specificValues: [
                reviewApplicationContent.en.statementOfSecondHandInformationAboutAdultery,
                '"This info came from someone else."'
              ]
            }
          );
        });
        it('hide details if petitioner has not specified information from another person', () => {
          const session = {
            originalPetition: {
              jurisdictionConnection: {},
              reasonForDivorce: 'adultery',
              reasonForDivorceAdulterySecondHandInfo: 'Yes',
              reasonForDivorceAdulterySecondHandInfoDetails: ''
            }
          };
          return content(
            ReviewApplication,
            session,
            {
              specificContentToNotExist: ['statementOfSecondHandInformationAboutAdultery']
            }
          );
        });
        it('hide details if petitioner has no information from another person', () => {
          const session = {
            originalPetition: {
              jurisdictionConnection: {},
              reasonForDivorce: 'adultery',
              reasonForDivorceAdulterySecondHandInfo: 'No',
              reasonForDivorceAdulterySecondHandInfoDetails: 'this info should not be shown'
            }
          };
          return content(
            ReviewApplication,
            session,
            {
              ignoreContent,
              specificValuesToNotExist: [
                reviewApplicationContent.en.statementOfSecondHandInformationAboutAdultery,
                'this info should not be shown'
              ]
            }
          );
        });
        it('hide details if petitioner has not replied about second hand information', () => {
          const session = {
            originalPetition: {
              jurisdictionConnection: {},
              reasonForDivorce: 'adultery',
              reasonForDivorceAdulterySecondHandInfoDetails: 'this info should not be shown'
            }
          };
          return content(
            ReviewApplication,
            session,
            {
              ignoreContent,
              specificValuesToNotExist: [
                reviewApplicationContent.en.statementOfSecondHandInformationAboutAdultery,
                'this info should not be shown'
              ]
            }
          );
        });
      });

      it('unreasonable behaviour', () => {
        const session = {
          originalPetition: {
            jurisdictionConnection: {},
            reasonForDivorce: 'unreasonable-behaviour'
          }
        };
        const specificContent = [
          'reasonForDivorceUnreasonableBehaviourBrokenDown',
          'reasonForDivorceUnreasonableBehaviourStatement',
          'descriptionOfBehaviour'
        ];
        return content(ReviewApplication, session, { specificContent });
      });

      it('separation 2 years', () => {
        const session = {
          originalPetition: {
            jurisdictionConnection: {},
            reasonForDivorce: 'separation-2-years'
          }
        };
        const specificContent = [
          'reasonForDivorceSeparationTwoYearsBrokenDown',
          'reasonForDivorceSeparationTwoYears',
          'reasonForDivorceSeparationTwoYears2DatesRecent'
        ];
        return content(ReviewApplication, session, { specificContent });
      });

      it('separation 5 years', () => {
        const session = {
          originalPetition: {
            jurisdictionConnection: {},
            reasonForDivorce: 'separation-5-years'
          }
        };
        const specificContent = [
          'reasonForDivorceSeparationFiveYearsBrokenDown',
          'reasonForDivorceSeparationFiveYears',
          'reasonForDivorceSeparationFiveYears2DatesRecent'
        ];
        return content(ReviewApplication, session, { specificContent });
      });

      it('separation 5 years two date fields', () => {
        const session = {
          originalPetition: {
            jurisdictionConnection: {},
            reasonForDivorce: 'separation-5-years',
            reasonForDivorceDecisionDate: '2003-02-01T00:00:00.000+0000',
            reasonForDivorceLivingApartDate: '2003-02-01T00:00:00.000+0000'
          }
        };
        const specificContent = [
          'reasonForDivorceSeparationFiveYearsOver',
          'reasonForDivorceSeparationFiveYearsLvingApart',
          'reasonForDivorceSeparationFiveYears2DatesRecent'
        ];
        return content(ReviewApplication, session, { specificContent });
      });

      it('desertion', () => {
        const session = {
          originalPetition: {
            jurisdictionConnection: {},
            reasonForDivorce: 'desertion',
            reasonForDivorceDesertionAgreed: 'Yes'
          }
        };
        const specificContent = [
          'reasonForDivorceDesertionBrokenDown',
          'reasonForDivorceDesertion',
          'reasonForDivorceDesertionStatement',
          'reasonForDivorceDesertionAgreed'
        ];
        return content(ReviewApplication, session, { specificContent });
      });
    });

    context('cost orders', () => {
      it('from respondent and co-respondent', () => {
        const session = {
          originalPetition: {
            jurisdictionConnection: {},
            claimsCosts: 'Yes',
            claimsCostsFrom: ['respondent', 'correspondent']
          }
        };
        return content(
          ReviewApplication,
          session,
          { specificContent: ['claimingCostsFromRespondentCoRespondent'] });
      });
      it('from co-respondent', () => {
        const session = {
          originalPetition: {
            jurisdictionConnection: {},
            claimsCosts: 'Yes',
            claimsCostsFrom: ['correspondent']
          }
        };
        return content(
          ReviewApplication,
          session,
          { specificContent: ['claimingCostsFromCoRespondent'] });
      });

      it('from neither respondent or co-respondent', () => {
        const session = {
          originalPetition: {
            jurisdictionConnection: {},
            claimsCosts: 'Yes',
            claimsCostsFrom: []
          }
        };
        return content(
          ReviewApplication,
          session,
          { specificContent: ['claimingCostsFromRespondent'] });
      });

      it('not claiming', () => {
        const session = {
          originalPetition: {
            jurisdictionConnection: {},
            claimsCosts: 'No',
            claimsCostsFrom: []
          }
        };
        return content(
          ReviewApplication,
          session,
          { specificContent: ['notClaimingForDivorce'] });
      });
    });

    context('finantial orders', () => {
      it('for children and petitioner', () => {
        const session = {
          originalPetition: {
            jurisdictionConnection: {},
            financialOrder: 'Yes',
            financialOrderFor: ['children', 'petitioner']
          }
        };
        return content(
          ReviewApplication,
          session,
          { specificContent: ['financialOrdersPropertyMoneyPensionsChildren'] }
        );
      });
      it('for children', () => {
        const session = {
          originalPetition: {
            jurisdictionConnection: {},
            financialOrder: 'Yes',
            financialOrderFor: ['children']
          }
        };
        return content(
          ReviewApplication,
          session,
          { specificContent: ['financialOrdersChildren'] });
      });

      it('from neither respondent or co-respondent', () => {
        const session = {
          originalPetition: {
            jurisdictionConnection: {},
            financialOrder: 'Yes',
            financialOrderFor: []
          }
        };
        return content(
          ReviewApplication,
          session,
          { specificContent: ['financialOrdersPropertyMoneyPensions'] });
      });

      it('not claiming', () => {
        const session = {
          originalPetition: {
            jurisdictionConnection: {},
            financialOrder: 'No',
            claimsCostsFrom: []
          }
        };
        return content(
          ReviewApplication,
          session,
          { specificContent: ['financialOrdersNone'] });
      });
    });

    it('Petitioner Address if not confidential', () => {
      const session = {
        originalPetition: {
          jurisdictionConnection: {},
          petitionerContactDetailsConfidential: 'share',
          petitionerCorrespondenceAddress: {
            address: '129 king road'
          }
        }
      };
      return content(
        ReviewApplication,
        session,
        { specificValues: [session.originalPetition.petitionerCorrespondenceAddress.address] });
    });

    it('CoRespondent Address', () => {
      const session = {
        originalPetition: {
          jurisdictionConnection: {},
          reasonForDivorceAdultery3rdAddress: ['line1', 'line2', 'postcode']
        }
      };
      return content(
        ReviewApplication,
        session,
        { specificContent: ['coRespondentsCorrespondenceAddress'] });
    });
  });
});
