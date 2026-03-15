CHECKPOINT 2: SYSTEM SECURITY (Rubrics)

Course Code: ITE 370 -_____ Group #: __________
Course Description: ___IAS 2_____ Date:_______________________

Group Rubric for Class Reporting
Criteria Excellent (5) Good (4) Fair (3) Needs

Improvement (2)
SCORE

Authentication
(6)

Strong hashing,
secure sessions,
MFA, token
validation,
logout, rate
limiting

Most controls
present but
missing 1–2

Basic controls
only

No security
controls _______ /30

Input
Validation (5)

Full server
validation,
SQL/XSS/CSRF
protection,
schema checks
Some
protections
missing

Minimal
validation Lack validation _______ /25

Database
Security (4)

Encrypted DB,
RBAC, TLS,
backups, logs

Partial
encryption or
RBAC

Weak DB
security

No security _______ /20

Threat
Modeling (3)

DFD, STRIDE,
OWASP, risk
scoring,
mitigation

Partial
analysis

Minimal
documentation Basic/inconsistent _______/15

Documentation
(2)

Complete,
secure, clear
docs

Mostly
complete Basic docs

Poorly written

_______ /10

TOTAL SCORE: (60%)

ITE 370 – IAS 2 Dr. Engelbert Q. Cruz
Individual Rubric for Class Reporting
Criteria Excellent (5) Good (4) Fair (3) Needs
Improvement
(2)

Score

Knowledge of
Topic

Deep
understanding
Good
understanding

Somewhat
unclear

Poor
understanding

Preparedness Fully
prepared

Mostly
prepared

Some
preparation

Unprepared

Speaking
Skills

Clear,
confident,
good pace

Mostly clear Unclear at
times

Poor clarity

Ability to
answer

Excellent and
creative

Clear and
relevant

Basic No idea at all

Teamwork All members
participated
equally

Most
participated

Unequal
participation

Very uneven
or poor
collaboration

TOTAL SCORE: (40%)

NAME

Knowledge
of Topic

Prepared
ness

Speaking
Skills

Ability
to
answer
Teamwork Total
Score:

1.
2.
3.
4.
5.
6.
7.
8.
9.
10.
Comments:
__________________________________________________________________
__________________________________________________________________
__________________________________________________________________

ITE 370 – IAS 2 Dr. Engelbert Q. Cruz
CHECKPOINT 2: SYSTEM SECURITY CHECKLIST
Category 1: Authentication
• ☐ Strong password hashing (bcrypt/Argon2)
• ☐ Secure sessions with expiry
• ☐ Generic login errors
• ☐ Rate limiting for logins
• ☐ MFA available or enforced
• ☐ Validated tokens (JWT)
• ☐ Strong password policy
• ☐ Logout invalidates session
• ☐ OAuth/SSO or advanced auth (bonus)

Category 2: Input Validation
• ☐ All inputs validated server-side
• ☐ Parameterized SQL queries
• ☐ XSS protection (context-aware escaping)
• ☐ File upload validation (type + size)
• ☐ API schema validation
• ☐ NoSQL injection protection
• ☐ CSRF tokens enabled

Category 3: Database Security
• ☐ Secure credential storage (.env/vault)
• ☐ Role-based access control

ITE 370 – IAS 2 Dr. Engelbert Q. Cruz
• ☐ Database encryption at rest
• ☐ Encrypted backups
• ☐ Audit logging enabled
• ☐ TLS database connections
• ☐ Database hardening

Category 4: Threat Modeling
• ☐ Data Flow Diagram created
• ☐ STRIDE threats identified
• ☐ OWASP Top 10 mapped
• ☐ Mitigation plan with priorities
• ☐ Risk assessment done
• ☐ Model updated regularly
• ☐ Well-documented

Category 5: Documentation
• ☐ Complete README
• ☐ Security documentation
• ☐ API documentation
• ☐ Deployment guide
• ☐ Troubleshooting section
• ☐ Maintenance notes
• ☐ Organized & accessible docs

ITE 370 – IAS 2 Dr. Engelbert Q. Cruz
SYSTEM SECURITY CHECKPOINT FORM
Tick (✔) the box that best describes the system.
For Faculty Evaluator use

Category 1: Authentication
Criteria

Checkpoint
Questions

Password
Storage

Are
passwords
hashed
securely?
☐
Plaintext
☐
MD5/SHA1
☐
bcrypt/Argon2

☐ bcrypt + salt/pepper

Session
Management

Do sessions
expire and use
secure flags?

☐ None ☐ No expiry ☐ Expiry set ☐ Expiry + secure flags

Error
Handling

Do login
errors leak
info?

☐ Leaks ☐
Inconsistent

☐ Generic ☐ Generic + logs

Brute Force
Protection

Are login
attempts
limited?

☐ None ☐ Counting ☐ Rate limit ☐ Rate + CAPTCHA

MFA / 2FA Is MFA

enforced? ☐ None ☐ Planned ☐ Optional ☐ Mandatory (admin)

Token
Security

Are auth
tokens
validated?

☐ None ☐ Basic

☐ JWT
validated

☐ Short-lived + refresh

Password
Policy

Is there a
strong
password
policy?

☐ None ☐ Length ☐ Length +
complexity

☐ + expiration

Logout /
Inactivity

Does logout
destroy the
session?

☐ None ☐ Partial ☐ Invalidate ☐ Auto timeout

ITE 370 – IAS 2 Dr. Engelbert Q. Cruz
Criteria Checkpoint
Questions

Extra Credit

Advanced
authentication
used?

☐ None
☐
OAuth/SSO

☐ Biometrics ☐ Hardware/passkeys

Category 2: Input Validation
Criteria Checkpoint Questions
Server
Validation

Is all input validated
server-side?

☐
None
☐ Some ☐ All ☐ + Sanitization

SQL Injection Are queries protected? ☐
Raw
☐
Escaped
☐
Parameterized
☐ ORM

XSS Is output safely
escaped?

☐
None
☐ Basic

☐ Context
aware

☐ CSP + sanitize

File Upload Are uploads checked? ☐
None
☐ Type
only

☐ Type + size ☐ + scanning

API
Validation Are APIs validated? ☐
None
☐ Manual ☐ Schema ☐ Auto +
feedback

NoSQL
Injection

Are NoSQL queries
protected?

☐
None
☐ Filter ☐ Param

☐ ORM +
validation

CSRF Is CSRF protection
enabled?

☐
None
☐ Token ☐ Sync tokens ☐ SameSite +
token

Category 3: Database Security
Criteria Checkpoint
Credential
Storage

How are DB creds
stored?

☐
Hardcoded

☐ Exposed
.env

☐ Secure
.env

☐ Vault

ITE 370 – IAS 2 Dr. Engelbert Q. Cruz
Criteria Checkpoint
Access Control Who can access

DB? ☐ Admin all ☐ Roles ☐ RBAC ☐ RBAC + ABAC

Encryption at
Rest

Is data encrypted? ☐ None ☐ Some ☐ Full ☐ Field + TDE

Backup
Security

Are backups
secured? ☐ None
☐
Unencrypted
☐
Encrypted

☐ Encrypted +
offsite

Audit Logging Are DB actions

logged? ☐ None ☐ Errors ☐ Full logs ☐ Real-time
alerts

Connection
Security

Are connections
encrypted? ☐ Plain ☐ Self-signed ☐ Valid
TLS

☐ mTLS +
pinning

Hardening Is DB hardened? ☐ Default ☐ Basic
☐
Hardened

☐ Scanned +
patched

Category 4: Threat Modeling
Criteria Checkpoint
DFD

Is a data flow diagram
created?

☐
None
☐
Basic
☐ Detailed ☐ Trust boundaries

STRIDE Are threats identified? ☐
None
☐ Few
☐ All
STRIDE

☐ Detailed

OWASP Is OWASP mapped? ☐
None
☐
Basic
☐ Top 10 ☐ + CVSS

Mitigation

Is there a mitigation
plan?

☐
None
☐
Basic
☐
Prioritized

☐ Owners +
timeline

Risk
Assessment Are risks scored? ☐
None
☐
Basic
☐
Qualitative

☐ Quantitative

Updates Is model updated? ☐
Static
☐
Once
☐ Regular ☐ Automated

ITE 370 – IAS 2 Dr. Engelbert Q. Cruz
Criteria Checkpoint
Documentation Is it well documented? ☐ Poor
☐
Basic
☐ Clear ☐ Visual

Category 5: Documentation
Criteria Checkpoint
README Is there a complete README? ☐ None ☐ Basic ☐ Full + security
Security Docs Are controls documented? ☐ None ☐ List ☐ Detailed
API Docs Are APIs documented? ☐ None ☐ List ☐ Full spec
Deployment Are steps documented? ☐ None ☐ Basic ☐ Secure
Troubleshooting Are common issues listed? ☐ None ☐ Some ☐ Full
Maintenance Are updates documented? ☐ None ☐ Notes ☐ Schedule
Accessibility Is it well organized? ☐ No ☐ Basic ☐ Searchable