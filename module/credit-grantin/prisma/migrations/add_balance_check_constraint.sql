ALTER TABLE fundos ADD CONSTRAINT balance_non_negative CHECK (balance >= 0);
