export class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class SemanticRuleException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}

export class RuleExecutionException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}

export class MissingDataException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}
