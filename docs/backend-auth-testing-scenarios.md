# Backend auth/health testing scenarios

Scenarios for the login/signup flow and API health checks, matching the flight-booking
example format. Each maps to one or more Pytest tests in `server/tests/`.

1. **New user signs up successfully.**
   User submits a valid email + password on the Sign Up screen. The account is created and
   the user is issued a session token, landing on the Dashboard.
   Test: `test_register_creates_user_and_returns_token` (`server/tests/test_auth.py`).

2. **User signs up with a weak password.**
   User submits a password missing a digit or a letter. The form is rejected with a
   specific validation message and no account is created.
   Tests: `test_register_rejects_password_without_digit`,
   `test_register_rejects_password_without_letter`.

3. **User signs up with an email that's already registered.**
   User submits the sign-up form with an email already in the system. They see
   "Email already registered" and no duplicate account is created.
   Test: `test_register_rejects_duplicate_email`.

4. **Returning user logs in successfully.**
   User enters their correct email/password on the Log In screen and is issued a session
   token, landing on the Dashboard.
   Test: `test_login_succeeds_with_correct_credentials`.

5. **Returning user enters the wrong password.**
   User enters a valid email with an incorrect password and sees a generic
   "Invalid email or password" error (no hint about which field was wrong).
   Tests: `test_login_rejects_wrong_password`, `test_login_rejects_unknown_email`.

6. **App checks who's logged in.**
   Once logged in, the app calls `/auth/me` with the session token to show the user's
   email in the sidebar; an invalid/missing token is rejected instead of leaking data.
   Tests: `test_me_requires_valid_token`, `test_me_returns_current_user_for_valid_token`.

7. **API/DB health check (Status panel on the Dashboard).**
   The Dashboard's "Status" panel calls `GET /` and `GET /health/db` to confirm the API and
   Supabase connection are up, and surfaces a failure instead of a blank screen if the
   database is unreachable.
   Tests: `test_root_health_check`, `test_db_health_check_ok`,
   `test_db_health_check_failure_surfaces_503`.
