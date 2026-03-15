Laboratory Activity: Security Peer Review & Rapid Retrospective
Course: Information Assurance and Security 2
Module: 12 - Final Back-End Security Demo
Objective: To practice evaluating a peer's project against core security criteria and to reflect on
your own project's security posture in a timed setting.
Group No.:
Name:
Part 1: The Peer Security Review
1. Pair Up: Find a partner / Group. Decide whose project will be reviewed first. You will
only have time to review one project in detail during this lab.
2. Reviewer's Setup: The reviewer should open the "Peer Security Checklist" below. The
project owner should have their project (code, demo video, or README) ready to share.
3. Hands-On Review:
o The project owner briefly shows the reviewer the relevant parts of their project
(e.g., login page, code for input validation, database screenshot showing hashed
passwords, deletion function, error logs).
o As the owner explains or demonstrates, the reviewer fills out the checklist
below.
o Crucially, the reviewer should ask questions like:
▪ "Can you show me the code where you sanitize that input?"
▪ "How can you prove that the password is hashed in the database?"
▪ "What happens in the logs if I try to log in with a wrong username?"
o The goal is not just to tick boxes, but to understand how the security is
implemented.
Checklist Item
Secure
(✓)
Needs
Fix (-)
Remarks/Observation (e.g.,
"Used bcrypt for
passwords," "Saw raw SQL
in code")
1. Authentication &
Authorization: Login requires
encrypted credentials (e.g., HTTPS in
transit, hashed in DB). Access to
restricted routes (e.g., /admin) is
properly controlled.
2. Input Validation & Data
Handling: Evidence of sanitized
inputs to prevent SQLi or XSS (e.g.,
using parameterized queries,
escaping output).
3. Data Protection at Rest: Sensitive
data (passwords, PII) is encrypted or
hashed in the database.
4. Secure Data Deletion: The
"delete" function truly removes
data or archives it securely, rather
than just changing its visibility.
5. Error Handling & Logging: Error
messages shown to the user are
generic. Logs do not expose
sensitive data like passwords or
database schemas.
Evaluator Remarks:
Evaluator Score:
. Checklist
Completion
&
Observation
Quality
100 pts
All 5 checklist items
are thoroughly
addressed. Each item
includes a specific,
accurate, and
insightful observation
that goes beyond a
simple "yes/no" and
demonstrates a clear
understanding of the
security concept
(e.g., "Used bcrypt
with a salt to hash
passwords,"
"Parameterized
queries are used in
the get_user function
to prevent SQLi").
90 pts
All 5 checklist
items are
addressed.
Observations
are accurate
and relevant,
demonstrating
a good
understanding
of the
concepts, but
may lack some
depth or
specificity
(e.g.,
"Passwords
are hashed,"
"Input
validation is
done").
80 pts
Most (3-4)
checklist
items are
addressed.
Observations
are present
but may be
vague,
generic, or
contain
minor
inaccuracies
(e.g., "Looks
secure,"
"Login
works").
Some items
may be left
blank or
unchecked.
60 pts
Fewer than 3
checklist items
are addressed.
Observations are
missing,
incorrect, or
demonstrate a
fundamental
misunderstanding
of the security
concept. The
checklist is largely
incomplete.
/100