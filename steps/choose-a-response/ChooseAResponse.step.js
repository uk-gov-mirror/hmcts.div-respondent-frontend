const { Question } = require('@hmcts/one-per-page/steps');
const { answer } = require('@hmcts/one-per-page/checkYourAnswers');
const { redirectTo, branch } = require('@hmcts/one-per-page/flow');
const { form, text } = require('@hmcts/one-per-page/forms');
const Joi = require('joi');
const idam = require('services/idam');
const config = require('config');
const content = require('./ChooseAResponse.content');
const { getFeeFromFeesAndPayments } = require('middleware/feesAndPaymentsMiddleware');

const consts = {
  proceed: 'proceed',
  proceedButDisagree: 'proceedButDisagree',
  defend: 'defend',
  yes: 'Yes',
  no: 'No',
  behavior: 'unreasonable-behaviour',
  separation5yrs: 'separation-5-years'
};

class ChooseAResponse extends Question {
  static get path() {
    return config.paths.chooseAResponse;
  }

  get consts() {
    return consts;
  }

  get session() {
    return this.req.session;
  }

  get feesDefendDivorce() {
    return this.res.locals.applicationFee.DefendDivorcePayService.amount;
  }

  get isBehaviour() {
    const reasonForDivorce = this.session.originalPetition.reasonForDivorce;
    return reasonForDivorce === consts.behavior;
  }

  get form() {
    const constants = consts;
    const answers = [
      constants.proceed,
      constants.proceedButDisagree,
      constants.defend
    ];

    const validAnswers = Joi.string()
      .valid(answers)
      .required();

    const response = text
      .joi(this.content.errors.required, validAnswers);

    return form({ response });
  }

  values() {
    const response = this.fields.response.value;

    if (this.isBehaviour) {
      switch (response) {
      case consts.proceed:
        return {
          respDefendsDivorce: consts.no,
          respAdmitOrConsentToFact: consts.yes
        };
      case consts.proceedButDisagree:
        return {
          respDefendsDivorce: consts.no,
          respAdmitOrConsentToFact: consts.no
        };
      case consts.defend:
        return {
          respDefendsDivorce: consts.yes,
          respAdmitOrConsentToFact: consts.no
        };
      default:
        throw new Error(`Unknown response to behavior: '${response}'`);
      }
    }

    const respDefendsDivorce = response === consts.proceed ? consts.no : consts.yes;
    return { respDefendsDivorce };
  }

  answers() {
    const response = this.fields.response.value;

    if (response) {
      const question = content.en.title;
      const cyaContent = content.en.fields[response].answer;
      return answer(this, {
        question,
        answer: cyaContent
      });
    }
    return super.answers();
  }

  get middleware() {
    return [
      ...super.middleware,
      idam.protect(),
      getFeeFromFeesAndPayments('DefendDivorcePayService')
    ];
  }

  next() {
    const response = this.fields.response;
    const isDefend = response.value === consts.defend;
    const isProceed = response.value === consts.proceed;
    const fiveYearSeparation = this.session.originalPetition.reasonForDivorce === consts.separation5yrs;

    return branch(
      redirectTo(this.journey.steps.DefendFinancialHardship)
        .if(isDefend && fiveYearSeparation),
      redirectTo(this.journey.steps.FinancialSituation)
        .if(isProceed && fiveYearSeparation),
      redirectTo(this.journey.steps.ConfirmDefence)
        .if(isDefend),
      redirectTo(this.journey.steps.Jurisdiction)
    );
  }
}

module.exports = ChooseAResponse;
