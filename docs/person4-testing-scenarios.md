# Person 4 testing scenarios

1. Valid transaction submission
   - Scenario: A logged-in user enters a valid amount, category, date, and note, then submits a transaction successfully.
   - Corresponding unit test: `renders the amount, category, date, note, and submit controls` and `submits a valid transaction with the expected request details`.

2. Zero or negative amount validation
   - Scenario: A logged-in user enters zero or a negative amount and receives a validation error without submitting the transaction.
   - Corresponding unit test: `displays an error and does not call fetch for zero or negative amount`.

3. Future date validation
   - Scenario: A logged-in user selects a future transaction date and receives a validation error.
   - Corresponding unit test: `displays an error and does not call fetch for a future transaction date`.

4. Backend error handling
   - Scenario: A logged-in user submits a valid transaction, but the backend returns an error, so the application displays an error message.
   - Corresponding unit test: `displays an error message when the backend response is not ok`.

5. Pending request loading state
   - Scenario: A logged-in user submits a transaction and the submit button is disabled while the request is processing.
   - Corresponding unit test: `disables the submit button and shows a loading label while the request is pending`.
