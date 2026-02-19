// Create application user with least privilege (readWrite on capstone_project only).
// Runs once when MongoDB data volume is first created (docker-entrypoint-initdb.d).
// Requires: MONGO_INITDB_ROOT_USERNAME, MONGO_INITDB_ROOT_PASSWORD, MONGO_APP_USER, MONGO_APP_PASSWORD.

const admin = db.getSiblingDB('admin');
admin.auth(process.env.MONGO_INITDB_ROOT_USERNAME, process.env.MONGO_INITDB_ROOT_PASSWORD);

admin.createUser({
  user: process.env.MONGO_APP_USER,
  pwd: process.env.MONGO_APP_PASSWORD,
  roles: [{ role: 'readWrite', db: 'capstone_project' }],
});

print('App user ' + process.env.MONGO_APP_USER + ' created (least privilege: readWrite on capstone_project).');
