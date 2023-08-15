import { every, some } from "lodash";

type Reviewer = string;
type Reviewers = Array<Reviewer>;

export default class ReviewRules {
  mandatoryReviewers: Reviewers;
  optionalReviewers: Reviewers;
  actualReviewers: Reviewers;

  constructor(actualReviewers: Reviewers) {
    this.mandatoryReviewers = [];
    this.optionalReviewers = [];
    this.actualReviewers = actualReviewers;
  }

  and(reviewer: Reviewer): ReviewRules {
    this.mandatoryReviewers.push(reviewer);
    return this;
  }

  or(reviewer: Reviewer): ReviewRules {
    this.optionalReviewers.push(reviewer);
    return this;
  }

  areReviewsEnough(): boolean {
    return this.validateMandatories() && this.validateOptionals();
  }

  private validateMandatories(): boolean {
    if (this.mandatoryReviewers.length === 0) return true;
    return every(this.mandatoryReviewers, (mandatoryReview: Reviewer) => {
      return this.actualReviewers.includes(mandatoryReview);
    });
  }

  private validateOptionals(): boolean {
    if (this.optionalReviewers.length === 0) return true;
    return some(this.optionalReviewers, (optionalReview) => {
      return this.actualReviewers.includes(optionalReview);
    });
  }
}
